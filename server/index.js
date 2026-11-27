require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const fs = require('node:fs');
const path = require('node:path');
const db = require('./db');
const {
  createPaymentOrder,
  verifyRazorpaySignature,
  fetchRazorpayPayment,
  verifyWebhookSignature,
  sendWhatsAppTemplate,
} = require('./payments');
const {
  ALLOWED_SLOTS,
  getCloudinaryConfig,
  buildCloudinaryUrl,
  uploadToCloudinary,
} = require('./storage/cloudinary');
const {
  getSecurityConfig,
  timingSafeMatch,
  signAdminToken,
  revokeAdminToken,
  signBookingToken,
  verifySignedToken,
  extractAdminToken,
  requireAdmin,
  requireBookingAccess,
} = require('./middleware/auth');
const { apiLimiter, loginLimiter, writeLimiter } = require('./middleware/rateLimit');
const {
  PACKAGE_CATALOG,
  SERVICE_CATALOG,
  CITY_TRAVEL_CATALOG,
  UPSELL_CATALOG,
  TOKEN_ADVANCE_INR,
  idParamSchema,
  loginSchema,
  createBookingSchema,
  rescheduleSchema,
  upsellSchema,
  waitlistSchema,
  prepFormSchema,
  reviewSchema,
  leadSchema,
  campaignToggleSchema,
  artistLeaveSchema,
  journeyToggleSchema,
  verifyPaymentSchema,
  uploadImageSchema,
  validateImageMagicBytes,
} = require('./validation/schemas');

// Validate required secrets on startup (fails fast in production)
const secConfig = getSecurityConfig();

const app = express();
const PORT = process.env.PORT || 3001;

const defaultDevOrigins = 'http://localhost:5173,http://localhost:3001';
const rawAllowedOrigins = secConfig.isProd
  ? (process.env.ALLOWED_ORIGINS || '')
  : (process.env.ALLOWED_ORIGINS || defaultDevOrigins);

const allowedOrigins = rawAllowedOrigins
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: secConfig.isProd
      ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
          frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
          connectSrc: ["'self'", 'https://api.razorpay.com', 'https://lumberjack.razorpay.com', ...allowedOrigins],
        },
      }
      : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const err = new Error('Origin not allowed by CORS');
      err.status = 403;
      return callback(err);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use('/api', apiLimiter);
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

