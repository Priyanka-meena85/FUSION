const express = require('express');
const cors = require('cors');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const db = require('./db');
const { createPaymentOrder, verifyRazorpaySignature, sendWhatsAppTemplate } = require('./payments');

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_PIN = process.env.ADMIN_PIN || '2026';
const SESSION_SECRET = process.env.SESSION_SECRET || 'fusion-magical-mirror-ajmer-secret';

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

function signAdminToken() {
  const payload = Buffer.from(JSON.stringify({ role: 'owner', exp: Date.now() + 24 * 3600 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token) {
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (sig !== expected) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.role === 'owner' && data.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Unauthorized: Owner PIN required' });
  }
  next();
}

app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body || {};
  if (String(pin) !== String(ADMIN_PIN)) {
    return res.status(401).json({ error: 'Invalid Owner PIN' });
  }
  res.json({ ok: true, token: signAdminToken() });
});

const ALLOWED_SLOTS = new Set(['logo.jpg', 'bride-red.jpg', 'bride-pastel.jpg', 'engagement.jpg', 'groom.jpg', 'nails.jpg']);

app.post('/api/admin/upload-image', requireAdmin, (req, res) => {
  const { slot, dataUrl } = req.body || {};
  if (!ALLOWED_SLOTS.has(slot) || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Invalid slot or image data' });
  }
  const base64 = dataUrl.split(',')[1];
  if (!base64) return res.status(400).json({ error: 'Invalid base64 image' });

  const imagesDir = path.join(__dirname, '..', 'public', 'images');
  fs.mkdirSync(imagesDir, { recursive: true });
  fs.writeFileSync(path.join(imagesDir, slot), Buffer.from(base64, 'base64'));
  res.json({ ok: true, path: `/images/${slot}` });
});

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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, salon: 'FUSION - THE MAGICAL MIRROR', city: 'Ajmer' });
});

app.get('/api/artists', (_req, res) => {
  const artists = db.prepare('SELECT * FROM artists ORDER BY id ASC').all();
  res.json({ artists });
});

app.patch('/api/artists/:id/leave', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { date_str } = req.body || {};
  const artist = db.prepare('SELECT * FROM artists WHERE id = ?').get(id);
  if (!artist) return res.status(404).json({ error: 'Artist not found' });
  const currentLeaves = artist.leave_dates ? artist.leave_dates.split(',').filter(Boolean) : [];
  const nextLeaves = currentLeaves.includes(date_str)
    ? currentLeaves.filter((d) => d !== date_str)
    : [...currentLeaves, date_str];
  db.prepare('UPDATE artists SET leave_dates = ? WHERE id = ?').run(nextLeaves.join(','), id);
  res.json({ artist: db.prepare('SELECT * FROM artists WHERE id = ?').get(id) });
});

app.get('/api/calendar', (_req, res) => {
  releaseExpiredHolds();
  const dates = db.prepare('SELECT * FROM calendar_dates ORDER BY day_num ASC').all();
  res.json({ dates, serverTime: Date.now() });
});

app.post('/api/bookings', async (req, res) => {
  releaseExpiredHolds();
  const {
    customer_name = 'Priya Bride',
    phone = '+91 98290 00000',
    city = 'Jaipur',
    event_date,
    package_name = 'HD Bridal',
    makeup_type = 'HD',
    lehenga_colour = 'Red',
    jewellery = 'Kundan',
    artist_name = 'Riya Sen',
    travel_charge = 0,
    total_price = 25000,
    advance_amount = 10000,
    mode = 'pay',
  } = req.body || {};

  if (!event_date) {
    return res.status(400).json({ error: 'event_date is required' });
  }

  // Double-booking & artist leave block check
  const artistRow = db.prepare('SELECT * FROM artists WHERE name = ?').get(artist_name.split(' (')[0]);
  if (artistRow && artistRow.leave_dates.split(',').includes(event_date)) {
    return res.status(409).json({ error: `${artistRow.name} is on leave on ${event_date}. Please pick another artist or date.` });
  }

  const artistConflict = db
    .prepare(`SELECT id FROM bookings WHERE event_date = ? AND artist_name LIKE ? AND status IN ('locked', 'hold')`)
    .get(event_date, `${artist_name.split(' (')[0]}%`);
  if (mode !== 'token' && artistConflict) {
    return res.status(409).json({ error: `${artist_name} already has a booking on ${event_date}. Double-booking blocked!` });
  }

  const existingDate = db.prepare('SELECT * FROM calendar_dates WHERE date_str = ?').get(event_date);
  if (mode !== 'token' && existingDate && existingDate.status === 'locked') {
    return res.status(409).json({ error: 'This date is already locked.' });
  }

  const status = mode === 'hold' ? 'hold' : mode === 'token' ? 'token_locked' : 'locked';
  const holdExpiresAt = mode === 'hold' ? Date.now() + 48 * 3600 * 1000 : null;
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  const receiptCode = mode === 'hold' ? `HOLD-${suffix}` : mode === 'token' ? `TOK-${suffix}` : `FUS-${suffix}`;

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
      artist_name,
      Number(travel_charge),
      Number(total_price),
      Number(advance_amount),
      status,
      holdExpiresAt,
      receiptCode
    );

  if (mode !== 'token' && existingDate) {
    db.prepare(`
      UPDATE calendar_dates
      SET status = ?, bride_name = ?, package_name = ?, city = ?, hold_expires_at = ?, receipt_code = ?
      WHERE date_str = ?
    `).run(status, customer_name, package_name, city, holdExpiresAt, receiptCode, event_date);
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
    status === 'hold' ? '48-Hr Hold' : 'Confirmed',
    `${lehenga_colour} + ${jewellery} · Receipt ${receiptCode}`
  );

  const created = db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid);
  const payment = await createPaymentOrder({
    amountInInr: advance_amount,
    receiptCode,
    customerName: customer_name,
  });
  await sendWhatsAppTemplate({
    phone,
    templateName: status === 'hold' ? 'bridal_48hr_hold' : 'bridal_booking_confirmed',
    params: [customer_name, event_date, package_name, receiptCode],
  });
  res.status(201).json({ booking: created, receiptCode, payment });
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

