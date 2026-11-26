import React, { useEffect, useState } from 'react';
import { GALLERY_SLIDERS, REAL_BRIDES } from '../data/salonData';
import { CssSparkle, MirrorLookVisual } from './CssIcons';

function BeforeAfterCard({ item }) {
  const [pos, setPos] = useState(52);

  // Auto-play back-and-forth for 3 seconds on load to draw attention
  useEffect(() => {
    const t1 = setTimeout(() => setPos(75), 500);
    const t2 = setTimeout(() => setPos(30), 1500);
    const t3 = setTimeout(() => setPos(52), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="bg-white rounded-3xl p-4 border border-[#D4AF37]/35 shadow-sm">
      <div className="relative h-64 rounded-2xl overflow-hidden select-none">
        {/* After Layer (Full) */}
        <div className="absolute inset-0">
          <MirrorLookVisual variant={item.afterVariant} jewellery="Kundan" makeup="Airbrush" />
          <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-[#B01E2E] text-[#F5E08E] text-[10px] font-bold z-10">
            AFTER: {item.afterLabel}
          </span>
        </div>

        {/* Before Layer (Clipped) */}
        <div
          className="absolute inset-0 transition-[clip-path] duration-150 ease-out"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <div className="w-full h-full grayscale-[55%] brightness-95">
            <MirrorLookVisual variant={item.beforeVariant} jewellery="Gold" makeup="HD" />
          </div>
          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-[#121212]/80 text-white text-[10px] font-bold z-10">
            BEFORE: {item.beforeLabel}
          </span>
        </div>

        {/* Vertical Gold Divider */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#F5E08E] shadow-[0_0_12px_#D4AF37] z-20 pointer-events-none"
          style={{ left: `${pos}%` }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#D4AF37] border-2 border-[#FFF8F0] text-[#121212] flex items-center justify-center text-[10px] font-bold shadow-lg">
            &lt;&gt;
          </div>
        </div>

        {/* Range input for smooth drag/touch */}
        <input
          type="range"
          min={8}
          max={92}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Before and After slider for ${item.title}`}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
        />
      </div>

      <div className="mt-3">
        <h3 className="font-display text-base font-bold text-[#121212]">{item.title}</h3>
        <p className="text-xs text-[#B01E2E] font-semibold">{item.bride}</p>
        <p className="text-[11px] text-stone-500">{item.package}</p>
      </div>
    </div>
  );
}

export default function GallerySection() {
  const [nailImgOk, setNailImgOk] = useState(true);

  return (
    <section className="reveal-section py-14 sm:py-18 px-4 bg-[#FADADD]/45 border-y border-[#D4AF37]/25">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#B01E2E] bg-white px-3.5 py-1 rounded-full border border-[#D4AF37]/35">
            <CssSparkle size={11} /> Real Transformations
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#121212] mt-3">
            Before / After Mirror Gallery
          </h2>
          <p className="text-sm text-[#121212]/70 mt-1.5">
            Drag the gold slider left or right to compare pre-prep skin with final Fusion bridal glam.{' '}
            <a
              href="https://www.instagram.com/fusionsaloon16"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[#B01E2E] underline"
            >
              @fusionsaloon16 on Instagram
            </a>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {GALLERY_SLIDERS.map((item) => (
            <BeforeAfterCard key={item.id} item={item} />
          ))}
        </div>

        {/* Signature Nail Art Studio Card (@fusionsaloon16 style) */}
        <div className="mt-10 rounded-3xl bg-[#121212] text-[#FFF8F0] p-6 sm:p-8 border border-[#D4AF37]/60 shadow-2xl grid md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-2">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37] font-bold">
              Signature Nail Art Studio · By Mini Jain
            </span>
            <h3 className="font-display text-2xl font-bold">
              Sheer Nail Pink + White French Tip + Royal Gold Swirl
            </h3>
            <p className="text-xs text-[#FFF8F0]/75 leading-relaxed">
              Bridal gel extensions &amp; custom French tip nail art crafted to match your red lehenga and Kundan/Polki jewellery.
            </p>
          </div>
          <div className="md:col-span-5 flex items-center justify-center gap-3">
            {nailImgOk ? (
              <img
                src="/images/nails.jpg"
                alt="Signature Nail Art Studio By Mini Jain"
                onError={() => setNailImgOk(false)}
                className="w-full h-36 object-cover rounded-2xl border border-[#D4AF37]/70"
              />
            ) : (
              [0, 1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="relative w-10 h-20 rounded-t-full rounded-b-lg bg-gradient-to-b from-[#FADADD] via-[#F7C6CC] to-[#E9A8B2] border border-[#D4AF37]/70 shadow-[0_8px_20px_rgba(212,175,55,0.25)] overflow-hidden"
                >
                  {/* White French Tip */}
                  <div className="h-4 w-full bg-[#FFF8F0] rounded-b-[50%]" />
                  {/* Gold Swirl Accent */}
                  <div className="mt-2 mx-auto w-6 h-6 rounded-full border-t-2 border-r-2 border-[#D4AF37] rotate-45" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real Brides Grid */}
        <div className="mt-10">
          <h3 className="font-display text-xl font-bold text-[#B01E2E] mb-4 text-center">
            Real Brides &amp; Grooms of Ajmer
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {REAL_BRIDES.map((b) => (
              <div
                key={b.name}
                className="group bg-white rounded-2xl overflow-hidden border border-[#D4AF37]/35 shadow-sm hover:shadow-xl transition"
              >
                <div className="h-36 overflow-hidden">
                  <div className="w-full h-full transition-transform duration-500 group-hover:scale-105">
                    <MirrorLookVisual variant={b.variant} jewellery="Kundan" makeup="HD" />
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-display text-sm font-bold text-[#121212]">{b.name}</div>
                  <div className="text-[11px] text-[#B01E2E] font-semibold">{b.city}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">{b.look}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
