import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  CssCalendar,
  CssClock,
  CssCrown,
  CssPhone,
  CssPin,
  CssSparkle,
  FusionLogoMark,
} from './CssIcons';

export default function FooterNav() {
  const navItems = [
    { to: '/', label: 'Home', icon: <CssCrown /> },
    { to: '/bridal', label: 'Looks', icon: <CssSparkle size={12} /> },
    { to: '/book', label: 'Book', icon: <CssCalendar /> },
    { to: '/services', label: 'Services', icon: <CssClock /> },
    { to: '/contact', label: 'More', icon: <CssPin /> },
  ];

  return (
    <>
      {/* Screen 11: Glossy Black Footer with Royal Gold Text */}
      <footer id="contact" className="bg-[#121212] text-[#D4AF37] pt-14 pb-28 sm:pb-16 px-4 border-t border-[#D4AF37]/35">
        <div className="max-w-5xl mx-auto">
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-10 relative overflow-hidden">
            <div className="mirror-sweep" />
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <FusionLogoMark size={46} />
                <div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-[#D4AF37] leading-none">
                    FUSION
                  </div>
                  <div className="text-[10px] tracking-[0.22em] uppercase text-[#FFF8F0]/80 mt-0.5">
                    THE MAGICAL MIRROR · <span className="font-script text-base capitalize text-[#FADADD]">By Mini Jain</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#FFF8F0]/75 leading-relaxed">
                Unisex Salon &amp; Luxury Bridal Studio. Walk in for your Magical Mirror trial or book outstation bridal teams across Ajmer, Kishangarh, Pushkar &amp; Jaipur.
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#B01E2E] border border-[#D4AF37]/50 flex items-center justify-center text-[#F5E08E]">
                    <CssPin />
                  </span>
                  <span>Naka Madar, Ajmer, Near Jain Mandir (Rajasthan)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#B01E2E] border border-[#D4AF37]/50 flex items-center justify-center text-[#F5E08E]">
                    <CssClock />
                  </span>
                  <span>10:00 AM – 8:30 PM · Open All 7 Days</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#B01E2E] border border-[#D4AF37]/50 flex items-center justify-center text-[#F5E08E]">
                    <CssPhone />
                  </span>
                  <span>+91 98290 00000 · WhatsApp &amp; Bridal Desk</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="https://maps.google.com/?q=Naka+Madar+Jain+Mandir+Ajmer"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-shimmer px-5 py-2.5 rounded-full bg-[#D4AF37] text-[#121212] text-xs font-bold"
                >
                  Get Directions
                </a>
                <a
                  href="https://wa.me/919829000000"
                  target="_blank"
                  rel="noreferrer"
                  className="press-bounce px-5 py-2.5 rounded-full border border-[#D4AF37] text-[#F5E08E] text-xs font-semibold"
                >
                  Chat on WhatsApp
                </a>
                <a
                  href="https://www.instagram.com/fusionsaloon16"
                  target="_blank"
                  rel="noreferrer"
                  className="press-bounce px-5 py-2.5 rounded-full border border-[#D4AF37]/60 text-[#FFF8F0] text-xs font-semibold"
                >
                  @fusionsaloon16
                </a>
              </div>
            </div>

            {/* Styled CSS Map Placeholder */}
            <div className="md:col-span-6">
              <div className="relative h-56 rounded-3xl overflow-hidden border border-[#D4AF37]/45 bg-[#2A0510] p-5 flex flex-col justify-between">
                {/* Grid lines */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                  }}
                />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#121212]/80 border border-[#D4AF37]/40 text-[11px] text-[#F5E08E] font-semibold">
                    Naka Madar · Ajmer
                  </span>
                  <span className="text-[11px] text-[#FFF8F0]/70">26.4499° N, 74.6399° E</span>
                </div>

                {/* Animated Map Pin */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/25 flex items-center justify-center animate-pulse">
                    <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#121212] flex items-center justify-center shadow-lg">
                      <CssPin />
                    </div>
                  </div>
                  <span className="mt-2 px-3 py-1 rounded-lg bg-[#121212]/85 text-[11px] font-bold text-[#F5E08E] border border-[#D4AF37]/40">
                    Fusion Salon · Near Jain Mandir
                  </span>
                </div>

                <div className="relative z-10 text-[10px] text-[#FFF8F0]/60 text-center">
                  Free Bridal Parking Available · 5 min from Ajmer Junction
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button on ALL Screens */}
      <a
        href="https://wa.me/919829000000?text=Hi%20Fusion%20The%20Magical%20Mirror%20Ajmer"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="press-bounce fixed right-4 bottom-20 sm:bottom-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-[#1F8A4C] text-white shadow-[0_10px_28px_rgba(31,138,76,0.45)] border border-white/30"
      >
        <CssPhone />
        <span className="text-xs font-bold hidden sm:inline">WhatsApp</span>
      </a>

      {/* Mobile-First Bottom Sticky Nav: Home | Looks | Book | Services | More */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#121212]/95 backdrop-blur-md border-t border-[#D4AF37]/40 px-2 py-2"
      >
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-semibold transition ${
                  isActive ? 'text-[#D4AF37] bg-[#B01E2E]/65' : 'text-[#FFF8F0]/75'
                }`
              }
            >
              <span className="h-4 flex items-center justify-center mb-0.5">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
