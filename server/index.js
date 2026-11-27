require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const fs = require('node:fs');
const path = require('node:path');
const db = require('./db');
const { createPaymentOrder, verifyRazorpaySignature, sendWhatsAppTemplate } = require('./payments');
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
const { loginLimiter, writeLimiter } = require('./middleware/rateLimit');
const {
  PACKAGE_CATALOG,
  CITY_TRAVEL_CATALOG,
  UPSELL_CATALOG,
  loginSchema,
  createBookingSchema,
  rescheduleSchema,
  upsellSchema,
  waitlistSchema,
  prepFormSchema,
  reviewSchema,
  leadSchema,
  campaignToggleSchema,
  verifyPaymentSchema,
  validateImageMagicBytes,
} = require('./validation/schemas');

// Validate required secrets on startup (fails fast in production)
const secConfig = getSecurityConfig();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '6mb' }));
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

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

const ALLOWED_SLOTS = new Set(['logo.jpg', 'bride-red.jpg', 'bride-pastel.jpg', 'engagement.jpg', 'groom.jpg', 'nails.jpg']);

app.post('/api/admin/upload-image', requireAdmin, (req, res) => {
  const { slot, dataUrl } = req.body || {};
  if (!ALLOWED_SLOTS.has(slot) || typeof dataUrl !== 'string' || !/^data:image\/(jpeg|jpg|png|webp);base64,/.test(dataUrl)) {
    return res.status(400).json({ error: 'Invalid slot or unsupported image format (JPEG/PNG/WebP only).' });
  }
  const base64 = dataUrl.split(',')[1];
  if (!base64) return res.status(400).json({ error: 'Invalid base64 image' });

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > 5 * 1024 * 1024 || !validateImageMagicBytes(buffer)) {
    return res.status(400).json({ error: 'Image failed magic-byte validation or exceeds 5MB.' });
  }

  const imagesDir = path.join(__dirname, '..', 'public', 'images');
  fs.mkdirSync(imagesDir, { recursive: true });
  fs.writeFileSync(path.join(imagesDir, slot), buffer);
  res.json({ ok: true, path: `/images/${slot}` });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function releaseExpiredHolds() {
  const now = Date.now();
  const expired = db
    .prepare(`SELECT date_str FROM calendar_dates WHERE status = 'hold' AND hold_expires_at IS NOT NULL AND hold_expires_at <= ?`)
    .all(now);
  if (expired.length > 0) {
    const resetDate = db.prepare(
      `UPDATE calendar_dates SET status = 'available', bride_name = NULL, package_name = NULL, city = NULL, hold_expires_at = NULL, receipt_code = NULL WHERE date_str = ?`
    );
    const expireBooking = db.prepare(`UPDATE bookings SET status = 'expired' WHERE event_date = ? AND status = 'hold'`);
    const notifyWaitlist = db.prepare(`UPDATE waitlist SET notified = 1 WHERE date_str = ?`);
    for (const row of expired) {
      resetDate.run(row.date_str);
      expireBooking.run(row.date_str);
      notifyWaitlist.run(row.date_str);
    }
  }
}

// ---------------------------------------------------------------------------
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
  const { id } = req.params;
  const { date_str } = req.body || {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date_str || '')) {
    return res.status(400).json({ error: 'Invalid date_str' });
  }
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
    makeup_type,
    lehenga_colour,
    jewellery,
    artist_name,
    mode,
  } = parsed.data;

  // Authoritative server-side pricing
  let basePrice = 0;
  let advanceAmount = 199;
  if (mode === 'token') {
    basePrice = 1499; // Daily salon services estimate; token is fixed ₹199
    advanceAmount = 199;
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

  // All pay/hold bridal bookings start in 'hold' until /api/payments/verify confirms signature
  const initialStatus = mode === 'token' ? 'hold' : 'hold';
  const holdExpiresAt = Date.now() + 48 * 3600 * 1000;
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
      .prepare(`SELECT id FROM bookings WHERE event_date = ? AND artist_name LIKE ? AND status IN ('locked', 'hold')`)
      .get(event_date, `${artistBase}%`);
    if (mode !== 'token' && artistConflict) {
      db.exec('ROLLBACK');
      return res.status(409).json({ error: `${artistBase} already has a booking on ${event_date}. Double-booking blocked!` });
    }

    const existingDate = db.prepare('SELECT * FROM calendar_dates WHERE date_str = ?').get(event_date);
    if (mode !== 'token' && existingDate && existingDate.status === 'locked') {
      db.exec('ROLLBACK');
      return res.status(409).json({ error: 'This date is already locked.' });
    }

    const info = db
      .prepare(`
        INSERT INTO bookings (customer_name, phone, city, event_date, package_name, makeup_type, lehenga_colour, jewellery, artist_name, travel_charge, total_price, advance_amount, status, hold_expires_at, receipt_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        customer_name,
        phone,
        city,
        event_date,
        package_name,
        makeup_type,
        lehenga_colour,
        jewellery,
        artistBase,
        travelCharge,
        totalPrice,
        advanceAmount,
        initialStatus,
        holdExpiresAt,
        receiptCode
      );

    if (mode !== 'token' && existingDate) {
      db.prepare(`
        UPDATE calendar_dates
        SET status = ?, bride_name = ?, package_name = ?, city = ?, hold_expires_at = ?, receipt_code = ?
        WHERE date_str = ?
      `).run(initialStatus, customer_name, package_name, city, holdExpiresAt, receiptCode, event_date);
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
      package_name,
      '48-Hr Hold',
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
  } catch (err) {
    return res.status(502).json({ error: 'Payment gateway unavailable. Hold preserved for 48 hours.' });
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
    maxAge: 90 * 24 * 3600 * 1000,
  });

  res.status(201).json({
    booking: createdBooking,
    receiptCode,
    bookingToken,
    payment,
  });
});

app.post('/api/payments/verify', writeLimiter, async (req, res) => {
  const parsed = verifyPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payment verification payload.' });
  }
  const { booking_id, orderId, paymentId, signature } = parsed.data;
  if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const finalStatus = booking.receipt_code.startsWith('TOK-') ? 'token_locked' : 'locked';
  const finalReceipt = booking.receipt_code.replace(/^HOLD-/, 'FUS-');

  db.exec('BEGIN IMMEDIATE');
  db.prepare(`UPDATE bookings SET status = ?, hold_expires_at = NULL, receipt_code = ? WHERE id = ?`).run(
    finalStatus,
    finalReceipt,
    booking_id
  );
  if (finalStatus === 'locked') {
    db.prepare(`UPDATE calendar_dates SET status = 'locked', hold_expires_at = NULL, receipt_code = ? WHERE date_str = ?`).run(
      finalReceipt,
      booking.event_date
    );
  }
  db.exec('COMMIT');

  await sendWhatsAppTemplate({
    phone: booking.phone,
    templateName: 'bridal_booking_confirmed',
    params: [booking.customer_name, booking.event_date, booking.package_name, finalReceipt],
  });

  const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id);
  res.json({ ok: true, verified: true, booking: updated, receiptCode: finalReceipt });
});

app.post('/api/bookings/:id/pay', requireAdmin, (req, res) => {
  const { id } = req.params;
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
  const { id } = req.params;
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

  res.json({ booking: db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) });
});

app.post('/api/bookings/:id/upsell', requireBookingAccess, (req, res) => {
  const { id } = req.params;
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
  res.json({ booking: db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) });
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
  res.status(201).json({ entry: db.prepare('SELECT * FROM waitlist WHERE id = ?').get(info.lastInsertRowid) });
});

app.post('/api/waitlist/:id/notify', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE waitlist SET notified = 1 WHERE id = ?').run(id);
  res.json({ entry: db.prepare('SELECT * FROM waitlist WHERE id = ?').get(id) });
});

// Scoped Journey Portal (Never leaks another customer's PII publicly)
app.get('/api/journey', (req, res) => {
  const steps = db.prepare('SELECT * FROM journey_steps ORDER BY sort_order ASC').all();
  const bookingToken = req.headers['x-booking-token'] || req.cookies?.fusion_booking_token || '';
  const tokenData = verifySignedToken(bookingToken);
  const adminData = verifySignedToken(extractAdminToken(req));

  let activeBooking = null;
  let prepForm = null;

  if (tokenData?.role === 'bride' && tokenData.bookingId) {
    activeBooking = db.prepare('SELECT id, customer_name, city, event_date, package_name, artist_name, advance_amount, total_price, status, reschedule_count, receipt_code FROM bookings WHERE id = ?').get(tokenData.bookingId);
    prepForm = db.prepare('SELECT * FROM bride_prep_forms WHERE booking_id = ? ORDER BY id DESC LIMIT 1').get(tokenData.bookingId);
  } else if (adminData?.role === 'owner') {
    activeBooking = db.prepare(`SELECT * FROM bookings WHERE status IN ('locked', 'hold') ORDER BY id DESC LIMIT 1`).get();
    if (activeBooking) {
      prepForm = db.prepare('SELECT * FROM bride_prep_forms WHERE booking_id = ? ORDER BY id DESC LIMIT 1').get(activeBooking.id);
    }
  }

  res.json({ steps, prepForm, latestBooking: activeBooking });
});

app.patch('/api/journey/:id', (req, res) => {
  const bookingToken = req.headers['x-booking-token'] || req.cookies?.fusion_booking_token || '';
  const tokenData = verifySignedToken(bookingToken);
  const adminData = verifySignedToken(extractAdminToken(req));
  if (!tokenData && !adminData) {
    return res.status(401).json({ error: 'Book or sign in to update your personal bridal checklist.' });
  }
  const { id } = req.params;
  const { completed } = req.body || {};
  db.prepare('UPDATE journey_steps SET completed = ? WHERE id = ?').run(completed ? 1 : 0, id);
  const steps = db.prepare('SELECT * FROM journey_steps ORDER BY sort_order ASC').all();
  res.json({ steps });
});

app.post('/api/prep-form', (req, res) => {
  const bookingToken = req.headers['x-booking-token'] || req.cookies?.fusion_booking_token || '';
  const tokenData = verifySignedToken(bookingToken);
  const adminData = verifySignedToken(extractAdminToken(req));
  if (!tokenData && !adminData) {
    return res.status(401).json({ error: 'Valid booking session required to save outfit details.' });
  }

  const parsed = prepFormSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid prep form data' });
  }
  const targetBookingId = tokenData?.bookingId || 1;
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
  const parsed = campaignToggleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid campaign toggle payload' });
  }
  const { id } = req.params;
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
  res.status(201).json({ lead: db.prepare('SELECT * FROM leads WHERE id = ?').get(info.lastInsertRowid) });
});

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  releaseExpiredHolds();
  const bookings = db.prepare('SELECT * FROM bookings ORDER BY id DESC').all();
  const leads = db.prepare('SELECT * FROM leads ORDER BY id DESC').all();
  const artists = db.prepare('SELECT * FROM artists ORDER BY id ASC').all();
  const waitlist = db.prepare('SELECT * FROM waitlist ORDER BY id DESC').all();
  const pendingTimers = bookings.filter((b) => b.status === 'hold' && b.hold_expires_at);
  const advanceCollected = bookings
    .filter((b) => b.status === 'locked' || b.status === 'token_locked')
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

app.listen(PORT, () => {
  console.log(`Fusion Salon Server running at http://localhost:${PORT} (${secConfig.isProd ? 'production' : 'development'})`);
});
