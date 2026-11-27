import React from 'react';
import { Link } from 'react-router-dom';
import LoyaltyMembership from '../components/LoyaltyMembership';
import FaqSection from '../components/FaqSection';
import { CssClock, CssPin, CssPhone, CssSparkle } from '../components/CssIcons';

export default function ContactPage() {
  return (
    <div className="bg-[#FFF8F0]">
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#B01E2E] bg-[#FADADD] px-3.5 py-1 rounded-full">
            <CssSparkle size={11} /> Visit Fusion Salon, Ajmer
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#121212]">
            Naka Madar, Near Jain Mandir
          </h1>
          <p className="text-sm text-stone-600 max-w-xl mx-auto">
            Open 7 days a week from 10:00 AM to 8:30 PM. Walk in for a Magical Mirror bridal trial or book online in 3 clicks.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 pt-4 text-left">
            <div className="rounded-2xl bg-white p-5 border-2 border-[#D4AF37]/45">
              <div className="text-[#B01E2E] mb-2"><CssPin /></div>
              <div className="font-display font-bold text-base">Address</div>
              <p className="text-xs text-stone-600 mt-1">Naka Madar, Ajmer, Near Jain Mandir, Rajasthan</p>
            </div>
            <div className="rounded-2xl bg-white p-5 border-2 border-[#D4AF37]/45">
              <div className="text-[#B01E2E] mb-2"><CssClock /></div>
              <div className="font-display font-bold text-base">Salon Hours</div>
              <p className="text-xs text-stone-600 mt-1">10:00 AM – 8:30 PM · Open All 7 Days</p>
            </div>
            <div className="rounded-2xl bg-white p-5 border-2 border-[#D4AF37]/45">
              <div className="text-[#B01E2E] mb-2"><CssPhone /></div>
              <div className="font-display font-bold text-base">Direct Desk</div>
              <p className="text-xs text-stone-600 mt-1">+91 98290 00000 · @fusionsaloon16</p>
            </div>
          </div>

          <div className="pt-4">
            <Link
              to="/book"
              className="btn-shimmer inline-block px-7 py-3 rounded-full bg-[#B01E2E] border-2 border-[#D4AF37] text-white text-xs font-bold"
            >
              Book Your Appointment Now
            </Link>
          </div>
        </div>
      </section>

      <LoyaltyMembership />
      <FaqSection />
    </div>
  );
}
