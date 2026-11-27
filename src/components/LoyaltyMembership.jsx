import React, { useState } from 'react';
import { CssCheck, CssCrown, CssSparkle } from './CssIcons';

export default function LoyaltyMembership() {
  const [joinedPack, setJoinedPack] = useState(null);
  const [bdayDate, setBdayDate] = useState('1998-05-14');
  const [bdaySaved, setBdaySaved] = useState(false);

  return (
    <section className="reveal-section py-14 px-4 bg-[#FFF8F0]">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#B01E2E] bg-[#FADADD] px-3.5 py-1 rounded-full">
            <CssCrown /> Membership, Loyalty &amp; Policies
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#121212] mt-3">
            Repeat Glow Packs &amp; Transparent Policies
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* #23 Membership Pack 1 */}
          <div className="rounded-3xl bg-white p-6 border border-[#D4AF37]/40 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#B01E2E] bg-[#FADADD] px-2.5 py-1 rounded-full">
                Most Popular Pack
              </span>
              <h3 className="font-display text-xl font-bold mt-3 text-[#121212]">Hair Spa 4 + 1 Free</h3>
              <p className="text-xs text-stone-600 mt-1.5">
                5 Moroccan Keratin Hair Spa sessions valid for 6 months. Save ₹999 instantly.
              </p>
              <div className="font-display text-2xl font-bold text-[#B01E2E] mt-4">₹3,996</div>
            </div>
            <button
              type="button"
              onClick={() => setJoinedPack('Hair Spa 4+1 Free')}
              className="btn-shimmer mt-5 w-full py-2.5 rounded-full bg-[#B01E2E] text-[#FFF8F0] text-xs font-bold cursor-pointer"
            >
              {joinedPack === 'Hair Spa 4+1 Free' ? 'Pack Activated!' : 'Activate Hair Spa Pack'}
            </button>
          </div>

          {/* #23 Membership Pack 2 */}
          <div className="rounded-3xl bg-white p-6 border border-[#D4AF37]/40 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#B01E2E] bg-[#FADADD] px-2.5 py-1 rounded-full">
                Pre-Bridal Monthly
              </span>
              <h3 className="font-display text-xl font-bold mt-3 text-[#121212]">Hydra-Glow Facial Club</h3>
              <p className="text-xs text-stone-600 mt-1.5">
                4 Monthly Hydra-Glow Facials + Free Eyebrow &amp; Upper Lip every visit.
              </p>
              <div className="font-display text-2xl font-bold text-[#B01E2E] mt-4">₹4,999</div>
            </div>
            <button
              type="button"
              onClick={() => setJoinedPack('Hydra-Glow Facial Club')}
              className="btn-shimmer mt-5 w-full py-2.5 rounded-full bg-[#B01E2E] text-[#FFF8F0] text-xs font-bold cursor-pointer"
            >
              {joinedPack === 'Hydra-Glow Facial Club' ? 'Pack Activated!' : 'Join Facial Club'}
            </button>
          </div>

          {/* #24 Birthday / Anniversary Auto-Offer */}
          <div className="rounded-3xl bg-gradient-to-br from-[#B01E2E] to-[#4A081C] text-[#FFF8F0] p-6 border border-[#D4AF37] shadow-lg flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-[#F5E08E]">
                <CssSparkle size={10} /> Birthday &amp; Anniversary Auto-Gift
              </span>
              <h3 className="font-display text-xl font-bold mt-2">Flat 20% OFF on Facial</h3>
              <p className="text-xs text-[#FFF8F0]/80 mt-1.5">
                Save your special date. Fusion sends your automated WhatsApp birthday gift voucher every year!
              </p>
              <input
                type="date"
                value={bdayDate}
                onChange={(e) => setBdayDate(e.target.value)}
                className="mt-3 w-full px-3 py-2 rounded-xl bg-white/10 border border-[#D4AF37]/50 text-xs text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => setBdaySaved(true)}
              className="press-bounce mt-4 w-full py-2.5 rounded-full bg-[#D4AF37] text-[#121212] text-xs font-bold cursor-pointer"
            >
              {bdaySaved ? '20% Gift Scheduled on WhatsApp!' : 'Save Special Date'}
            </button>
          </div>
        </div>

        {/* #44 Cancel / Refund Policy Clear */}
        <div className="rounded-2xl bg-[#FADADD]/65 border border-[#D4AF37]/40 p-5">
          <h4 className="font-display text-base font-bold text-[#B01E2E] mb-2">
            Clear Booking, Reschedule &amp; Cancellation Policy
          </h4>
          <div className="grid sm:grid-cols-3 gap-3 text-xs text-[#121212]/80">
            <div className="flex items-start gap-2">
              <span className="text-[#B01E2E] mt-0.5"><CssCheck /></span>
              <span><strong>48-Hr Hold Rule:</strong> Unpaid holds auto-release after 48 hours and notify waitlisted brides.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#B01E2E] mt-0.5"><CssCheck /></span>
              <span><strong>1 Free Reschedule:</strong> Change your wedding date once free of cost up to 7 days before the event.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#B01E2E] mt-0.5"><CssCheck /></span>
              <span><strong>Advance Policy:</strong> ₹10,000 bridal advance &amp; ₹199 daily token are non-refundable upon cancellation.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
