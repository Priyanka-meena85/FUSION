# IMPLEMENTATION READINESS — FUSION: THE MAGICAL MIRROR

**Status:** Pre-Implementation Readiness Check Complete (Read-Only)  
**Git Branch:** `production-backend`  
**Working Tree:** Dirty — Midnight Obsidian theme edits across `src/`, `D` (deleted) on `public/images/*.jpg`, `M` on `dist/index.html`, and 4 untracked audit Markdown files (`AUDIT_REPORT.md`, `SECURITY_REPORT.md`, `DATABASE_MIGRATION_PLAN.md`, `PRODUCTION_ROADMAP.md`).

---

## 1. Verified Current Architecture

- **Frontend Entry Points:** `index.html` → `src/main.jsx` → `src/App.jsx` (`BrowserRouter`, `Navbar`, `FooterNav`).
- **8 Verified Routes (`src/App.jsx`):**
  1. `/` → `src/pages/HomePage.jsx`
  2. `/bridal` → `src/pages/BridalPage.jsx`
  3. `/services` → `src/pages/ServicesPage.jsx`
  4. `/gallery` → `src/pages/GalleryPage.jsx`
  5. `/book` → `src/pages/BookPage.jsx`
  6. `/reviews` → `src/pages/ReviewsPage.jsx`
  7. `/admin` → `src/pages/AdminPage.jsx`
  8. `/contact` → `src/pages/ContactPage.jsx`
- **Backend Entry Points:** `server/index.js` (Express `5.3.0` on `PORT=3001`), `server/db.js` (`node:sqlite` → `server/fusion_salon.sqlite`), `server/payments.js` (Razorpay + WhatsApp adapters).
- **Environment & Deployment Config:** `vite.config.mjs` (port `5173`, `/api` proxy to `:3001`), `.env.example`, `vercel.json` (SPA rewrite for non-`/api/` paths), `package.json` (`"type": "commonjs"`).

### Differences Found Between Audit Docs & Working Tree
1. **Git Branch & Dirty State:** Repo is on `production-backend` (not `main`) with uncommitted theme edits in `src/` and a tracked `dist/index.html` despite `dist/` being listed in `.gitignore`.
2. **Deleted Public Images:** `git status -s` shows `public/images/bride-pastel.jpg`, `bride-red.jpg`, `engagement.jpg`, `groom.jpg`, and `nails.jpg` marked `D` (deleted in working tree), meaning `CssIcons.jsx` and `GallerySection.jsx` currently fall back to CSS artwork.

---

## 2. Exact Files to Preserve (Unchanged)

- **Design System & Visuals:** `index.html`, `src/index.css`, `src/main.jsx`, `src/components/CssIcons.jsx`, `src/components/HeroMirror.jsx`, `src/components/Navbar.jsx`, `src/components/FooterNav.jsx`, `src/components/FaqSection.jsx`, `src/components/GallerySection.jsx`, `src/components/LookFinder.jsx`, `src/components/AiStudioMirror.jsx`, `src/components/ArtistsGroomSection.jsx`, `src/components/ChatbotDemo.jsx`, `src/components/ReviewsReferral.jsx`, `src/components/LoyaltyMembership.jsx`, `src/components/ViralEducatorHub.jsx`.
- **Pages (Non-Auth):** `src/pages/HomePage.jsx`, `src/pages/BridalPage.jsx`, `src/pages/ServicesPage.jsx`, `src/pages/GalleryPage.jsx`, `src/pages/BookPage.jsx`, `src/pages/ReviewsPage.jsx`, `src/pages/ContactPage.jsx`.
- **Config & Docs:** `vite.config.mjs`, `ARCHITECTURE.md`, `README.md`, `AUDIT_REPORT.md`, `SECURITY_REPORT.md`, `DATABASE_MIGRATION_PLAN.md`, `PRODUCTION_ROADMAP.md`.

---

## 3. Exact Files Requiring Modification

- **Backend:**
  - `server/index.js` — Enforce mandatory `ADMIN_PIN`/`SESSION_SECRET`, `HttpOnly` cookie or timing-safe HMAC, `helmet`, strict `cors`, `express-rate-limit`, `zod` validation, `requireAdmin` on `PATCH /api/campaigns/:id`, strip PII from `/api/calendar` and `/api/artists`, server-side pricing, per-booking token scoping on `/api/journey`, `/reschedule`, `/upsell`, `/prep-form`, and magic-byte image upload validation.
  - `server/payments.js` — Fail-closed `verifyRazorpaySignature()` when secret is missing in production; `crypto.timingSafeEqual`; webhook signature verification helper.
  - `server/db.js` — Add transactional helpers (`BEGIN IMMEDIATE`) and Phase 1 PostgreSQL adapter readiness.
