import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { HERO_LOOKS } from '../data/salonData';
import { CssClock, CssCrown, CssPhone, CssSparkle, CssStar, FusionLogoMark, MirrorLookVisual } from './CssIcons';

export default function HeroMirror({ onTryLook, onCheckDate, onOpenAdmin }) {
  const [activeLookIdx, setActiveLookIdx] = useState(0);
  const [bridesCount, setBridesCount] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const mirrorContentRef = useRef(null);
  const headlineRef = useRef(null);

  const activeLook = HERO_LOOKS[activeLookIdx];
  const headlineWords = 'Mirror me dekho, apni dulhan wali glow dekho'.split(' ');

  useEffect(() => {
    if (headlineRef.current) {
      const words = headlineRef.current.querySelectorAll('.hero-word');
      gsap.fromTo(
        words,
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.08, delay: 0.75, ease: 'power3.out' }
      );
    }

    const counter = { brides: 0, rating: 0 };
    gsap.to(counter, {
      brides: 500,
      rating: 4.4,
      duration: 1.8,
      delay: 0.85,
      ease: 'power2.out',
      onUpdate: () => {
        setBridesCount(Math.round(counter.brides));
        setRatingCount(Number(counter.rating.toFixed(1)));
      },
    });
  }, []);

  const handleSelectLook = (idx) => {
    if (idx === activeLookIdx) return;
    setActiveLookIdx(idx);
    if (mirrorContentRef.current) {
      gsap.fromTo(
        mirrorContentRef.current,
        { opacity: 0.35, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 0.55, ease: 'power2.out' }
      );
    }
  };

  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-b from-[#121212] via-[#3B0A10] to-[#B01E2E] text-[#FFF8F0] pb-14">
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[540px] h-[540px] rounded-full bg-[#D4AF37]/15 blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-8 sm:pt-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#D4AF37]/50 bg-[#121212]/65 text-[#D4AF37] text-xs tracking-widest uppercase mb-5">
          <CssSparkle size={11} />
          <span>@fusionsaloon16 · Ajmer&apos;s Luxury Bridal Studio</span>
          <CssSparkle size={11} />
        </div>

        <h1
          ref={headlineRef}
          className="font-display text-3xl sm:text-5xl font-bold leading-tight max-w-2xl mb-7 text-[#FFF8F0]"
        >
          {headlineWords.map((word, idx) => (
            <span
              key={idx}
              className={`hero-word inline-block mr-2.5 ${
                word.toLowerCase().includes('dulhan') || word.toLowerCase().includes('glow')
                  ? 'text-[#D4AF37] italic pr-1'
                  : ''
              }`}
            >
              {word}
            </span>
          ))}
        </h1>

        {/* Ornate Royal Gold Mirror Frame */}
        <div className="relative flex items-center justify-center my-2">
          <span className="gold-particle -top-4 -left-6" style={{ animationDelay: '0s' }} />
          <span className="gold-particle top-12 -right-8" style={{ animationDelay: '0.9s', width: 10, height: 10 }} />
          <span className="gold-particle bottom-20 -left-8" style={{ animationDelay: '1.7s', width: 7, height: 7 }} />
          <span className="gold-particle -bottom-3 right-10" style={{ animationDelay: '2.4s', width: 9, height: 9 }} />

          <div className="relative p-3 sm:p-4 rounded-t-[160px] rounded-b-[28px] bg-gradient-to-br from-[#F5E08E] via-[#D4AF37] to-[#7C5B10] shadow-[0_24px_60px_rgba(0,0,0,0.65),0_0_40px_rgba(212,175,55,0.4)]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-8 rounded-t-full bg-gradient-to-b from-[#FFF8F0] via-[#F5E08E] to-[#D4AF37] border-2 border-[#B01E2E] flex items-center justify-center shadow-lg">
              <CssCrown className="text-[#B01E2E]" />
            </div>

            <div className="p-1.5 rounded-t-[148px] rounded-b-[20px] bg-[#121212] border border-[#FFF8F0]/40">
              <div className="relative w-[270px] sm:w-[310px] h-[340px] sm:h-[370px] rounded-t-[140px] rounded-b-[16px] overflow-hidden border border-[#D4AF37]/60">
                <div ref={mirrorContentRef} className="w-full h-full">
                  <MirrorLookVisual variant={activeLook.id} jewellery="Kundan" makeup="HD" />
                </div>

                <div className="absolute bottom-3 inset-x-3 rounded-xl bg-[#121212]/80 backdrop-blur-md border border-[#D4AF37]/60 px-3.5 py-2.5 text-left z-20">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]">
                        {activeLook.packageName}
                      </p>
                      <p className="font-display text-sm font-semibold text-white">
                        {activeLook.label}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#FFF8F0]/65 block">Package</span>
                      <span className="font-display text-base font-bold text-[#D4AF37]">
                        ₹{activeLook.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#FFF8F0]/75 mt-1">{activeLook.tagline}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Look Switcher Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 w-full max-w-2xl">
          {HERO_LOOKS.map((look, idx) => {
            const selected = idx === activeLookIdx;
            return (
              <button
                key={look.id}
                type="button"
                onClick={() => handleSelectLook(idx)}
                className={`press-bounce px-3 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  selected
                    ? 'bg-[#D4AF37] text-[#121212] border-[#FFF8F0] shadow-[0_0_20px_rgba(212,175,55,0.5)]'
                    : 'bg-[#121212]/60 text-[#FFF8F0] border-[#D4AF37]/40 hover:border-[#F5E08E]'
                }`}
              >
                {look.label}
              </button>
            );
          })}
        </div>

        {/* 2 Primary Red + Gold Shimmer CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-7 w-full sm:w-auto">
          <button
            type="button"
            onClick={onTryLook}
            className="btn-shimmer w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#B01E2E] border-2 border-[#D4AF37] text-[#FFF8F0] font-bold text-sm tracking-wide shadow-lg cursor-pointer"
          >
            Mirror Me Try Karo
          </button>
          <button
            type="button"
            onClick={onCheckDate}
            className="btn-shimmer w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#121212]/85 border border-[#D4AF37] text-[#D4AF37] font-semibold text-sm tracking-wide cursor-pointer"
          >
            Bridal Date Check Karo
          </button>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-8 w-full max-w-xl border-t border-[#D4AF37]/30 pt-5">
          <div>
            <div className="font-display text-xl sm:text-2xl font-bold text-[#D4AF37]">{bridesCount}+</div>
            <div className="text-[11px] sm:text-xs text-[#FFF8F0]/75">Brides Styled</div>
          </div>
          <div className="border-x border-[#D4AF37]/30 px-2">
            <div className="font-display text-xl sm:text-2xl font-bold text-[#D4AF37] inline-flex items-center gap-1.5">
              <span>{ratingCount}</span>
              <CssStar size={14} className="text-[#D4AF37]" />
            </div>
            <div className="text-[11px] sm:text-xs text-[#FFF8F0]/75">JustDial &amp; Google</div>
          </div>
          <div>
            <div className="font-display text-xl sm:text-2xl font-bold text-[#D4AF37]">48-Hr</div>
            <div className="text-[11px] sm:text-xs text-[#FFF8F0]/75">Auto Date Lock</div>
          </div>
        </div>
      </div>
    </section>
  );
}
