# System Architecture — FUSION: THE MAGICAL MIRROR (By Mini Jain)

## 1. High-Level System Design
FUSION is a multi-page, mobile-first full-stack web application built for **Naka Madar, Ajmer** with a 3-tier architecture:

1. **Presentation & Experience Layer (React 19 + React Router v7 + Tailwind CSS + GSAP)**
   - **Multi-Page Architecture**: Clean client-side routing across 8 dedicated pages (`/`, `/bridal`, `/services`, `/gallery`, `/book`, `/reviews`, `/admin`, `/contact`) wrapped in a persistent Glossy Black (`#121212`) + Royal Gold (`#D4AF37`) header, mobile bottom sticky nav, and floating WhatsApp concierge.
   - **Brand System**: Bridal Red (`#B01E2E`), Royal Gold (`#D4AF37`), Soft Nail Pink (`#FADADD`), Glossy Black (`#121212`), Cream (`#FFF8F0`), paired with `Playfair Display` (headings), `Inter` (body), and `Great Vibes` (`By Mini Jain` signature).
   - **Animation Engine**: GSAP `ScrollTrigger` section reveals, velvet salon curtain intro on initial load, `0.97x` micro-interaction press bounce, and CSS GPU-composited shimmers (`transform`/`opacity` only, `prefers-reduced-motion` aware).

2. **Application & Automation API Layer (Node.js + Express on `:3001`)**
   - **Booking & 48-Hr Lock Engine**: Enforces advance-based locking (`locked`), 48-hour expiry holds (`hold`), automatic release of expired holds (`releaseExpiredHolds()`), waitlist auto-notification, 1-time free rescheduling, and artist leave/double-booking conflict checks.
   - **CRM & Lead Capture**: Unified Lead Inbox aggregating Website, Instagram, and WhatsApp Bot inquiries including Human Handover alerts.
   - **Post-Booking & Retention APIs**: Bride Prep Outfit/Jewellery form persistence, D-30 to D+1 Journey checklist, Google Reviews wall, and Festival Auto-Campaign toggles.

3. **Persistence Layer (Built-in SQLite via `node:sqlite`)**
   - `calendar_dates` — Feb 2026 day-wise availability, hold expiry timestamps, and lock receipts.
   - `bookings` — Full bridal/groom/daily-token records, travel charges, upsells, and reschedule counts.
   - `artists` — Artist specialties, ratings, phone numbers, and leave dates.
   - `leads` — Multi-channel lead inbox (`Instagram`, `WhatsApp`, `Website`, `WhatsApp Bot`).
   - `waitlist` — Date-specific waitlist queue with auto-refill notification flags.
   - `bride_prep_forms` & `journey_steps` — Bride personal portal state.
   - `reviews` & `campaigns` — Live reviews and automated festival campaigns.
