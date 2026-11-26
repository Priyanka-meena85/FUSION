import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { CssSparkle, MirrorLookVisual } from './CssIcons';

const LEHENGA_OPTIONS = [
  { id: 'Red', label: 'Red', swatch: '#B91C3B', variant: 'red-bride' },
  { id: 'Maroon', label: 'Maroon', swatch: '#B01E2E', variant: 'red-bride' },
  { id: 'Pastel', label: 'Pastel', swatch: '#E598AC', variant: 'pastel-bride' },
  { id: 'Pink', label: 'Pink', swatch: '#D9468F', variant: 'engagement' },
];

const JEWELLERY_OPTIONS = ['Kundan', 'Polki', 'Gold'];
const MAKEUP_OPTIONS = ['HD', 'Airbrush'];

export default function LookFinder({ onBookLook }) {
  const [lehenga, setLehenga] = useState(LEHENGA_OPTIONS[0]);
  const [jewellery, setJewellery] = useState('Kundan');
  const [makeup, setMakeup] = useState('HD');
  const [sparkleKey, setSparkleKey] = useState(0);
  const [displayPrice, setDisplayPrice] = useState(25000);
  const prevPriceRef = useRef(25000);
  const descRef = useRef(null);

  const computedPrice = makeup === 'Airbrush' ? 35000 : lehenga.id === 'Pastel' ? 28000 : 25000;
  const recommendedPackage = makeup === 'Airbrush' ? 'Airbrush Bridal' : 'HD Bridal';
  const artistName =
    makeup === 'Airbrush'
      ? 'Riya Sen (Senior Airbrush Director)'
      : lehenga.id === 'Pastel'
      ? 'Neha Kapoor (Pastel & Dewy Specialist)'
      : 'Riya Sen (Lead Bridal Artist)';

  const aiLookName = `${lehenga.id} Lehenga · ${jewellery} Glow · ${makeup} Finish`;
  const aiSummary =
    makeup === 'Airbrush'
      ? 'Featherlight silicone-free airbrush base with sculpted soft-bronze eyes and 16-hr sweat-proof seal.'
      : 'Luminous HD satin-matte skin, kohl-rimmed royal eyes, and custom undertone lip blend.';

  useEffect(() => {
    const obj = { val: prevPriceRef.current };
    gsap.to(obj, {
      val: computedPrice,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => setDisplayPrice(Math.round(obj.val)),
    });
    prevPriceRef.current = computedPrice;
  }, [computedPrice]);

  useEffect(() => {
    if (descRef.current) {
      gsap.fromTo(descRef.current, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    }
  }, [makeup, lehenga, jewellery]);

  const handleJewellery = (j) => {
    setJewellery(j);
    setSparkleKey((k) => k + 1);
  };

  return (
    <section id="looks" className="reveal-section py-14 sm:py-18 px-4 bg-[#FFF8F0]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-9">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#B01E2E] bg-[#FADADD] px-3.5 py-1 rounded-full">
            <CssSparkle size={11} /> Look Finder — Mirror Me Try Karo
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#121212] mt-3">
            Apna Bridal Look Khud Design Karo
          </h2>
          <p className="text-sm text-[#121212]/70 mt-2 max-w-xl mx-auto">
            Select your lehenga colour, jewellery &amp; makeup finish. The Magical Mirror previews your custom look with exact transparent pricing.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-7 items-center bg-white rounded-3xl p-5 sm:p-8 shadow-[0_20px_50px_rgba(107,15,42,0.08)] border border-[#D4AF37]/30">
          {/* Left: Interactive Mirror Preview */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="p-2.5 rounded-t-[130px] rounded-b-2xl bg-gradient-to-br from-[#F5E08E] via-[#D4AF37] to-[#8C6B14] shadow-xl">
              <div className="w-[240px] sm:w-[260px] h-[300px] rounded-t-[120px] rounded-b-xl overflow-hidden border border-[#FFF8F0]/50">
                <MirrorLookVisual
                  variant={lehenga.variant}
                  jewellery={jewellery}
                  makeup={makeup}
                  sparkleBurstKey={sparkleKey}
                />
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="text-[11px] uppercase tracking-widest text-[#B01E2E] font-semibold">
                AI Suggested Look
              </span>
              <p className="font-display text-base font-bold text-[#121212]">{aiLookName}</p>
            </div>
          </div>

          {/* Right: 3 Selectors + Output */}
          <div className="md:col-span-7 space-y-6">
            {/* 1. Lehenga Colour */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#B01E2E] mb-2.5">
                1. Lehenga Colour
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {LEHENGA_OPTIONS.map((opt) => {
                  const active = lehenga.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLehenga(opt)}
                      className={`press-bounce flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                        active
                          ? 'border-[#D4AF37] bg-[#FADADD] text-[#B01E2E] shadow-sm'
                          : 'border-stone-200 bg-[#FFF8F0] text-[#121212]/80 hover:border-[#D4AF37]/60'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: opt.swatch }}
                      />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Jewellery */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#B01E2E] mb-2.5">
                2. Jewellery Style
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {JEWELLERY_OPTIONS.map((j) => {
                  const active = jewellery === j;
                  return (
                    <button
                      key={j}
                      type="button"
                      onClick={() => handleJewellery(j)}
                      className={`press-bounce py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                        active
                          ? 'border-[#D4AF37] bg-[#B01E2E] text-[#FFF8F0] shadow-md'
                          : 'border-stone-200 bg-[#FFF8F0] text-[#121212]/80 hover:border-[#D4AF37]'
                      }`}
                    >
                      {j}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Makeup Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#B01E2E] mb-2.5">
                3. Makeup Finish
              </label>
              <div className="grid grid-cols-2 gap-3">
                {MAKEUP_OPTIONS.map((m) => {
                  const active = makeup === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMakeup(m)}
                      className={`press-bounce py-2.5 px-4 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                        active
                          ? 'border-[#D4AF37] bg-[#B01E2E] text-[#FFF8F0] shadow-md'
                          : 'border-stone-200 bg-[#FFF8F0] text-[#121212]/80 hover:border-[#D4AF37]'
                      }`}
                    >
                      {m} Bridal Finish
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Output Card */}
            <div
              ref={descRef}
              className="rounded-2xl bg-gradient-to-br from-[#FFF8F0] to-[#FADADD]/70 border border-[#D4AF37]/45 p-4 space-y-3"
            >
              <p className="text-xs text-[#121212]/80 leading-relaxed">{aiSummary}</p>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#D4AF37]/25">
                <div>
                  <span className="text-[10px] uppercase text-[#121212]/60 block">Recommended</span>
                  <span className="text-xs sm:text-sm font-bold text-[#B01E2E]">{recommendedPackage}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#121212]/60 block">Exact Price</span>
                  <span className="font-display text-lg sm:text-xl font-bold text-[#121212]">
                    ₹{displayPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#121212]/60 block">Lead Artist</span>
                  <span className="text-xs font-semibold text-[#121212]">{artistName.split(' (')[0]}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onBookLook({
                  packageName: recommendedPackage,
                  price: computedPrice,
                  lehenga: lehenga.id,
                  jewellery,
                  makeup,
                  artist: artistName,
                })
              }
              className="btn-shimmer w-full py-3.5 rounded-full bg-gradient-to-r from-[#B01E2E] via-[#8D173A] to-[#B01E2E] text-[#FFF8F0] font-bold text-sm tracking-wide border border-[#D4AF37] cursor-pointer"
            >
              Is Look Ko Book Karo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
