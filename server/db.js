const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, 'fusion_salon.sqlite');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS calendar_dates (
    date_str TEXT PRIMARY KEY,
    day_num INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    bride_name TEXT,
    package_name TEXT,
    city TEXT,
    hold_expires_at INTEGER,
    receipt_code TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    event_date TEXT NOT NULL,
    package_name TEXT NOT NULL,
    makeup_type TEXT,
    lehenga_colour TEXT,
    jewellery TEXT,
    artist_name TEXT,
    travel_charge INTEGER NOT NULL DEFAULT 0,
    total_price INTEGER NOT NULL,
    advance_amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    reschedule_count INTEGER NOT NULL DEFAULT 0,
    upsells TEXT DEFAULT '',
    hold_expires_at INTEGER,
    receipt_code TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    source TEXT NOT NULL,
    city TEXT NOT NULL,
    event_date TEXT,
    makeup_type TEXT,
    status TEXT NOT NULL DEFAULT 'New',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS journey_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_label TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    detail TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bride_name TEXT NOT NULL,
    city TEXT NOT NULL,
    look_type TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5,
    comment TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    offer_text TEXT NOT NULL,
    target_count INTEGER NOT NULL DEFAULT 120,
    enabled INTEGER NOT NULL DEFAULT 0,
    last_sent_at TEXT
  );

  CREATE TABLE IF NOT EXISTS artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    experience TEXT NOT NULL,
    phone TEXT NOT NULL,
    rating REAL NOT NULL DEFAULT 4.8,
    leave_dates TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_str TEXT NOT NULL,
    bride_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    package_name TEXT NOT NULL,
    notified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bride_prep_forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL DEFAULT 1,
    lehenga_colour TEXT NOT NULL,
    blouse_note TEXT NOT NULL,
    jewellery TEXT NOT NULL,
    lens_needed TEXT NOT NULL,
    extension_needed TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    provider TEXT NOT NULL,
    order_id TEXT NOT NULL,
    payment_id TEXT,
    amount_inr INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'created',
    failure_reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    verified_at TEXT
  );

  CREATE TABLE IF NOT EXISTS webhook_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    order_id TEXT,
    payment_id TEXT,
    processed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payment_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER,
    order_id TEXT,
    payment_id TEXT,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Safe migrations for existing DB files
const bookingCols = db.prepare(`PRAGMA table_info(bookings)`).all().map((c) => c.name);
if (!bookingCols.includes('travel_charge')) {
  db.exec(`ALTER TABLE bookings ADD COLUMN travel_charge INTEGER NOT NULL DEFAULT 0`);
}
if (!bookingCols.includes('reschedule_count')) {
  db.exec(`ALTER TABLE bookings ADD COLUMN reschedule_count INTEGER NOT NULL DEFAULT 0`);
}
if (!bookingCols.includes('upsells')) {
  db.exec(`ALTER TABLE bookings ADD COLUMN upsells TEXT DEFAULT ''`);
}
if (!bookingCols.includes('idempotency_key')) {
  db.exec(`ALTER TABLE bookings ADD COLUMN idempotency_key TEXT`);
}

