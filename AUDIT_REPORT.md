# AUDIT REPORT — FUSION: THE MAGICAL MIRROR

**Scope:** Read-only architectural, functional, and deployment audit of `d:\salon`.  
**Preserved Frontend:** All 8 React Router routes (`/`, `/bridal`, `/services`, `/gallery`, `/book`, `/reviews`, `/admin`, `/contact`), Midnight Obsidian & 24K Gold design system, GSAP/CSS animations, and components remain untouched.

---

## 1. Existing Architecture Map

- **Frontend (`src/`)**: React 19 + React Router v7 + Tailwind CSS v4 + GSAP (`src/App.jsx`, `src/pages/*`, `src/components/*`). Built via Vite (`dist/`).
- **Backend (`server/index.js`, `server/payments.js`)**: Node.js + Express 5 (`PORT=3001`) serving JSON APIs under `/api/*`, static uploaded images at `/images`, and static `dist/` SPA fallback in production.
- **Database (`server/db.js`)**: Node 24 built-in `node:sqlite` (`DatabaseSync`) storing data in `server/fusion_salon.sqlite`.
- **Deployment Config (`vercel.json`, `package.json`, `.env.example`)**: `vercel.json` rewrites non-`/api/` routes to `/index.html`, while `package.json` runs `node server/index.js` for production.

---