- **Frontend (Targeted Security/Payment Wiring Only):**
  - `src/pages/AdminPage.jsx` — Remove `"Demo: 2026"` placeholder hint; use cookie/session-safe auth flow.
  - `src/components/AdminDashboard.jsx` — Align auth headers/credentials with updated admin session handling.
  - `src/components/BookingFlow.jsx` — Complete Razorpay checkout → `POST /api/payments/verify` flow before showing confirmed lock; pass booking access token.
  - `src/components/BridalJourney.jsx` — Pass per-booking access token to `/api/journey`, `/api/prep-form`, and `/reschedule`.
  - `src/components/FestivalOffers.jsx` — Restrict campaign toggle writes to authenticated admin context.
- **Config:**
  - `.env.example` — Add `SESSION_SECRET`, `ALLOWED_ORIGINS`, `RAZORPAY_WEBHOOK_SECRET`, `DATABASE_URL`.
  - `package.json` — Add Phase 0 security dependencies (when approved).

---

## 4. New Files to Create (During Implementation)

- `server/middleware/auth.js` — Timing-safe HMAC admin & per-booking token verification + cookie helpers.
- `server/middleware/rateLimit.js` — Login, booking, and lead rate limiters.
- `server/validation/schemas.js` — `zod` schemas and authoritative server-side pricing catalog.
- `server/routes/` (optional modular split for bookings, admin, payments, journey) and `server/webhooks/razorpay.js`.

---

## 5. Existing & Proposed Dependencies

- **Existing (`package.json`):**
  - `dependencies`: `cors` (`^2.8.6`), `express` (`^5.3.0`), `gsap` (`^3.15.1`), `react` (`^19.3.1`), `react-dom` (`^19.3.1`), `react-router-dom` (`^7.18.7`).
  - `devDependencies`: `@tailwindcss/vite` (`^4.3.5`), `@vitejs/plugin-react` (`^6.3.0`), `concurrently` (`^10.0.7`), `tailwindcss` (`^4.3.5`), `vite` (`^8.3.8`).
- **Proposed Additions (Phase 0 — Security & Validation):**
  - `helmet` — HTTP security headers.
  - `express-rate-limit` — Brute-force & abuse protection on `/api/admin/login` and write routes.
  - `zod` — Strict runtime request body validation.
  - `cookie-parser` — `HttpOnly` admin session cookie parsing.
  - `dotenv` — Reliable `.env` loading in Node/Express.
  - *(Phase 1)* `pg` — PostgreSQL client for database migration.

---

## 6. Phase 0 Implementation Sequence

1. **Backup & Git Hygiene:** Commit or stash current `production-backend` theme changes; back up `server/fusion_salon.sqlite`; untrack `dist/index.html` if needed; restore or re-add `public/images/*.jpg` if desired.
2. **Environment & Secrets Hardening:** Update `.env.example` and enforce startup validation for `ADMIN_PIN` and `SESSION_SECRET`.
3. **Security Middleware:** Install `helmet`, `express-rate-limit`, `zod`, `cookie-parser`, `dotenv`; apply CORS allowlist, security headers, and rate limits.
4. **Auth & IDOR Closure:** Protect `PATCH /api/campaigns/:id`, remove PIN hint from `AdminPage.jsx`, strip PII from `/api/calendar` and `/api/artists`, and add per-booking access tokens for `/api/journey`, `/prep-form`, `/reschedule`, and `/upsell`.
5. **Server-Side Pricing & Payment Verification:** Move pricing calculation to `server/validation/schemas.js`; make `POST /api/bookings` create `pending_payment`/`hold` records and lock only after `verifyRazorpaySignature()` passes with `crypto.timingSafeEqual`.
6. **Upload Validation:** Enforce JPEG/PNG/WebP magic-byte checks on `/api/admin/upload-image`.

---

## 7. Risks & Backup Requirements

- **Database Backup:** Copy `server/fusion_salon.sqlite` to a timestamped backup before any schema or migration work.
- **Dirty Working Tree:** `src/` has uncommitted Midnight Obsidian theme edits and `public/images/*.jpg` shows as deleted (`D`) in Git; commit/snapshot `production-backend` before Phase 0 edits so changes can be cleanly diffed or rolled back.
- **Breaking Public `Journey` Demo:** Scoping `GET /api/journey` to a per-booking token means visitors on `/bridal` without an active booking session will see an empty/prompt state unless a read-only demo mode or newly created booking token is stored in their browser session.
- **Express 5 Compatibility:** `package.json` uses `express@^5.3.0`; verify middleware (`express-rate-limit`, `cookie-parser`, `helmet`) compatibility during Phase 0 testing.
