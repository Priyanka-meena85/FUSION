import React, { useState } from 'react';
import { CssSparkle } from './CssIcons';

const FAQS = [
  {
    q: 'What is the bridal advance amount and how does the 48-Hour Date Lock work?',
    a: 'Locking a bridal wedding date requires a ₹10,000 advance via UPI or Card. Inquiries without payment are held for 48 hours—if unpaid when the timer expires, the date automatically releases to the waitlist.',
  },
  {
    q: 'What is the difference between HD Bridal (₹25,000) and Airbrush Bridal (₹35,000)?',
    a: 'HD Bridal delivers a satin-matte, camera-ready finish with 14–16 hour wear. Airbrush Bridal uses a featherlight, silicone-free mist that is sweat-proof and ideal for outdoor or daytime ceremonies.',
  },
  {
    q: 'Do you travel to outstation venues in Jaipur, Pushkar, or Kishangarh?',
    a: 'Yes! Ajmer local bookings have ₹0 travel fee. Transparent outstation travel charges—Pushkar/Kishangarh (₹1,500), Jaipur (₹3,500), and Udaipur (₹5,000)—are displayed upfront before you book.',
  },
  {
    q: 'What is your reschedule and cancellation policy if our wedding date changes?',
    a: 'You can reschedule your wedding date once free of charge up to 7 days before the event from your Bridal Portal. Upon cancellation, the ₹10,000 bridal advance and ₹199 daily token are non-refundable.',
  },
  {
    q: 'Are bridal trials and lehenga/dupatta draping included?',
    a: 'Yes, a final trial session is scheduled on D-7 to lock your eye, lip, and jewellery pairing. Double-dupatta draping can be added in one click during booking confirmation.',
  },
  {
    q: 'What packages do you offer for grooms and daily salon services?',
    a: 'We offer the Royal Groom Package (₹8,000) and Groom Pre-Wedding Glow (₹3,499). Daily Haircuts (₹499), Hair Spa (₹999), and Hydra-Glow Facials (₹1,499) can be locked with a ₹199 token.',
  },
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section id="faq" className="reveal-section py-14 sm:py-18 px-4 bg-[#FAF6F0]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#9E1B2B] bg-[#F3ECE1] px-3.5 py-1 rounded-full">
            <CssSparkle size={11} /> Brides &amp; Clients FAQ
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#0B0B0C] mt-3">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-stone-600 mt-1.5">
            Clear answers on pricing, 48-hr holds, outstation travel &amp; trial sessions.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={item.q}
                className={`rounded-2xl border-2 transition ${
                  isOpen
                    ? 'bg-white border-[#D4AF37] shadow-[0_10px_28px_rgba(212,175,55,0.16)]'
                    : 'bg-white/80 border-[#D4AF37]/35 hover:border-[#9E1B2B]/50'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-display text-sm sm:text-base font-bold text-[#0B0B0C]">
                    {item.q}
                  </span>
                  <span
                    className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-sm font-bold border transition ${
                      isOpen
                        ? 'bg-[#9E1B2B] text-[#D4AF37] border-[#D4AF37]'
                        : 'bg-[#F3ECE1] text-[#9E1B2B] border-[#D4AF37]/40'
                    }`}
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-stone-700 leading-relaxed border-t border-[#D4AF37]/20 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