## 2. Complete Backend API Endpoint Inventory (`server/index.js`)

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/login` | Public | Verifies `ADMIN_PIN`, returns HMAC token |
| `POST` | `/api/admin/upload-image` | `requireAdmin` | Writes base64 image to `public/images/<slot>` |
| `GET` | `/api/health` | Public | Health check |
| `GET` | `/api/artists` | Public | Lists artists (including `phone` & `leave_dates`) |
| `PATCH` | `/api/artists/:id/leave` | `requireAdmin` | Toggles a leave date on an artist |
| `GET` | `/api/calendar` | Public | Releases expired holds & returns Feb 2026 dates |
| `POST` | `/api/bookings` | Public | Creates `locked` / `hold` / `token_locked` booking + lead |
| `POST` | `/api/bookings/:id/pay` | `requireAdmin` | Marks a hold booking as `locked` |
| `POST` | `/api/bookings/:id/reschedule` | Public | Reschedules a booking once (`reschedule_count < 1`) |
| `POST` | `/api/bookings/:id/upsell` | Public | Appends upsell item & price to booking |
| `POST` | `/api/waitlist` | Public | Adds a bride to `waitlist` |
| `POST` | `/api/waitlist/:id/notify` | `requireAdmin` | Marks waitlist entry as `notified = 1` |
| `GET` | `/api/journey` | Public | Returns `journey_steps`, latest `prepForm`, `latestBooking` |
| `PATCH` | `/api/journey/:id` | Public | Toggles journey step `completed` |
| `POST` | `/api/prep-form` | Public | Inserts outfit/jewellery prep form (`booking_id = 1`) |
| `GET` | `/api/reviews` | Public | Lists customer reviews |
| `POST` | `/api/reviews` | Public | Creates a new review |
| `GET` | `/api/campaigns` | Public | Lists festival campaigns |
| `PATCH` | `/api/campaigns/:id` | Public | Toggles campaign `enabled` state |
| `POST` | `/api/leads` | Public | Saves a lead to CRM |
| `GET` | `/api/admin/overview` | `requireAdmin` | Returns KPIs, `bookings`, `leads`, `artists`, `waitlist` |
| `POST` | `/api/payments/verify` | Public | Verifies Razorpay signature & locks booking |

---

## 3. Frontend-to-Backend Trace & Disconnected Features

All 21 `fetch('/api/...')` calls in `src/` map to existing endpoints, **except** several UI modules are purely client-side state with no backend persistence:

1. **Disconnected UI Features (Local State Only)**
   - **File:** `src/components/BrideSuiteExtra.jsx` (`BrideSuiteExtra`), `src/components/LoyaltyMembership.jsx` (`LoyaltyMembership`), `src/components/ViralEducatorHub.jsx` (`ViralEducatorHub`), `src/components/AdminDashboard.jsx` (`peakPricingOn`, `flashSent`).
   - **Problem:** Family group bookings, Trial Buddy codes, Product re-orders (`Moroccan Serum`), Loyalty packs (`Hair Spa 4+1`), Birthday date saver, Online Masterclass (`₹999`) bookings, Digital Certificates, Loyalty Stamp Card, Peak Pricing toggle, and Flash Sale blasts do not call any API and reset on page refresh.
   - **Severity:** **Medium**
   - **Recommended Solution:** Add dedicated tables/endpoints (`group_bookings`, `orders`, `memberships`, `masterclass_enrollments`, `settings`) or persist via `POST /api/leads` and `POST /api/bookings` so owner reports reflect real activity.

---

## 4. Booking Logic & Double-Booking Findings

2. **Client-Supplied `total_price` and `advance_amount` Trusted Without Server Calculation**
   - **File:** `server/index.js` — `POST /api/bookings` (lines 129–130, 177–178) & `POST /api/bookings/:id/upsell` (lines 267, 272).
   - **Problem:** The server accepts `total_price`, `advance_amount`, and `item_price` directly from `req.body`. A malicious client can submit `total_price: 1` or `advance_amount: 0` for a `₹35,000` Airbrush Bridal booking.
   - **Severity:** **Critical**
   - **Recommended Solution:** Maintain an authoritative server-side package/travel/upsell price catalog and compute `total_price` and `advance_amount` exclusively on the server.

3. **Non-Atomic Booking Creation & Race Condition (Double-Booking Risk)**
   - **File:** `server/index.js` — `POST /api/bookings` (lines 139–190) & `POST /api/bookings/:id/reschedule` (lines 244–260).
   - **Problem:** Availability check (`SELECT`) and booking/calendar mutation (`INSERT` / `UPDATE`) are not wrapped in a SQLite `BEGIN IMMEDIATE` transaction, and there is no `UNIQUE` constraint on `(event_date, artist_id)` for active bookings. Concurrent requests can double-book the same artist or date. Additionally, `calendar_dates` only models 1 slot per day, blocking multiple artists from taking separate bookings on the same date.
   - **Severity:** **High**
   - **Recommended Solution:** Wrap booking and reschedule writes in atomic DB transactions and enforce artist-slot uniqueness per date/time window instead of a single global `calendar_dates` row.

4. **Calendar Hardcoded to February 2026 Only**
   - **File:** `server/db.js` — `seedDatabase()` (lines 139–153); `src/components/BookingFlow.jsx` (line 205); `src/components/BridalJourney.jsx` (lines 133–134).
   - **Problem:** Only `2026-02-01` to `2026-02-28` exist in `calendar_dates`. Bookings for any other month fail calendar status checks or cannot be rescheduled outside Feb 2026.
   - **Severity:** **High**
   - **Recommended Solution:** Dynamically compute calendar availability for any requested `YYYY-MM` from `bookings` and `artist_leaves` tables rather than a pre-seeded 28-row table.

---

## 5. Simulated / Hardcoded Data & Deployment Findings

5. **Simulated / Hardcoded Salon & Demo Data**
   - **File:** `server/db.js` (lines 142–250), `src/components/HeroMirror.jsx` (line 95), `src/components/FooterNav.jsx` (line 75), `src/components/BrideSuiteExtra.jsx` (lines 38–55), `src/components/AdminDashboard.jsx` (lines 213–249).
   - **Problem:** Placeholder phone (`+91 98290 00000`), sample artists (`Riya Sen`, `Neha Kapoor`, `Arjun Mehta`, `Simran Verma`), hardcoded `23 Days Left` countdown, static `Riya Sen Is On Her Way` tracker, static `referralConversions: 4`, and hardcoded Admin Pro Suite metrics (`bookings: 14`, `comm: ₹18,400`).
   - **Severity:** **Medium**
   - **Recommended Solution:** Replace placeholders via `.env` / DB `salon_settings` table and compute Admin Pro Suite metrics dynamically from `bookings` and `referrals`.

6. **Vercel Serverless vs. Persistent Express + SQLite Mismatch**
   - **File:** `vercel.json` (lines 1–7), `server/db.js` (line 4), `server/index.js` (line 65).
   - **Problem:** `vercel.json` only configures static SPA rewrites with no `/api/*` serverless functions or backend proxy. Furthermore, `node:sqlite` (`server/fusion_salon.sqlite`) and `fs.writeFileSync` to `public/images/` are ephemeral/read-only on serverless platforms like Vercel.
   - **Severity:** **High**
   - **Recommended Solution:** Deploy the Express backend to a persistent Node host (or refactor `/api` to serverless + managed PostgreSQL + S3/Cloudinary object storage) and configure `vercel.json` `/api/*` rewrites or `VITE_API_URL`.