const paymentCols = db.prepare(`PRAGMA table_info(payments)`).all().map((c) => c.name);
if (!paymentCols.includes('currency')) {
  db.exec(`ALTER TABLE payments ADD COLUMN currency TEXT NOT NULL DEFAULT 'INR'`);
}
if (!paymentCols.includes('failure_reason')) {
  db.exec(`ALTER TABLE payments ADD COLUMN failure_reason TEXT`);
}

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_idempotency ON bookings(idempotency_key) WHERE idempotency_key IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id) WHERE payment_id IS NOT NULL;
`);

function seedDatabase() {
  const dateCount = db.prepare('SELECT COUNT(*) AS cnt FROM calendar_dates').get().cnt;
  if (dateCount === 0) {
    const insertDate = db.prepare(`
      INSERT INTO calendar_dates (date_str, day_num, status, bride_name, package_name, city, hold_expires_at, receipt_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const hold47h12m = Date.now() + (47 * 3600 + 12 * 60) * 1000;
    const hold11h = Date.now() + 11 * 3600 * 1000;

    for (let day = 1; day <= 28; day++) {
      const dd = String(day).padStart(2, '0');
      const dateStr = `2026-02-${dd}`;
      if (day === 12) {
        insertDate.run(dateStr, day, 'locked', 'Ananya Rathore', 'HD Bridal', 'Jaipur', null, 'FUS-2026-0212');
      } else if (day === 14) {
        insertDate.run(dateStr, day, 'hold', 'Priya Sharma', 'Airbrush Bridal', 'Ajmer', hold47h12m, 'HOLD-2026-0214');
      } else if (day === 5) {
        insertDate.run(dateStr, day, 'locked', 'Meera Jain', 'Engagement', 'Ajmer', null, 'FUS-2026-0205');
      } else if (day === 21) {
        insertDate.run(dateStr, day, 'hold', 'Kavya Solanki', 'HD Bridal', 'Kishangarh', hold11h, 'HOLD-2026-0221');
      } else {
        insertDate.run(dateStr, day, 'available', null, null, null, null, null);
      }
    }
  }

  const bookingCount = db.prepare('SELECT COUNT(*) AS cnt FROM bookings').get().cnt;
  if (bookingCount === 0) {
    const insertBooking = db.prepare(`
      INSERT INTO bookings (customer_name, phone, city, event_date, package_name, makeup_type, lehenga_colour, jewellery, artist_name, travel_charge, total_price, advance_amount, status, hold_expires_at, receipt_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const hold47h12m = Date.now() + (47 * 3600 + 12 * 60) * 1000;
    const hold11h = Date.now() + 11 * 3600 * 1000;

    insertBooking.run('Ananya Rathore', '+91 98290 44120', 'Jaipur', '2026-02-12', 'HD Bridal', 'HD', 'Red', 'Kundan', 'Riya Sen', 3500, 28500, 10000, 'locked', null, 'FUS-2026-0212');
    insertBooking.run('Meera Jain', '+91 98291 77301', 'Ajmer', '2026-02-05', 'Engagement', 'HD', 'Pastel', 'Polki', 'Neha Kapoor', 0, 15000, 10000, 'locked', null, 'FUS-2026-0205');
    insertBooking.run('Priya Sharma', '+91 97820 11234', 'Ajmer', '2026-02-14', 'Airbrush Bridal', 'Airbrush', 'Maroon', 'Kundan', 'Riya Sen', 0, 35000, 10000, 'hold', hold47h12m, 'HOLD-2026-0214');
    insertBooking.run('Kavya Solanki', '+91 99280 55890', 'Kishangarh', '2026-02-21', 'HD Bridal', 'HD', 'Pink', 'Gold', 'Simran Verma', 1500, 26500, 10000, 'hold', hold11h, 'HOLD-2026-0221');
    insertBooking.run('Rohan & Simran', '+91 94140 88210', 'Ajmer', '2026-02-18', 'Groom Package', 'HD', 'Ivory', 'Gold', 'Arjun Mehta', 0, 8000, 2500, 'locked', null, 'FUS-2026-0218');
  }

  const leadCount = db.prepare('SELECT COUNT(*) AS cnt FROM leads').get().cnt;
  if (leadCount === 0) {
    const insertLead = db.prepare(`
      INSERT INTO leads (name, phone, source, city, event_date, makeup_type, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertLead.run('Priya Sharma', '+91 97820 11234', 'Instagram', 'Ajmer', '2026-02-14', 'Airbrush Bridal', '48-Hr Hold', 'Red/Maroon Lehenga + Kundan');
    insertLead.run('Ananya Rathore', '+91 98290 44120', 'WhatsApp', 'Jaipur', '2026-02-12', 'HD Bridal', 'Confirmed', 'Advance ₹10,000 paid via UPI');
    insertLead.run('Nidhi Agarwal', '+91 98281 33412', 'Website', 'Ajmer', '2026-02-24', 'Engagement', 'New', 'Asked via Look Finder: Pastel + Polki');
    insertLead.run('Rohan Mathur', '+91 94142 66109', 'WhatsApp', 'Ajmer', '2026-02-19', 'Groom Package', 'New', 'Needs beard styling + matte HD');
  }

  const journeyCount = db.prepare('SELECT COUNT(*) AS cnt FROM journey_steps').get().cnt;
  if (journeyCount === 0) {
    const insertStep = db.prepare(`
      INSERT INTO journey_steps (day_label, title, subtitle, detail, completed, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertStep.run('D-30', 'Skincare Start', 'Hydration & Barrier Prep', 'AM/PM gentle cleanser, hyaluronic serum & SPF 50. Avoid new actives.', 1, 1);
    insertStep.run('D-15', 'Facial + Trial Reminder', 'Glow Clean-up & Shade Match', 'Visit Fusion Naka Madar for Hydra-Glow Facial and undertone patch test.', 1, 2);
    insertStep.run('D-7', 'Final Trial — 25 Jan, 4 PM', 'Lehenga & Jewellery Sync', 'Full eye & lip look lock with Riya Sen. Bring blouse & dupatta.', 0, 3);
    insertStep.run('D-1', 'Venue: Hotel, Reporting 5:30 AM', 'Artist Checklist & Bag Ready', 'Riya Sen (+91 98290 44100) confirmed. Keep safety pins & lenses ready.', 0, 4);
    insertStep.run('D-Day', 'Dulhan Ready!', 'Royal Bridal Transformation', '3-hour calm glam session with setting mist lock for 16-hour wear.', 0, 5);
    insertStep.run('D+1', 'Thank You + Review', 'Share Your Glow & Earn ₹500', 'Rate your Fusion experience on Google & unlock your FUSION500 referral.', 0, 6);
  }

  const reviewCount = db.prepare('SELECT COUNT(*) AS cnt FROM reviews').get().cnt;
  if (reviewCount === 0) {
    const insertReview = db.prepare(`
      INSERT INTO reviews (bride_name, city, look_type, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertReview.run('Ananya Rathore', 'Jaipur', 'HD Bridal · Red Lehenga', 5, 'Looked in the Magical Mirror during trial and knew instantly! Zero cakeyness even after 14 hours of pheras.');
    insertReview.run('Meera Jain', 'Ajmer', 'Pastel Engagement Look', 5, 'Riya and team came right at 5:30 AM. The 48-hour date lock and D-30 reminders meant zero follow-up stress.');
    insertReview.run('Sana Sheikh', 'Ajmer', 'Airbrush Bridal', 5, 'Best unisex salon near Naka Madar. My husband also got his Groom Package done here — natural, camera-ready finish.');
    insertReview.run('Ritika Goyal', 'Pushkar', 'Red Bridal + Kundan', 4, 'Transparent pricing on the website saved us so much back and forth. Worth every rupee!');
  }

  const campaignCount = db.prepare('SELECT COUNT(*) AS cnt FROM campaigns').get().cnt;
  if (campaignCount === 0) {
    const insertCampaign = db.prepare(`
      INSERT INTO campaigns (key, title, subtitle, offer_text, target_count, enabled, last_sent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertCampaign.run('karwa', 'Karwa Chauth Offer', 'Past Brides & Married Clients', 'Flat 25% OFF on Festive Saree Draping + Glow Makeup + Hair Styling', 184, 1, 'Auto-scheduled · 184 clients');
    insertCampaign.run('diwali', 'Diwali Party Makeup Offer', 'All Ajmer Salon Clients', 'Party Glam + Hair Spa Combo at ₹3,999 (Save ₹1,500) + Priority Slot', 312, 0, null);
    insertCampaign.run('eid', 'Eid Offer', 'Festive Glow & Grooming', 'Hydra Facial + Party Makeup / Groom Styling Flat 20% OFF', 146, 0, null);
  }

  const artistCount = db.prepare('SELECT COUNT(*) AS cnt FROM artists').get().cnt;
  if (artistCount === 0) {
    const insertArtist = db.prepare(`
      INSERT INTO artists (name, specialty, experience, phone, rating, leave_dates)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertArtist.run('Riya Sen', 'Bridal & Airbrush Director', '8+ Yrs · 320+ Brides', '+91 98290 44100', 4.9, '2026-02-25');
    insertArtist.run('Neha Kapoor', 'Pastel, Dewy & Engagement', '6+ Yrs · 180+ Looks', '+91 98290 44102', 4.8, '2026-02-16');
    insertArtist.run('Arjun Mehta', 'Groom Grooming & Hair Styling', '7+ Yrs · Unisex Lead', '+91 98290 44105', 4.7, '2026-02-22');
    insertArtist.run('Simran Verma', 'Pre-Bridal Skin & Hydra Facial', '5+ Yrs · Skin Specialist', '+91 98290 44108', 4.8, '');
  }

  const waitlistCount = db.prepare('SELECT COUNT(*) AS cnt FROM waitlist').get().cnt;
  if (waitlistCount === 0) {
    db.prepare(`INSERT INTO waitlist (date_str, bride_name, phone, package_name, notified) VALUES (?, ?, ?, ?, ?)`).run(
      '2026-02-12',
      'Komal Rathore',
      '+91 98288 71234',
      'HD Bridal',
      0
    );
  }

  const prepCount = db.prepare('SELECT COUNT(*) AS cnt FROM bride_prep_forms').get().cnt;
  if (prepCount === 0) {
    db.prepare(`
      INSERT INTO bride_prep_forms (booking_id, lehenga_colour, blouse_note, jewellery, lens_needed, extension_needed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(1, 'Deep Red Velvet', 'Gold Zardosi Sweetheart Neck', 'Kundan + Polki Matha Patti', 'Hazel Soft Lens', 'Yes — 24 inch Volume');
  }
}

seedDatabase();

module.exports = db;
