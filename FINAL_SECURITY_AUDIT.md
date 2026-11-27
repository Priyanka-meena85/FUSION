# FINAL SECURITY & PRODUCTION-READINESS AUDIT — FUSION: THE MAGICAL MIRROR

**Project:** `d:\salon` (Branch: `production-backend`)  
**Scope:** End-to-end Phase 0 security, payment, upload, database, and deployment audit (Tasks 1–6).  
**Status Summary:** Phase 0 backend security controls are **Verified secure** in isolated tests, **but 2 Production Blockers (P0)** remain before public launch (most critically, **real Razorpay Checkout JS SDK integration in the frontend is Not Implemented**).

---

## 1. Executive Summary

Across Phase 0 Tasks 1–6, FUSION's Express backend was hardened with startup secret validation, `HttpOnly; SameSite=Strict` cookie authentication, `crypto.timingSafeEqual` HMAC verification, logout `jti` revocation, Origin CSRF checks, strict Zod `.strict()` validation, authoritative server-side pricing, magic-byte image validation with signed Cloudinary upload support, and idempotent Razorpay payment/webhook verification.

**Can Phase 0 backend hardening be closed?** Yes—with 1 minor backend bug (`P1-1` in `releaseExpiredHolds`) and **2 P0 Production Blockers** (`BookingFlow.jsx` / `ServicesCalculator.jsx` Razorpay Checkout SDK integration and hosting/PostgreSQL deployment) that must be resolved before accepting real customer payments online.

---

## 2. Files Inspected
- **Backend:** `server/index.js`, `server/db.js`, `server/payments.js`, `server/middleware/auth.js`, `server/middleware/rateLimit.js`, `server/validation/schemas.js`, `server/storage/cloudinary.js`
- **Frontend:** `src/App.jsx`, `src/pages/AdminPage.jsx`, `src/components/AdminDashboard.jsx`, `src/components/BookingFlow.jsx`, `src/components/ServicesCalculator.jsx`, `src/components/BridalJourney.jsx`, `src/components/FestivalOffers.jsx`, `src/components/GallerySection.jsx`, `src/components/CssIcons.jsx`, `src/data/salonData.js`
- **Config & Docs:** `package.json`, `.env.example`, `vercel.json`, `vite.config.mjs`, `ARCHITECTURE.md`

---

## 3. Security Controls Verification Matrix

| Control Area | Status | Notes |
| :--- | :--- | :--- |
| Mandatory `ADMIN_PIN` & `SESSION_SECRET` in prod | **Verified secure** | Fails fast on startup (`STARTUP_EXIT=1`) |
| `HttpOnly`, `SameSite=Strict`, `Secure` (prod) admin cookies | **Verified secure** | No tokens in `sessionStorage` or JSON |
| `crypto.timingSafeEqual` & logout `jti` revocation | **Verified secure** | Replayed cookie after logout returns `401` |
| Admin endpoint protection & Origin CSRF check | **Verified secure** | Cross-origin `PATCH /api/campaigns/1` returns `403` |
| Public PII removal (`/calendar`, `/artists`, `/journey`) | **Verified secure** | `calPii=false`, `artPhone=false`, `jrnLeak=false` |
| Strict Zod `.strict()` validation & route `:id` params | **Verified secure** | Extra fields return `400`; `>64kb` returns `413` |
| Authoritative server-side pricing (`PACKAGES` + `SERVICE_CATALOG` + `₹199`) | **Verified secure** | Client prices ignored; server computes `28500` / `1998` |
| Upload auth, predefined slots, magic bytes, SVG block | **Verified secure** | Unauth `401`, bad slot `400`, SVG `400`, open redirect `404` |
| Cloudinary live upload & Razorpay live API network calls | **Not tested** | Sandbox blocks external network; live keys not configured |
| Frontend Razorpay Checkout JS (`window.Razorpay`) | **Not implemented / Production blocker** | `BookingFlow.jsx` & `ServicesCalculator.jsx` only verify simulation signatures |
| `npm audit --omit=dev` | **Verified secure** | `found 0 vulnerabilities` |

---

## 4. Executed Test Results

- **Frontend Build (`npm run build`):** Passed in **594ms** (`54` modules transformed).
- **Dependency Audit (`npm audit --omit=dev`):** **`found 0 vulnerabilities`**.
- **Isolated Backend Security Suite (`PORT=3012`, `task-745`):**
  - `badPin: 401`, `loginOk: 200`, `csrfBlocked: 403`, `replayAdmin: 401`
  - `calPii: false`, `artPhone: false`, `jrnLeak: false`, `unauthCamp: 401`, `unauthPrep: 403`
  - `strictReject: 400`, `serverPrice: 28500`, `verifiedStatus: "confirmed"`
  - `svgRejected: 400`, `openRedir: 404`, `cdnRedir: 302`, `badWh: 400`
  - `all8Routes`: `[200, 200, 200, 200, 200, 200, 200, 200]`
- *(Prior Task 6 suite on ports `3010`/`3011` also verified: `idempotentSameId: true`, `badSigStatus: 400`, `wrongOrderStatus: 404`, `wrongPayIdStatus: 400`, `dupVerifyOk: true`, `wrongAmtWh: 400`, `authNotCapWh: 400`, `dupWh: true`, `b2StillConfirmedAfterDelayedFail: true`, `tokenStatus: "confirmed"`, `orderFailStatus: 502` with `feb27ReleasedStatus: "available"`.)*

