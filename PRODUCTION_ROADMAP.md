# PRODUCTION ROADMAP — FUSION: THE MAGICAL MIRROR

**Goal:** Transition `d:\salon` from a working full-stack MVP into a secure, scalable, multi-month production salon & bridal booking system while **preserving all 8 React routes, animations, Midnight Obsidian & 24K Gold branding, and features**.

---

## Phase 0: Immediate Security & Payment Hardening (P0 — Week 1)
1. **Enforce Mandatory Secrets & Remove Demo Credentials**
   - Require `ADMIN_PIN` (or hashed admin credentials) and `SESSION_SECRET` from environment variables; fail fast if unset in production.
   - Remove `"Demo: 2026"` from `src/pages/AdminPage.jsx`.
   - Use `HttpOnly; Secure; SameSite=Strict` cookies and `crypto.timingSafeEqual` for token/signature checks.
2. **Close IDOR & Protect All Admin Endpoints**
   - Add `requireAdmin` to `PATCH /api/campaigns/:id`.
   - Scope `GET /api/journey`, `PATCH /api/journey/:id`, `POST /api/prep-form`, `POST /api/bookings/:id/reschedule`, and `POST /api/bookings/:id/upsell` to per-booking signed access tokens.
   - Strip customer PII (`bride_name`, `receipt_code`) from `GET /api/calendar` and personal phone numbers from `GET /api/artists`.
3. **Server-Side Pricing & Real Razorpay Flow**
   - Compute package, travel, and upsell totals strictly on the server.
   - Create bookings as `pending_payment` / `hold`; lock dates only after `POST /api/payments/verify` or Razorpay `payment.captured` webhook passes HMAC verification.
4. **Input Validation, Rate Limiting & Safe Uploads**
   - Add `helmet`, strict `cors` allowlist, `express-rate-limit`, and `zod` request validation.
   - Validate image magic bytes (JPEG/PNG/WebP only) on `/api/admin/upload-image` and migrate storage to Cloudinary/S3.

---

## Phase 1: Database Migration & Core Booking Engine (P1 — Week 2)
1. **Migrate SQLite → PostgreSQL** per `DATABASE_MIGRATION_PLAN.md`.
2. **Multi-Month Dynamic Calendar**: Replace the hardcoded Feb 2026 `calendar_dates` table with dynamic date-range queries supporting all months/years.
3. **Transactional Double-Booking Prevention**: Wrap booking creation & rescheduling in `BEGIN ... COMMIT` transactions backed by a partial `UNIQUE (artist_id, event_date)` index.
4. **Per-Bride Journey & Prep Forms**: Generate `booking_journey_steps` and `bride_prep_forms` per `booking_id` instead of sharing global rows.

---

## Phase 2: Connect Remaining Client-Side Features & Automation (P2 — Week 3)
1. **Wire Local-Only Features to DB**: Persist Family Group Bookings, Loyalty Packs (`Hair Spa 4+1`), Product Re-Orders, Birthday Offers, Online Masterclass (`₹999`) enrollments, Peak Pricing settings, and Flash Sales.
2. **Real WhatsApp Business API (WATI / AiSensy / Interakt)**:
   - Trigger pre-approved templates for Booking Confirmation, Receipt PDF, 48-Hr Reminders (T+24h, T+6h, T+1h), D-30/D-15/D-7/D-1 Bride Prep, D+1 Review Booster, and Festival Opt-In Campaigns (with `STOP` opt-out).
3. **Background Scheduler**: Move `releaseExpiredHolds()` and scheduled reminders into a cron worker (`node-cron` or hosted cron) instead of running only when endpoints are hit.
4. **Server-Side PDF Receipts**: Generate downloadable GST/salon receipt PDFs instead of relying on browser `window.print()`.

---

## Phase 3: Real Content, Hosting & Launch Readiness (P3 — Week 4)
1. **Replace Placeholder Data**: Update contact phone (`+91 98290 00000`), real artist roster, verified Google/JustDial reviews, and real `@fusionsaloon16` portfolio photos.
2. **Production Infrastructure**:
   - Host Frontend on Vercel (with `/api/*` rewrite to backend URL) and Backend on Railway/Render/Fly.io (or containerize both).
   - Configure Error Tracking (Sentry), structured request logging, and automated daily PostgreSQL backups.
3. **Pre-Launch QA**: Run end-to-end tests for Razorpay test-mode payments, 48-hr hold expiry, artist leave blocking, and mobile Lighthouse performance (> 85).