app.post('/api/bookings/:id/reschedule', (req, res) => {
  const { id } = req.params;
  const { new_date } = req.body || {};
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.reschedule_count >= 1) {
    return res.status(400).json({ error: 'Free 1-time reschedule already used. Contact salon desk.' });
  }
  const target = db.prepare('SELECT * FROM calendar_dates WHERE date_str = ?').get(new_date);
  if (!target || target.status !== 'available') {
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

  res.json({ booking: db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) });
});

app.post('/api/bookings/:id/upsell', (req, res) => {
  const { id } = req.params;
  const { item_name, item_price = 0 } = req.body || {};
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const nextUpsells = booking.upsells ? `${booking.upsells}, ${item_name}` : item_name;
  const nextTotal = Number(booking.total_price) + Number(item_price);
  db.prepare('UPDATE bookings SET upsells = ?, total_price = ? WHERE id = ?').run(nextUpsells, nextTotal, id);
  res.json({ booking: db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) });
});

app.post('/api/waitlist', (req, res) => {
  const { date_str, bride_name = 'Waitlist Bride', phone = '+91 98290 99887', package_name = 'HD Bridal' } = req.body || {};
  if (!date_str) return res.status(400).json({ error: 'date_str required' });
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

app.get('/api/journey', (_req, res) => {
  const steps = db.prepare('SELECT * FROM journey_steps ORDER BY sort_order ASC').all();
  const prepForm = db.prepare('SELECT * FROM bride_prep_forms ORDER BY id DESC LIMIT 1').get();
  const latestBooking = db.prepare(`SELECT * FROM bookings WHERE status IN ('locked', 'hold') ORDER BY id DESC LIMIT 1`).get();
  res.json({ steps, prepForm, latestBooking });
});

app.patch('/api/journey/:id', (req, res) => {
  const { id } = req.params;
  const { completed } = req.body || {};
  db.prepare('UPDATE journey_steps SET completed = ? WHERE id = ?').run(completed ? 1 : 0, id);
  const steps = db.prepare('SELECT * FROM journey_steps ORDER BY sort_order ASC').all();
  res.json({ steps });
});

app.post('/api/prep-form', (req, res) => {
  const { lehenga_colour, blouse_note, jewellery, lens_needed, extension_needed } = req.body || {};
  const info = db
    .prepare(`
      INSERT INTO bride_prep_forms (booking_id, lehenga_colour, blouse_note, jewellery, lens_needed, extension_needed)
      VALUES (1, ?, ?, ?, ?, ?)
    `)
    .run(lehenga_colour || '', blouse_note || '', jewellery || '', lens_needed || '', extension_needed || '');
  res.status(201).json({ prepForm: db.prepare('SELECT * FROM bride_prep_forms WHERE id = ?').get(info.lastInsertRowid) });
});

app.get('/api/reviews', (_req, res) => {
  const reviews = db.prepare('SELECT * FROM reviews ORDER BY id DESC').all();
  res.json({ reviews });
});

app.post('/api/reviews', (req, res) => {
  const { bride_name, city = 'Ajmer', look_type = 'Bridal Glam', rating = 5, comment } = req.body || {};
  if (!bride_name || !comment) return res.status(400).json({ error: 'bride_name and comment are required' });
  const info = db
    .prepare(`INSERT INTO reviews (bride_name, city, look_type, rating, comment) VALUES (?, ?, ?, ?, ?)`)
    .run(bride_name, city, look_type, Number(rating), comment);
  res.status(201).json({ review: db.prepare('SELECT * FROM reviews WHERE id = ?').get(info.lastInsertRowid) });
});

app.get('/api/campaigns', (_req, res) => {
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY id ASC').all();
  res.json({ campaigns });
});

app.patch('/api/campaigns/:id', (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body || {};
  const existing = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Campaign not found' });
  const lastSent = enabled ? `WhatsApp blast queued · ${existing.target_count} clients` : null;
  db.prepare('UPDATE campaigns SET enabled = ?, last_sent_at = ? WHERE id = ?').run(enabled ? 1 : 0, lastSent, id);
  res.json({ campaign: db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) });
});

app.post('/api/leads', (req, res) => {
  const {
    name = 'Walk-in / Online Bride',
    phone = '+91 98290 00000',
    source = 'Website',
    city = 'Ajmer',
    event_date = '2026-02-18',
    makeup_type = 'HD Bridal',
    status = 'New',
    notes = '',
  } = req.body || {};
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

app.post('/api/payments/verify', (req, res) => {
  const { booking_id, orderId, paymentId, signature } = req.body || {};
  if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }
  if (booking_id) {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id);
    if (booking) {
      db.prepare(`UPDATE bookings SET status = 'locked', hold_expires_at = NULL WHERE id = ?`).run(booking_id);
      db.prepare(`UPDATE calendar_dates SET status = 'locked', hold_expires_at = NULL WHERE date_str = ?`).run(booking.event_date);
    }
  }
  res.json({ ok: true, verified: true });
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
  console.log(`Fusion Salon Server running at http://localhost:${PORT}`);
});