---

## 5. Critical Vulnerabilities / Production Blockers (P0)

### P0-1: Real Razorpay Checkout JS SDK Integration Missing in Frontend (`Not implemented` / `Production blocker`)
- **Affected Files:** `src/components/BookingFlow.jsx` (`lines 132–152`), `src/components/ServicesCalculator.jsx` (`lines 60–75`).
- **Explanation:** Both components check `if (data.payment?.orderId && data.payment?.signature)` to call `/api/payments/verify`. In production, `createPaymentOrder()` (`server/payments.js:24-42`) returns a Razorpay `orderId` **without** `paymentId` or `signature` (which only come from the Razorpay Checkout browser modal callback). Consequently, in production the UI skips `/api/payments/verify` and renders the confirmation modal while the booking remains unpaid (`pending_payment`).
- **Recommended Fix:** Load `https://checkout.razorpay.com/v1/checkout.js`, pass `{ key: publicKeyId, order_id, amount, currency: 'INR' }` to `new window.Razorpay(...)`, and invoke `POST /api/payments/verify` inside the Razorpay `handler(response)` callback.

### P0-2: Hosting Mismatch — Vercel Static Config vs. Stateful Express + SQLite (`Production blocker`)
- **Affected Files:** `vercel.json`, `server/db.js:4`, `server/index.js`.
- **Explanation:** `vercel.json` rewrites non-`/api/` paths to `/index.html`, but has no `/api/*` backend target. Deploying Express + local `node:sqlite` (`fusion_salon.sqlite`) to serverless platforms causes data loss on ephemeral filesystems.
- **Recommended Fix:** Host Express on a persistent Node service (or migrate to PostgreSQL in Phase 1) and configure `vercel.json` `/api/*` proxy or `VITE_API_URL`.

---

## 6. High-Priority Issues (P1)

### P1-1: `releaseExpiredHolds()` Does Not Expire Abandoned `pending_payment` Bookings (`Partially verified`)
- **Affected File & Function:** `server/index.js` — `releaseExpiredHolds()` (`line 373`).
- **Explanation:** `UPDATE bookings SET status = 'expired' WHERE event_date = ? AND status = 'hold'` only expires `status = 'hold'`. When an abandoned `pending_payment` checkout expires on `calendar_dates` (whose `status` is `'hold'`), `calendar_dates` resets to `'available'`, but the `bookings` row remains `'pending_payment'` indefinitely.
- **Recommended Fix:** Update line 373 to `WHERE event_date = ? AND status IN ('hold', 'pending_payment')`.

### P1-2: Frontend Does Not Send `Idempotency-Key` Header (`Partially verified`)
- **Affected Files:** `src/components/BookingFlow.jsx:108`, `src/components/ServicesCalculator.jsx:44`.
- **Explanation:** Backend deduplicates `Idempotency-Key`, but the frontend does not yet generate/attach a per-attempt UUID header.
- **Recommended Fix:** Generate a UUID per checkout attempt (`crypto.randomUUID()`) and pass `'Idempotency-Key'` on `POST /api/bookings`.

### P1-3: Missing `public/images/` Files & Untested Live External APIs (`Not tested`)
- **Affected Path:** `public/images/`, `.env`.
- **Explanation:** `public/images/*.jpg` is deleted in the working tree (`D` in Git), and live Cloudinary / Razorpay / WhatsApp Business API calls were not tested against external endpoints.
- **Recommended Fix:** Configure real `.env` credentials in staging and run live end-to-end tests for Razorpay, Cloudinary, and WhatsApp templates.

---

## 7. Medium-Priority Issues (P2) & Technical Debt

- **P2-1: Shared `journey_steps` & Hardcoded Feb 2026 `calendar_dates`** (`server/db.js:139-196`) — Global 6-row checklist shared across brides; calendar limited to 28 days of Feb 2026. *(Scheduled for Phase 1 PostgreSQL migration).*
- **P2-2: In-Memory `revokedJtis` & Rate Limiter Stores** (`server/middleware/auth.js:4`, `server/middleware/rateLimit.js`) — Cleared on server restart; move to PostgreSQL/Redis in Phase 1.
- **P2-3: Local-State-Only UI Modules** (`BrideSuiteExtra.jsx`, `LoyaltyMembership.jsx`, `ViralEducatorHub.jsx`, Admin Pro Suite metrics) — Not yet persisted to DB.

---

## 8. Low-Priority Issues (P3)

- **P3-1: Helmet `styleSrc` Includes `'unsafe-inline'`** (`server/index.js:61`) — Required for current React/Tailwind inline styles.
- **P3-2: Placeholder Salon Phone & Sample Artist/Review Data** (`HeroMirror.jsx`, `FooterNav.jsx`, `server/db.js`) — Pending final owner content replacement.

---

## 9. Recommended Phase 1 Priorities
1. Fix **P1-1** (`releaseExpiredHolds` for `pending_payment`) and **P0-1** (real `window.Razorpay` Checkout modal + `Idempotency-Key`).
2. Execute **Phase 1 PostgreSQL Migration** (`DATABASE_MIGRATION_PLAN.md`) to normalize `customers`, `artists`, `artist_leaves`, per-booking `booking_journey_steps`, and dynamic multi-month calendars.
3. Add a background cron worker for hold expiration and automated WhatsApp reminders.
