# DATABASE MIGRATION PLAN — FUSION: THE MAGICAL MIRROR

**Current Engine:** Built-in `node:sqlite` (`server/fusion_salon.sqlite`) defined in `server/db.js`.  
**Target Engine:** Managed **PostgreSQL** (Supabase / Neon / RDS) for multi-user concurrency, ACID transactions, foreign keys, and serverless/container horizontal scaling.

---

## 1. Current SQLite Schema & Structural Issues (`server/db.js`)

| Table | Current Issues & Integrity Gaps | Severity |
| :--- | :--- | :--- |
| `calendar_dates` | Hardcoded to 28 days of Feb 2026 (`date_str` PK); assumes 1 global slot/day instead of per-artist availability; duplicates `bride_name`, `package_name`, `city`, `receipt_code` from `bookings`. | **High** |
| `bookings` | `artist_name` stored as free text instead of `artist_id` FK; no `customer_id` FK; no `UNIQUE` constraint preventing double-booking; `upsells` stored as comma-separated text. | **High** |
| `artists` | `leave_dates` stored as comma-separated string (`'2026-02-25'`) instead of a normalized `artist_leaves` table. | **Medium** |
| `bride_prep_forms` | `booking_id` defaults to `1` and `POST /api/prep-form` (`server/index.js:311`) hardcodes `VALUES (1, ...)`, overwriting/ignoring actual bookings; no FK constraint. | **High** |
| `journey_steps` | Global 6-row table (`server/db.js:184–196`) shared across ALL brides—one bride checking a box marks it done for every bride. | **High** |
| `waitlist` | No FK to `customers` or `packages`; `notified` is a boolean flag with no notification timestamp or expiry window. | **Medium** |
| `leads` | No link to converted `booking_id`; no assigned staff user. | **Low** |
| `reviews` & `campaigns` | `reviews` has no `booking_id` verification; `campaigns` lacks opt-out tracking (`STOP` compliance). | **Low** |

---

## 2. Target Normalized PostgreSQL Schema

1. **`customers`**: `id (UUID PK)`, `full_name`, `phone (UNIQUE)`, `city`, `birthday`, `referral_code (UNIQUE)`, `referred_by_id (FK -> customers)`, `whatsapp_opt_in (BOOLEAN)`, `created_at`.
2. **`artists`**: `id (UUID PK)`, `name`, `specialty`, `experience_label`, `rating`, `is_active`, `created_at`.
3. **`artist_leaves`**: `id (UUID PK)`, `artist_id (FK -> artists)`, `leave_date (DATE)`, `UNIQUE(artist_id, leave_date)`.
4. **`packages`**: `id (TEXT PK)`, `name`, `category`, `base_price_inr`, `advance_inr`, `duration_mins`, `is_active` (authoritative server pricing).
5. **`bookings`**: `id (UUID PK)`, `customer_id (FK -> customers)`, `artist_id (FK -> artists)`, `package_id (FK -> packages)`, `event_date (DATE)`, `slot_time`, `venue_city`, `travel_charge_inr`, `total_price_inr`, `advance_amount_inr`, `status (ENUM: 'pending_payment','hold','locked','completed','cancelled','expired')`, `reschedule_count`, `hold_expires_at (TIMESTAMPTZ)`, `receipt_code (UNIQUE)`, `access_token_hash`, `created_at`.
   - Partial unique index: `UNIQUE (artist_id, event_date) WHERE status IN ('hold', 'locked')` to guarantee zero double-bookings at the database level.
6. **`payments`**: `id (UUID PK)`, `booking_id (FK -> bookings)`, `provider ('razorpay')`, `razorpay_order_id`, `razorpay_payment_id`, `amount_inr`, `type ('advance','balance','token')`, `status`, `verified_at`.
7. **`booking_upsells`**: `id (UUID PK)`, `booking_id (FK -> bookings)`, `item_name`, `price_inr`.
8. **`bride_prep_forms`**: `booking_id (UUID PK, FK -> bookings)`, `lehenga_colour`, `blouse_note`, `jewellery`, `lens_needed`, `extension_needed`, `updated_at`.
9. **`booking_journey_steps`**: `id (UUID PK)`, `booking_id (UUID FK -> bookings)`, `day_label`, `title`, `subtitle`, `detail`, `completed (BOOLEAN)`, `sort_order`.
10. **`waitlist`**: `id (UUID PK)`, `target_date (DATE)`, `customer_id (FK -> customers)`, `package_id (FK -> packages)`, `notified_at (TIMESTAMPTZ)`.
11. **`leads`**, **`reviews`**, **`campaigns`**, **`admin_users`**: Normalized with proper FKs, timestamps, and audit logs.

---

## 3. Step-by-Step Zero-Downtime Migration Strategy

1. **Step 1 — Provision PostgreSQL & Schema**: Deploy PostgreSQL and apply the normalized DDL via versioned migrations (`prisma` or `node-pg-migrate`).
2. **Step 2 — Backfill Script**: Write an idempotent Node migration script that reads `server/fusion_salon.sqlite`, deduplicates `customers` by `phone`, maps `artist_name` to `artists.id`, splits `leave_dates` into `artist_leaves`, and migrates `bookings`, `leads`, `reviews`, `campaigns`, and `waitlist`.
3. **Step 3 — Dual-Read Verification**: Run row-count and financial-sum assertions (`SUM(advance_amount)` in SQLite === `SUM(amount_inr)` in PostgreSQL).
4. **Step 4 — Cutover**: Switch `server/db.js` to the PostgreSQL pool (`pg`), replace `releaseExpiredHolds()` polling with a scheduled cron/worker job, and archive `fusion_salon.sqlite` as a read-only backup.
