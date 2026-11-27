# SECURITY REPORT — FUSION: THE MAGICAL MIRROR

**Scope:** Application security audit of authentication, authorization, PII exposure, IDOR, payments, and file handling in `d:\salon`.

---

## 1. Critical Findings

### SEC-01: Booking Confirmed Without Payment Verification
- **File:** `server/index.js` — `POST /api/bookings` (lines 156, 184–217); `server/payments.js` — `verifyRazorpaySignature()` (lines 41–51).
- **Problem:** `POST /api/bookings` sets `status = 'locked'` and updates `calendar_dates` to `locked` **before** any payment is completed or verified. `createPaymentOrder()` is only called after the DB is already locked, and `/api/payments/verify` is never called by `BookingFlow.jsx`. Furthermore, `verifyRazorpaySignature()` returns `true` whenever `RAZORPAY_KEY_SECRET` is unset.
- **Severity:** **Critical**
- **Recommended Solution:** Create bookings initially in `pending_payment` or `hold` state; only transition to `locked` inside `POST /api/payments/verify` (or a verified Razorpay webhook) after `crypto.timingSafeEqual` signature verification, and fail closed (`return false`) if `RAZORPAY_KEY_SECRET` is missing in production.

### SEC-02: Hardcoded Weak Default `ADMIN_PIN` & `SESSION_SECRET` + Demo Hint in UI
- **File:** `server/index.js` — lines 11–12 (`ADMIN_PIN = process.env.ADMIN_PIN || '2026'`, `SESSION_SECRET = ... || 'fusion-magical-mirror-ajmer-secret'`); `src/pages/AdminPage.jsx` — line 68 (`placeholder="Enter PIN (Demo: 2026)"`).
- **Problem:** Anyone visiting `/admin` sees the PIN (`2026`) in the placeholder, and if `SESSION_SECRET` is not set in `.env`, attackers can forge valid HMAC admin tokens offline.
- **Severity:** **Critical**
- **Recommended Solution:** Fail startup in production if `ADMIN_PIN` or `SESSION_SECRET` is missing; enforce strong password/hashed credentials (e.g., `scrypt`/`argon2`) with login rate limiting; remove the PIN hint from `AdminPage.jsx`.

---

## 2. High Findings

### SEC-03: Customer PII Exposure on Public Endpoints
- **File:** `server/index.js` — `GET /api/calendar` (lines 110–114), `GET /api/journey` (lines 292–297), `GET /api/artists` (lines 92–95).
- **Problem:**
  - `GET /api/calendar` returns `SELECT * FROM calendar_dates`, exposing `bride_name`, `city`, `package_name`, and `receipt_code` to any unauthenticated visitor.
  - `GET /api/journey` returns `latestBooking` (the most recent customer's `customer_name`, `phone`, `city`, `advance_amount`, `receipt_code`) and `prepForm` to **any** unauthenticated visitor—a direct cross-customer PII leak.
  - `GET /api/artists` exposes staff personal/direct `phone` numbers publicly.
- **Severity:** **High**
- **Recommended Solution:** Return only `date_str`, `day_num`, `status`, and `hold_expires_at` from `GET /api/calendar`. Scope `GET /api/journey` to an authenticated customer session or signed booking access token. Omit private phone numbers from public artist listings.

### SEC-04: Insecure Direct Object Reference (IDOR) on Booking & Campaign Endpoints
- **File:** `server/index.js` — `POST /api/bookings/:id/reschedule` (line 236), `POST /api/bookings/:id/upsell` (line 265), `PATCH /api/journey/:id` (line 299), `PATCH /api/campaigns/:id` (line 337).
- **Problem:**
  - Any unauthenticated user can enumerate integer `:id` values (`1, 2, 3...`) to reschedule another bride's wedding date (`/reschedule`), inflate another bride's bill (`/upsell`), or mutate journey checklists.
  - `PATCH /api/campaigns/:id` has **no `requireAdmin` middleware**, allowing any anonymous visitor to enable/disable festival WhatsApp campaigns.
- **Severity:** **High**
- **Recommended Solution:** Add `requireAdmin` to `PATCH /api/campaigns/:id`. Require a signed per-booking customer token (or OTP-verified session) for `/reschedule`, `/upsell`, `/prep-form`, and `/journey`.

### SEC-05: Unvalidated Image Upload & Path/File-Type Risks
- **File:** `server/index.js` — `POST /api/admin/upload-image` (lines 55–67).
- **Problem:** Only checks `dataUrl.startsWith('data:image/')` before writing raw decoded bytes to `public/images/<slot>`. An SVG (`data:image/svg+xml`) could be uploaded and served directly, introducing Stored XSS if opened directly, and there is no magic-byte validation.
- **Severity:** **High**
- **Recommended Solution:** Restrict uploads to JPEG/PNG/WebP, verify file magic bytes, enforce strict max byte size, and store images in object storage (S3/Cloudinary) with `Content-Disposition` / `X-Content-Type-Options: nosniff`.

---

## 3. Medium & Low Findings

### SEC-06: Unrestricted CORS & Missing Rate Limiting / Security Headers
- **File:** `server/index.js` — lines 14–15 (`app.use(cors())`).
- **Problem:** Wildcard CORS allows any origin to make requests; no `helmet` security headers; no rate limiting on `/api/admin/login` (4-digit PIN brute-forceable in < 10,000 requests), `/api/bookings`, or `/api/leads`.
- **Severity:** **Medium**
- **Recommended Solution:** Restrict `cors({ origin: ALLOWED_ORIGINS })`, add `helmet`, and add `express-rate-limit` on `/api/admin/login` and public write endpoints.

### SEC-07: Non-Timing-Safe HMAC Comparisons & `sessionStorage` Token
- **File:** `server/index.js` — `verifyAdminToken` (line 28); `server/payments.js` — `verifyRazorpaySignature` (line 50); `src/pages/AdminPage.jsx` — line 6.
- **Problem:** String `!==` / `===` comparisons on HMAC signatures are theoretically vulnerable to timing attacks; storing admin tokens in `sessionStorage` exposes them to XSS.
- **Severity:** **Low**
- **Recommended Solution:** Use `crypto.timingSafeEqual` for HMAC checks and deliver admin tokens via `HttpOnly; Secure; SameSite=Strict` cookies.