function logPaymentAudit({ bookingId = null, orderId = null, paymentId = null, eventType, status, message }) {
  try {
    db.prepare(
      `INSERT INTO payment_audit_logs (booking_id, order_id, payment_id, event_type, status, message) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(bookingId, orderId, paymentId, eventType, status, message);
  } catch {
    // Non-fatal audit insert
  }
}

const CONFIRMED_STATUSES = new Set(['confirmed', 'locked', 'token_locked']);

// Razorpay Webhook MUST use raw request body BEFORE global JSON parser
app.post('/api/webhooks/razorpay', express.raw({ type: 'application/json', limit: '256kb' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  if (!verifyWebhookSignature(req.body, typeof signature === 'string' ? signature : '')) {
    logPaymentAudit({ eventType: 'webhook.signature_failed', status: 'rejected', message: 'Invalid webhook signature' });
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Malformed webhook payload' });
  }

  const eventType = payload?.event;
  if (eventType !== 'payment.captured' && eventType !== 'payment.failed') {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const entity = payload?.payload?.payment?.entity;
  const orderId = entity?.order_id;
  const paymentId = entity?.id;
  const eventId = req.headers['x-razorpay-event-id'] || `${eventType}:${paymentId || orderId || Date.now()}`;

  if (!orderId || !paymentId) {
    return res.status(400).json({ error: 'Missing order_id or payment_id in webhook payload' });
  }

  // Replay protection
  const alreadyProcessed = db.prepare('SELECT event_id FROM webhook_events WHERE event_id = ?').get(String(eventId));
  if (alreadyProcessed) {
    return res.status(200).json({ ok: true, duplicate: true });
  }

  const paymentRecord = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(orderId);
  if (!paymentRecord) {
    return res.status(404).json({ error: 'Unknown payment order' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(paymentRecord.booking_id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (eventType === 'payment.captured') {
    if (
      entity.status !== 'captured' ||
      entity.currency !== 'INR' ||
      Number(entity.amount) !== Number(paymentRecord.amount_inr) * 100
    ) {
      logPaymentAudit({
        bookingId: booking.id,
        orderId,
        paymentId,
        eventType,
        status: 'rejected',
        message: 'Amount, currency, or capture status mismatch',
      });
      return res.status(400).json({ error: 'Payment amount, currency, or status mismatch' });
    }

    db.exec('BEGIN IMMEDIATE');
    db.prepare(`INSERT INTO webhook_events (event_id, event_type, order_id, payment_id) VALUES (?, ?, ?, ?)`).run(
      String(eventId),
      eventType,
      orderId,
      paymentId
    );
    if (!CONFIRMED_STATUSES.has(booking.status)) {
      const finalReceipt = booking.receipt_code.replace(/^HOLD-/, 'FUS-');
      db.prepare(`UPDATE payments SET status = 'verified', payment_id = ?, verified_at = datetime('now') WHERE id = ?`).run(
        paymentId,
        paymentRecord.id
      );
      db.prepare(`UPDATE bookings SET status = 'confirmed', hold_expires_at = NULL, receipt_code = ? WHERE id = ?`).run(
        finalReceipt,
        booking.id
      );
      if (!booking.receipt_code.startsWith('TOK-')) {
        db.prepare(`UPDATE calendar_dates SET status = 'locked', hold_expires_at = NULL, receipt_code = ? WHERE date_str = ?`).run(
          finalReceipt,
          booking.event_date
        );
      }
    }
    db.exec('COMMIT');
    logPaymentAudit({
      bookingId: booking.id,
      orderId,
      paymentId,
      eventType,
      status: 'confirmed',
      message: 'Webhook captured and confirmed booking',
    });
    return res.status(200).json({ ok: true });
  }

  // payment.failed — NEVER release an already confirmed/locked booking
  db.exec('BEGIN IMMEDIATE');
  db.prepare(`INSERT INTO webhook_events (event_id, event_type, order_id, payment_id) VALUES (?, ?, ?, ?)`).run(
    String(eventId),
    eventType,
    orderId,
    paymentId
  );
  if (!CONFIRMED_STATUSES.has(booking.status)) {
    const reason = String(entity.error_description || entity.error_code || 'Payment failed').slice(0, 200);
    db.prepare(`UPDATE payments SET status = 'failed', failure_reason = ? WHERE id = ?`).run(reason, paymentRecord.id);
    if (booking.status === 'pending_payment') {
      db.prepare(`UPDATE bookings SET status = 'expired', hold_expires_at = NULL WHERE id = ?`).run(booking.id);
      if (!booking.receipt_code.startsWith('TOK-')) {
        db.prepare(
          `UPDATE calendar_dates SET status = 'available', bride_name = NULL, package_name = NULL, city = NULL, hold_expires_at = NULL, receipt_code = NULL WHERE date_str = ? AND status != 'locked'`
        ).run(booking.event_date);
      }
    }
  }
  db.exec('COMMIT');
  logPaymentAudit({
    bookingId: booking.id,
    orderId,
    paymentId,
    eventType,
    status: 'failed',
    message: 'Webhook recorded failed payment safely',
  });
  return res.status(200).json({ ok: true });
});

// Safe redirect for predefined image slots when hosted on Cloudinary (zero open redirect)
app.get('/images/:slot', (req, res) => {
  const { slot } = req.params;
  if (!ALLOWED_SLOTS.has(slot)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  const cdnUrl = buildCloudinaryUrl(slot);
  if (!cdnUrl) {
    return res.status(404).json({ error: 'Image not found' });
  }
  return res.redirect(302, cdnUrl);
});

// 6 MB upload parser MUST be mounted BEFORE global 64 KB JSON parser
app.post('/api/admin/upload-image', express.json({ limit: '6mb' }), requireAdmin, async (req, res) => {
  const parsed = uploadImageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid upload slot or image payload.' });
  }
  const { slot, dataUrl } = parsed.data;
  if (!ALLOWED_SLOTS.has(slot)) {
    return res.status(400).json({ error: 'Invalid image slot.' });
  }
  if (/svg/i.test(dataUrl.slice(0, 40)) || !/^data:image\/(jpeg|jpg|png|webp);base64,/.test(dataUrl)) {
    return res.status(400).json({ error: 'Unsupported image format. Only JPEG, PNG, and WebP are allowed.' });
  }
  const base64 = dataUrl.split(',')[1];
  if (!base64) return res.status(400).json({ error: 'Invalid base64 image' });

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > 5 * 1024 * 1024 || !validateImageMagicBytes(buffer)) {
    return res.status(400).json({ error: 'Image failed magic-byte signature validation or exceeds 5MB.' });
  }

  const cloudCfg = getCloudinaryConfig();
  if (cloudCfg.configured) {
    try {
      const uploaded = await uploadToCloudinary({ slot, dataUrl });
      return res.json({
        ok: true,
        provider: 'cloudinary',
        path: `/images/${slot}`,
        secure_url: uploaded.secure_url,
        public_id: uploaded.public_id,
      });
    } catch {
      return res.status(502).json({ error: 'Cloud image upload failed. Existing image was preserved.' });
    }
  }

  if (secConfig.isProd) {
    return res.status(503).json({ error: 'Cloud image storage is not configured in production.' });
  }

  // Development-only local filesystem fallback
  const imagesDir = path.join(__dirname, '..', 'public', 'images');
  fs.mkdirSync(imagesDir, { recursive: true });
  fs.writeFileSync(path.join(imagesDir, slot), buffer);
  return res.json({
    ok: true,
    provider: 'local-dev',
    path: `/images/${slot}`,
    secure_url: `/images/${slot}`,
    public_id: `local/${slot}`,
  });
});

// Strict 64 KB limit for all other API JSON payloads
app.use(express.json({ limit: '64kb' }));

// ---------------------------------------------------------------------------
// Admin Auth
// ---------------------------------------------------------------------------
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'PIN format is invalid.' });
  }
  const { adminPin, isProd } = getSecurityConfig();
  if (!timingSafeMatch(parsed.data.pin, adminPin)) {
    return res.status(401).json({ error: 'Invalid Owner PIN' });
  }
  const token = signAdminToken();
  res.cookie('fusion_admin_session', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 3600 * 1000,
  });
  res.json({ ok: true });
});

app.get('/api/admin/session', (req, res) => {
  const data = verifySignedToken(extractAdminToken(req));
  if (!data || data.role !== 'owner') {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true });
});

app.post('/api/admin/logout', (req, res) => {
  revokeAdminToken(extractAdminToken(req));
  res.clearCookie('fusion_admin_session', { path: '/' });
  res.json({ ok: true });
});

// Predefined image slots are enforced via ALLOWED_SLOTS from ./storage/cloudinary

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function releaseExpiredHolds() {
  const now = Date.now();
  const expiredDates = db
    .prepare(`SELECT date_str FROM calendar_dates WHERE status = 'hold' AND hold_expires_at IS NOT NULL AND hold_expires_at <= ?`)
    .all(now);
  const expiredStandalone = db
    .prepare(`SELECT id FROM bookings WHERE status IN ('hold', 'pending_payment') AND hold_expires_at IS NOT NULL AND hold_expires_at <= ?`)
    .all(now);

  if (expiredDates.length === 0 && expiredStandalone.length === 0) return;

  db.exec('BEGIN IMMEDIATE');
  try {
    const resetDate = db.prepare(
      `UPDATE calendar_dates SET status = 'available', bride_name = NULL, package_name = NULL, city = NULL, hold_expires_at = NULL, receipt_code = NULL WHERE date_str = ? AND status = 'hold'`
    );
    const expireByDate = db.prepare(
      `UPDATE bookings SET status = 'expired', hold_expires_at = NULL WHERE event_date = ? AND status IN ('hold', 'pending_payment')`
    );
    const notifyWaitlist = db.prepare(`UPDATE waitlist SET notified = 1 WHERE date_str = ?`);
    for (const row of expiredDates) {
      resetDate.run(row.date_str);
      expireByDate.run(row.date_str);
      notifyWaitlist.run(row.date_str);
    }

    // Also expire standalone pending_payment / hold bookings (e.g. token bookings without calendar_dates row)
    db.prepare(
      `UPDATE bookings SET status = 'expired', hold_expires_at = NULL WHERE status IN ('hold', 'pending_payment') AND hold_expires_at IS NOT NULL AND hold_expires_at <= ?`
    ).run(now);

    db.exec('COMMIT');
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
function sanitizeBookingPublic(b) {
  if (!b) return null;
  const { phone: _omitted, ...safe } = b;
  return safe;
}

// Public & Customer Endpoints
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, salon: 'FUSION - THE MAGICAL MIRROR', city: 'Ajmer' });
});

// Public artist roster (omits private phone numbers)
app.get('/api/artists', (_req, res) => {
  const artists = db
    .prepare('SELECT id, name, specialty, experience, rating, leave_dates FROM artists ORDER BY id ASC')
    .all();
  res.json({ artists });
});

app.patch('/api/artists/:id/leave', requireAdmin, (req, res) => {
  const param = idParamSchema.safeParse(req.params);
  if (!param.success) return res.status(400).json({ error: 'Invalid artist id' });
  const parsed = artistLeaveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid date_str' });
  const { id } = param.data;
  const { date_str } = parsed.data;
  const artist = db.prepare('SELECT * FROM artists WHERE id = ?').get(id);
  if (!artist) return res.status(404).json({ error: 'Artist not found' });
  const currentLeaves = artist.leave_dates ? artist.leave_dates.split(',').filter(Boolean) : [];
  const nextLeaves = currentLeaves.includes(date_str)
    ? currentLeaves.filter((d) => d !== date_str)
    : [...currentLeaves, date_str];
  db.prepare('UPDATE artists SET leave_dates = ? WHERE id = ?').run(nextLeaves.join(','), id);
  res.json({ artist: db.prepare('SELECT * FROM artists WHERE id = ?').get(id) });
});

// Public calendar (strips customer PII)
app.get('/api/calendar', (_req, res) => {
  releaseExpiredHolds();
  const dates = db
    .prepare('SELECT date_str, day_num, status, hold_expires_at FROM calendar_dates ORDER BY day_num ASC')
    .all();
  res.json({ dates, serverTime: Date.now() });
});

app.post('/api/bookings', writeLimiter, async (req, res) => {
  releaseExpiredHolds();
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid booking input' });
  }

  const {
    customer_name,
    phone,
    city,
    event_date,
    package_name,
    service_ids,
    makeup_type,
    lehenga_colour,
    jewellery,
    artist_name,
    mode,
  } = parsed.data;

  // Authoritative server-side pricing
  let basePrice = 0;
  let advanceAmount = TOKEN_ADVANCE_INR;
  let resolvedPackageName = package_name;
  let resolvedMakeupType = makeup_type;

  if (mode === 'token') {
    if (!service_ids || service_ids.length === 0) {
      return res.status(400).json({ error: 'At least one valid service_id is required for ₹199 token booking.' });
    }
    const selectedServices = [];
    for (const sid of service_ids) {
      const svc = SERVICE_CATALOG[sid];
      if (!svc) {
        return res.status(400).json({ error: `Unknown service id: ${sid}` });
      }
      basePrice += svc.price;
      selectedServices.push(svc.name);
    }
    advanceAmount = TOKEN_ADVANCE_INR;
    resolvedPackageName = `Daily Salon (${selectedServices.length} Services)`;
    resolvedMakeupType = selectedServices.join(', ');
  } else {
    const pkg = PACKAGE_CATALOG[package_name];
    if (!pkg) {
      return res.status(400).json({ error: 'Unknown package_name selected.' });
    }
    basePrice = pkg.price;
    advanceAmount = pkg.advance;
  }

  const travelCharge = mode === 'token' ? 0 : (CITY_TRAVEL_CATALOG[city] ?? 0);
  const totalPrice = basePrice + travelCharge;

  const idempotencyKey = typeof req.headers['idempotency-key'] === 'string'
    ? req.headers['idempotency-key'].trim().slice(0, 100)
    : null;

  if (idempotencyKey) {
    const existingByKey = db.prepare('SELECT * FROM bookings WHERE idempotency_key = ?').get(idempotencyKey);
    if (existingByKey) {
      const existingPay = db.prepare('SELECT * FROM payments WHERE booking_id = ? ORDER BY id DESC LIMIT 1').get(existingByKey.id);
      return res.status(200).json({
        booking: sanitizeBookingPublic(existingByKey),
        receiptCode: existingByKey.receipt_code,
        idempotentReplay: true,
        payment: existingPay
          ? {
            provider: existingPay.provider,
            orderId: existingPay.order_id,
            amount: existingPay.amount_inr * 100,
            currency: existingPay.currency,
            status: existingPay.status,
          }
          : null,
      });
    }
  }

  // Canonical initial booking states: hold (48-hr unpaid) vs pending_payment (checkout initiated)
  const initialStatus = mode === 'hold' ? 'hold' : 'pending_payment';
  const holdExpiresAt = mode === 'hold' ? Date.now() + 48 * 3600 * 1000 : Date.now() + 30 * 60 * 1000;
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  const receiptCode = mode === 'token' ? `TOK-${suffix}` : `HOLD-${suffix}`;

  let createdBooking;
  try {
    db.exec('BEGIN IMMEDIATE');

    const artistBase = artist_name.split(' (')[0];
    const artistRow = db.prepare('SELECT * FROM artists WHERE name = ?').get(artistBase);
    if (artistRow && artistRow.leave_dates.split(',').includes(event_date)) {
      db.exec('ROLLBACK');
      return res.status(409).json({ error: `${artistRow.name} is on leave on ${event_date}. Please pick another artist or date.` });
    }

    const artistConflict = db
      .prepare(`SELECT id FROM bookings WHERE event_date = ? AND artist_name LIKE ? AND status IN ('confirmed', 'locked', 'hold', 'pending_payment')`)
      .get(event_date, `${artistBase}%`);
    if (mode !== 'token' && artistConflict) {
      db.exec('ROLLBACK');
      return res.status(409).json({ error: `${artistBase} already has a booking on ${event_date}. Double-booking blocked!` });
    }

    const existingDate = db.prepare('SELECT * FROM calendar_dates WHERE date_str = ?').get(event_date);
    if (mode !== 'token' && existingDate && (existingDate.status === 'locked' || existingDate.status === 'confirmed')) {
      db.exec('ROLLBACK');
      return res.status(409).json({ error: 'This date is already locked.' });
    }

    const info = db
      .prepare(`
        INSERT INTO bookings (customer_name, phone, city, event_date, package_name, makeup_type, lehenga_colour, jewellery, artist_name, travel_charge, total_price, advance_amount, status, hold_expires_at, receipt_code, idempotency_key)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        customer_name,
        phone,
        city,
        event_date,
        resolvedPackageName,
        resolvedMakeupType,
        lehenga_colour,
        jewellery,
        artistBase,
        travelCharge,
        totalPrice,
        advanceAmount,
        initialStatus,
        holdExpiresAt,
        receiptCode,
        idempotencyKey
      );

    if (mode !== 'token' && existingDate) {
      db.prepare(`
        UPDATE calendar_dates
        SET status = 'hold', bride_name = ?, package_name = ?, city = ?, hold_expires_at = ?, receipt_code = ?
        WHERE date_str = ?
      `).run(customer_name, resolvedPackageName, city, holdExpiresAt, receiptCode, event_date);
    }

    db.prepare(`
      INSERT INTO leads (name, phone, source, city, event_date, makeup_type, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      customer_name,
      phone,
      'Website',
      city,
      event_date,
      resolvedPackageName,
      mode === 'hold' ? '48-Hr Hold' : 'Pending Payment',
      `${lehenga_colour} + ${jewellery} · Receipt ${receiptCode}`
    );

    createdBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid);
    db.exec('COMMIT');
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch { /* ignore */ }
    return res.status(500).json({ error: 'Could not process booking transaction.' });
  }

  let payment;
  try {
    payment = await createPaymentOrder({
      amountInInr: advanceAmount,
      receiptCode,
      customerName: customer_name,
    });
    db.prepare(
      `INSERT INTO payments (booking_id, provider, order_id, amount_inr, currency, status) VALUES (?, ?, ?, ?, 'INR', 'created')`
    ).run(createdBooking.id, payment.provider || 'local-simulation', payment.orderId, advanceAmount);
    logPaymentAudit({
      bookingId: createdBooking.id,
      orderId: payment.orderId,
      eventType: 'order.created',
      status: 'created',
      message: `Created payment order for ₹${advanceAmount}`,
    });
  } catch (err) {
    db.exec('BEGIN IMMEDIATE');
    if (createdBooking.status === 'pending_payment') {
      db.prepare(`UPDATE bookings SET status = 'expired', hold_expires_at = NULL WHERE id = ?`).run(createdBooking.id);
      if (mode !== 'token') {
        db.prepare(
          `UPDATE calendar_dates SET status = 'available', bride_name = NULL, package_name = NULL, city = NULL, hold_expires_at = NULL, receipt_code = NULL WHERE date_str = ? AND receipt_code = ?`
        ).run(event_date, receiptCode);
      }
    }
    db.exec('COMMIT');
    logPaymentAudit({
      bookingId: createdBooking.id,
      eventType: 'order.failed',
      status: 'expired',
      message: 'Razorpay order creation failed; temporary hold released',
    });
    return res.status(502).json({ error: 'Payment gateway unavailable. Temporary hold released.' });
  }

  await sendWhatsAppTemplate({
    phone,
    templateName: 'bridal_48hr_hold',
    params: [customer_name, event_date, package_name, receiptCode],
  });

  const bookingToken = signBookingToken(createdBooking.id);
  res.cookie('fusion_booking_token', bookingToken, {
    httpOnly: true,
    secure: secConfig.isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 90 * 24 * 3600 * 1000,
  });

  res.status(201).json({
    booking: sanitizeBookingPublic(createdBooking),
    receiptCode,
    payment,
  });
});

app.post('/api/payments/verify', writeLimiter, async (req, res) => {
  const parsed = verifyPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payment verification payload.' });
  }
  const { booking_id, orderId, paymentId, signature } = parsed.data;

  // Enforce booking ownership via HttpOnly cookie or Owner session
  const adminData = verifySignedToken(extractAdminToken(req));
  const bookingCookieData = verifySignedToken(req.cookies?.fusion_booking_token || '');
  const isOwner = adminData?.role === 'owner';
  const isBookingHolder = bookingCookieData?.role === 'bride' && bookingCookieData.bookingId === booking_id;
  if (!isOwner && !isBookingHolder) {
    return res.status(403).json({ error: 'Forbidden: Valid booking session required to verify payment.' });
  }

  const paymentRecord = db
    .prepare('SELECT * FROM payments WHERE booking_id = ? AND order_id = ? ORDER BY id DESC LIMIT 1')
    .get(booking_id, orderId);
  if (!paymentRecord) {
    return res.status(404).json({ error: 'Payment order does not match this booking.' });
  }

  // Idempotent retry if the same payment was already verified
  if (paymentRecord.status === 'verified') {
    if (paymentRecord.payment_id === paymentId) {
      const existingBk = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id);
      return res.json({
        ok: true,
        verified: true,
        alreadyVerified: true,
        booking: sanitizeBookingPublic(existingBk),
        receiptCode: existingBk.receipt_code,
      });
    }
    return res.status(409).json({ error: 'Booking payment already verified under a different payment ID.' });
  }

  if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
    logPaymentAudit({ bookingId: booking_id, orderId, paymentId, eventType: 'verify.signature_failed', status: 'rejected', message: 'Invalid signature' });
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  // Fetch authoritative payment state from Razorpay (or dev simulation)
  let rzpPayment;
  try {
    rzpPayment = await fetchRazorpayPayment({
      paymentId,
      orderId,
      expectedAmountPaise: paymentRecord.amount_inr * 100,
    });
  } catch {
    return res.status(502).json({ error: 'Unable to verify payment with payment gateway.' });
  }

  if (
    !rzpPayment ||
    rzpPayment.id !== paymentId ||
    rzpPayment.order_id !== orderId ||
    rzpPayment.currency !== 'INR' ||
    Number(rzpPayment.amount) !== Number(paymentRecord.amount_inr) * 100 ||
    rzpPayment.status !== 'captured'
  ) {
    logPaymentAudit({
      bookingId: booking_id,
      orderId,
      paymentId,
      eventType: 'verify.gateway_mismatch',
      status: 'rejected',
      message: `Rejected gateway status=${rzpPayment?.status || 'unknown'}`,
    });
    return res.status(400).json({ error: 'Payment is not captured or does not match order amount/currency.' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const finalStatus = 'confirmed';
  const finalReceipt = booking.receipt_code.replace(/^HOLD-/, 'FUS-');

  db.exec('BEGIN IMMEDIATE');
  db.prepare(`UPDATE payments SET status = 'verified', payment_id = ?, verified_at = datetime('now') WHERE id = ?`).run(
    paymentId,
    paymentRecord.id
  );
  db.prepare(`UPDATE bookings SET status = ?, hold_expires_at = NULL, receipt_code = ? WHERE id = ?`).run(
    finalStatus,
    finalReceipt,
    booking_id
  );
  if (!booking.receipt_code.startsWith('TOK-')) {
    db.prepare(`UPDATE calendar_dates SET status = 'locked', hold_expires_at = NULL, receipt_code = ? WHERE date_str = ?`).run(
      finalReceipt,
      booking.event_date
    );
  }
  db.exec('COMMIT');

  logPaymentAudit({
    bookingId: booking_id,
    orderId,
    paymentId,
    eventType: 'verify.captured',
    status: 'confirmed',
    message: `Booking confirmed (${finalReceipt})`,
  });

  await sendWhatsAppTemplate({
    phone: booking.phone,
    templateName: 'bridal_booking_confirmed',
    params: [booking.customer_name, booking.event_date, booking.package_name, finalReceipt],
  });

  const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id);
  res.json({ ok: true, verified: true, booking: sanitizeBookingPublic(updated), receiptCode: finalReceipt });
});

app.post('/api/bookings/:id/pay', requireAdmin, (req, res) => {
  const param = idParamSchema.safeParse(req.params);
  if (!param.success) return res.status(400).json({ error: 'Invalid booking id' });
  const { id } = param.data;
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const receiptCode = `FUS-${String(Math.floor(1000 + Math.random() * 9000))}`;
  db.prepare(`UPDATE bookings SET status = 'locked', hold_expires_at = NULL, receipt_code = ? WHERE id = ?`).run(receiptCode, id);
  db.prepare(`UPDATE calendar_dates SET status = 'locked', hold_expires_at = NULL, receipt_code = ? WHERE date_str = ?`).run(
    receiptCode,
    booking.event_date
  );

  const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  res.json({ booking: updated, receiptCode });
});

app.post('/api/bookings/:id/reschedule', requireBookingAccess, (req, res) => {
  const param = idParamSchema.safeParse(req.params);
  if (!param.success) return res.status(400).json({ error: 'Invalid booking id' });
  const { id } = param.data;
  const parsed = rescheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid date' });
  }
  const { new_date } = parsed.data;

  db.exec('BEGIN IMMEDIATE');
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (!booking) {
    db.exec('ROLLBACK');
    return res.status(404).json({ error: 'Booking not found' });
  }
  if (booking.reschedule_count >= 1) {
    db.exec('ROLLBACK');
    return res.status(400).json({ error: 'Free 1-time reschedule already used. Contact salon desk.' });
  }
  const target = db.prepare('SELECT * FROM calendar_dates WHERE date_str = ?').get(new_date);
  if (!target || target.status !== 'available') {
    db.exec('ROLLBACK');
    return res.status(409).json({ error: 'Selected new date is not available.' });
  }

  db.prepare(`UPDATE calendar_dates SET status = 'available', bride_name = NULL, package_name = NULL, city = NULL, hold_expires_at = NULL, receipt_code = NULL WHERE date_str = ?`).run(
    booking.event_date
  );
  db.prepare(`UPDATE calendar_dates SET status = ?, bride_name = ?, package_name = ?, city = ?, receipt_code = ? WHERE date_str = ?`).run(
    booking.status,
    booking.customer_name,
    booking.package_name,
    booking.city,
    booking.receipt_code,
    new_date
  );
  db.prepare(`UPDATE bookings SET event_date = ?, reschedule_count = reschedule_count + 1 WHERE id = ?`).run(new_date, id);
  db.exec('COMMIT');

  res.json({ booking: sanitizeBookingPublic(db.prepare('SELECT * FROM bookings WHERE id = ?').get(id)) });
});

app.post('/api/bookings/:id/upsell', requireBookingAccess, (req, res) => {
  const param = idParamSchema.safeParse(req.params);
  if (!param.success) return res.status(400).json({ error: 'Invalid booking id' });
  const { id } = param.data;
  const parsed = upsellSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid upsell item' });
  }
  const { item_name } = parsed.data;
  const serverPrice = UPSELL_CATALOG[item_name];
  if (serverPrice === undefined) {
    return res.status(400).json({ error: 'Unknown upsell item' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const nextUpsells = booking.upsells ? `${booking.upsells}, ${item_name}` : item_name;
  const nextTotal = Number(booking.total_price) + serverPrice;
  db.prepare('UPDATE bookings SET upsells = ?, total_price = ? WHERE id = ?').run(nextUpsells, nextTotal, id);
  res.json({ booking: sanitizeBookingPublic(db.prepare('SELECT * FROM bookings WHERE id = ?').get(id)) });
});

app.post('/api/waitlist', writeLimiter, (req, res) => {
  const parsed = waitlistSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid waitlist data' });
  }
  const { date_str, bride_name, phone, package_name } = parsed.data;
  const info = db
    .prepare('INSERT INTO waitlist (date_str, bride_name, phone, package_name) VALUES (?, ?, ?, ?)')
    .run(date_str, bride_name, phone, package_name);
  res.status(201).json({ ok: true, id: info.lastInsertRowid, date_str });
});

app.post('/api/waitlist/:id/notify', requireAdmin, (req, res) => {
  const param = idParamSchema.safeParse(req.params);
  if (!param.success) return res.status(400).json({ error: 'Invalid waitlist id' });
  const { id } = param.data;
  db.prepare('UPDATE waitlist SET notified = 1 WHERE id = ?').run(id);
  res.json({ entry: db.prepare('SELECT * FROM waitlist WHERE id = ?').get(id) });
});

// Scoped Journey Portal (Never leaks another customer's PII publicly)
app.get('/api/journey', (req, res) => {
  const steps = db.prepare('SELECT * FROM journey_steps ORDER BY sort_order ASC').all();
  const bookingToken = req.cookies?.fusion_booking_token || '';
  const tokenData = verifySignedToken(bookingToken);
  const adminData = verifySignedToken(extractAdminToken(req));

  let activeBooking = null;
  let prepForm = null;

  if (tokenData?.role === 'bride' && tokenData.bookingId) {
    activeBooking = db.prepare('SELECT id, customer_name, city, event_date, package_name, artist_name, advance_amount, total_price, status, reschedule_count, receipt_code FROM bookings WHERE id = ?').get(tokenData.bookingId);
    prepForm = db.prepare('SELECT * FROM bride_prep_forms WHERE booking_id = ? ORDER BY id DESC LIMIT 1').get(tokenData.bookingId);
  } else if (adminData?.role === 'owner') {
    activeBooking = db.prepare(`SELECT id, customer_name, city, event_date, package_name, artist_name, advance_amount, total_price, status, reschedule_count, receipt_code FROM bookings WHERE status IN ('confirmed', 'locked', 'hold', 'pending_payment') ORDER BY id DESC LIMIT 1`).get();
    if (activeBooking) {
      prepForm = db.prepare('SELECT * FROM bride_prep_forms WHERE booking_id = ? ORDER BY id DESC LIMIT 1').get(activeBooking.id);
    }
  }

  res.json({ steps, prepForm, latestBooking: activeBooking });
});

app.patch('/api/journey/:id', requireBookingAccess, (req, res) => {
  const param = idParamSchema.safeParse(req.params);
  if (!param.success) return res.status(400).json({ error: 'Invalid journey step id' });
  const parsed = journeyToggleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid journey toggle payload' });
  const { id } = param.data;
  const { completed } = parsed.data;
  db.prepare('UPDATE journey_steps SET completed = ? WHERE id = ?').run(completed ? 1 : 0, id);
  const steps = db.prepare('SELECT * FROM journey_steps ORDER BY sort_order ASC').all();
  res.json({ steps });
});

app.post('/api/prep-form', requireBookingAccess, (req, res) => {
  const parsed = prepFormSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid prep form data' });
  }
  const targetBookingId = req.bookingAccess?.bookingId;
  if (!targetBookingId) {
    return res.status(400).json({ error: 'Booking session required to save outfit details.' });
  }
  const { lehenga_colour, blouse_note, jewellery, lens_needed, extension_needed } = parsed.data;
  const info = db
    .prepare(`
      INSERT INTO bride_prep_forms (booking_id, lehenga_colour, blouse_note, jewellery, lens_needed, extension_needed)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(targetBookingId, lehenga_colour, blouse_note, jewellery, lens_needed, extension_needed);
  res.status(201).json({ prepForm: db.prepare('SELECT * FROM bride_prep_forms WHERE id = ?').get(info.lastInsertRowid) });
});

app.get('/api/reviews', (_req, res) => {
  const reviews = db.prepare('SELECT * FROM reviews ORDER BY id DESC').all();
  res.json({ reviews });
});

app.post('/api/reviews', writeLimiter, (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid review data' });
  }
  const { bride_name, city, look_type, rating, comment } = parsed.data;
  const info = db
    .prepare(`INSERT INTO reviews (bride_name, city, look_type, rating, comment) VALUES (?, ?, ?, ?, ?)`)
    .run(bride_name, city, look_type, rating, comment);
  res.status(201).json({ review: db.prepare('SELECT * FROM reviews WHERE id = ?').get(info.lastInsertRowid) });
});

