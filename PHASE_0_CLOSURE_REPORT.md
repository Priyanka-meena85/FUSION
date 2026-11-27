# PHASE 0 CLOSURE REPORT — FUSION: THE MAGICAL MIRROR

**Project:** `d:\salon`  
**Phase:** Phase 0 Security & Reliability Closure  
**Database State:** SQLite (`server/fusion_salon.sqlite`) preserved operational (PostgreSQL migration deferred to Phase 1).

---

## 1. Phase 0 Closure Fixes Implemented

1. **Real Razorpay Checkout JS SDK Integration (`src/utils/razorpayCheckout.js`, `server/payments.js`, `src/components/BookingFlow.jsx`, `src/components/ServicesCalculator.jsx`, `server/index.js`)**:
   - `createPaymentOrder()` returns public `keyId` (never `RAZORPAY_KEY_SECRET`) alongside `orderId` when live Razorpay credentials are configured.
   - `openRazorpayCheckout()` dynamically loads `https://checkout.razorpay.com/v1/checkout.js` and opens `new window.Razorpay(...)` for live orders, forwarding `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` to `POST /api/payments/verify`.
   - Booking confirmation is **never** shown before `/api/payments/verify` returns `200 OK`. Cancelled (`modal.ondismiss`) and failed (`payment.failed`) checkouts display clear messages without confirming the booking or releasing active 48-hr holds.
   - Applied identically to both bridal bookings (`BookingFlow.jsx`) and `₹199` daily token bookings (`ServicesCalculator.jsx`).
   - Production Helmet CSP updated to allow `https://checkout.razorpay.com` (`scriptSrc`, `frameSrc`) and `https://api.razorpay.com` (`frameSrc`, `connectSrc`).

2. **Frontend Idempotency (`src/components/BookingFlow.jsx`, `src/components/ServicesCalculator.jsx`)**:
   - Generates a unique `crypto.randomUUID()` per booking attempt signature and reuses the same `Idempotency-Key` header on retries/double-clicks, resetting only after successful completion or when booking parameters change.

3. **Transactional `pending_payment` Expiry (`server/index.js` — `releaseExpiredHolds()`)**:
   - Wrapped expiry sweep in `BEGIN IMMEDIATE ... COMMIT`.
   - Expires both `hold` and `pending_payment` records whose `hold_expires_at <= now` and restores `calendar_dates` to `'available'` (plus standalone token `pending_payment` rows).
   - **Never** expires or releases `confirmed`, `locked`, or `token_locked` bookings.

---

## 2. Production Hosting Architecture Recommendation

### Why SQLite on Ephemeral Serverless Storage Is Not Production-Safe
Serverless platforms (such as Vercel Functions or AWS Lambda) run stateless, ephemeral containers where the local filesystem resets on every cold start, redeployment, or horizontal scale-out. Storing `server/fusion_salon.sqlite` on ephemeral disk will cause **total data loss** (bookings, payments, leads, reviews) and split-brain writes across concurrent instances.

### Recommended Production Topology
| Layer | Recommended Service | Configuration Notes |
| :--- | :--- | :--- |
| **Frontend (SPA)** | **Vercel** | Build command `npm run build`, output `dist/`, `vercel.json` SPA rewrites. Set `VITE_API_URL` (or `/api/*` rewrite) pointing to the backend URL. |
| **Backend API** | **Railway** or **Render** (Persistent Node.js) | Runs `npm start` (`node server/index.js`) with `NODE_ENV=production`, `ADMIN_PIN`, `SESSION_SECRET`, `ALLOWED_ORIGINS`, `RAZORPAY_*`, `CLOUDINARY_*`, `WHATSAPP_*`. |
| **Database (Phase 1)** | **PostgreSQL** (Supabase / Neon / Railway Postgres) | Connected via `DATABASE_URL` with ACID transactions and partial unique indexes (`DATABASE_MIGRATION_PLAN.md`). |
| **Image Storage** | **Cloudinary** | Signed server-side uploads (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), CDN URLs via `res.cloudinary.com`. |
| **CORS Allowlist** | `ALLOWED_ORIGINS` | Set strictly to your Vercel production domain (e.g., `https://fusion-ajmer.vercel.app`). |
| **Razorpay Webhook** | `https://<backend-domain>/api/webhooks/razorpay` | Subscribed to `payment.captured` and `payment.failed` using `RAZORPAY_WEBHOOK_SECRET`. |

---

## 3. Remaining Production Blockers Before Public Launch
1. **Phase 1 PostgreSQL Migration**: Migrate `server/db.js` from local SQLite to managed PostgreSQL (plus multi-month calendar & per-booking `journey_steps`).
2. **Live External Credentials & E2E Smoke Test**: Configure live `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `CLOUDINARY_*`, and `WHATSAPP_API_*` in the hosting environment and test with a ₹1 Razorpay test-mode transaction.
3. **Portfolio Photos & Real Salon Content**: Upload real `@fusionsaloon16` photos via `/admin` → `Upload IG Photos` and replace placeholder phone/sample artist data.
