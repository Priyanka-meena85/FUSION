import React, { useState } from 'react';
import { CssSparkle } from './CssIcons';

const FAQS = [
  {
    q: 'Bridal advance kitna hota hai aur 48-Hr Date Lock rule kya hai?',
    a: 'Bridal date lock karne ke liye ₹10,000 advance (UPI/Card) lagta hai. Bina payment ke inquiry 48 hours tak hold pe rehti hai—agar 48 hrs me payment nahi aaya to date auto-free ho jaati hai aur waitlisted bride ko chali jaati hai.',
  },
  {
    q: 'HD Bridal (₹25,000) aur Airbrush Bridal (₹35,000) me kya difference hai?',
    a: 'HD Bridal satin-matte brush/sponge finish deta hai (14–16 hrs stay). Airbrush Bridal silicone-free featherlight mist se hota hai—sweat-proof, waterproof aur outdoor/daytime pheras ke liye best hai.',
  },
  {
    q: 'Kya aap Jaipur, Pushkar ya Kishangarh outstation venues par aate ho?',
    a: 'Haan! Ajmer city me ₹0 travel charge hai. Pushkar/Kishangarh ke liye ₹1,500, Jaipur ₹3,500 aur Udaipur ₹5,000 fixed outstation travel charge pehle hi calendar booking me clear dikhta hai.',
  },
  {
    q: 'Agar shaadi ki date change ho jaye to reschedule ya refund policy kya hai?',
    a: 'Aap apne Bridal Portal se 1 baar FREE date reschedule kar sakti hain (event se 7 din pehle tak). Cancellation par ₹10,000 bridal advance aur ₹199 daily token non-refundable hote hain.',
  },
  {
    q: 'Kya bridal booking me Trial session aur Lehenga/Dupatta draping included hai?',
    a: 'Haan, D-7 par aapka Final Trial session (e.g. 25 Jan, 4 PM) schedule hota hai jahan eye/lip look aur jewellery lock hoti hai. Double-dupatta draping aap Booking Confirmation par 1-click add kar sakti hain.',
  },
  {
    q: 'Groom ke liye aur daily Hair/Skin services ke liye kya packages hain?',
    a: 'Dulhe ke liye Royal Groom Package (₹8,000) aur Pre-Wedding Glow (₹3,499) available hai. Daily Haircut (₹499), Hair Spa (₹999), Hydra-Glow Facial (₹1,499) aap ₹199 token se lock kar sakte hain.',
  },
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section id="faq" className="reveal-section py-14 sm:py-18 px-4 bg-[#FFF8F0]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#B01E2E] bg-[#FADADD] px-3.5 py-1 rounded-full">
            <CssSparkle size={11} /> Brides &amp; Clients FAQ
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#121212] mt-3">
            Aapke Sawal, Hamare Seedhe Jawab
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
                    : 'bg-white/80 border-[#D4AF37]/35 hover:border-[#B01E2E]/50'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-display text-sm sm:text-base font-bold text-[#121212]">
                    {item.q}
                  </span>
                  <span
                    className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-sm font-bold border transition ${
                      isOpen
                        ? 'bg-[#B01E2E] text-[#D4AF37] border-[#D4AF37]'
                        : 'bg-[#FADADD] text-[#B01E2E] border-[#D4AF37]/40'
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