app.get('/api/campaigns', (_req, res) => {
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY id ASC').all();
  res.json({ campaigns });
});

app.patch('/api/campaigns/:id', requireAdmin, (req, res) => {
  const param = idParamSchema.safeParse(req.params);
  if (!param.success) return res.status(400).json({ error: 'Invalid campaign id' });
  const parsed = campaignToggleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid campaign toggle payload' });
  }
  const { id } = param.data;
  const { enabled } = parsed.data;
  const existing = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Campaign not found' });
  const lastSent = enabled ? `WhatsApp blast queued · ${existing.target_count} clients` : null;
  db.prepare('UPDATE campaigns SET enabled = ?, last_sent_at = ? WHERE id = ?').run(enabled ? 1 : 0, lastSent, id);
  res.json({ campaign: db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) });
});

app.post('/api/leads', writeLimiter, (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid lead data' });
  }
  const { name, phone, source, city, event_date, makeup_type, status, notes } = parsed.data;
  const info = db
    .prepare(`INSERT INTO leads (name, phone, source, city, event_date, makeup_type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(name, phone, source, city, event_date, makeup_type, status, notes);
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  releaseExpiredHolds();
  const bookings = db.prepare('SELECT * FROM bookings ORDER BY id DESC').all();
  const leads = db.prepare('SELECT * FROM leads ORDER BY id DESC').all();
  const artists = db.prepare('SELECT * FROM artists ORDER BY id ASC').all();
  const waitlist = db.prepare('SELECT * FROM waitlist ORDER BY id DESC').all();
  const pendingTimers = bookings.filter((b) => (b.status === 'hold' || b.status === 'pending_payment') && b.hold_expires_at);
  const advanceCollected = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'locked' || b.status === 'token_locked')
    .reduce((sum, b) => sum + Number(b.advance_amount || 0), 0);
  const totalRevenueProjected = bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);

  const pkgCounts = {};
  for (const b of bookings) {
    pkgCounts[b.package_name] = (pkgCounts[b.package_name] || 0) + 1;
  }
  const topPackage = Object.entries(pkgCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'HD Bridal';

  res.json({
    stats: {
      todayBookings: bookings.length,
      advanceCollected,
      pendingTimersCount: pendingTimers.length,
      totalRevenueProjected,
      topPackage,
      referralConversions: 4,
    },
    pendingTimers,
    bookings,
    leads,
    artists,
    waitlist,
    serverTime: Date.now(),
  });
});

// Production Static Frontend Serving (dist/) + SPA Fallback
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

// Centralized Safe Error Handler (never exposes stack traces, DB details, or secrets)
app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request payload exceeds allowed size limit.' });
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON request body.' });
  }
  if (err?.message === 'Origin not allowed by CORS' || err?.status === 403) {
    return res.status(403).json({ error: 'Forbidden: Origin not allowed by CORS.' });
  }
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`Fusion Salon Server running at http://localhost:${PORT} (${secConfig.isProd ? 'production' : 'development'})`);
});
