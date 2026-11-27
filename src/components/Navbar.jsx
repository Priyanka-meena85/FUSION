import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CssClock, CssPhone, CssStar, FusionLogoMark } from './CssIcons';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/bridal', label: 'Bridal & AI' },
  { to: '/services', label: 'Services' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/book', label: 'Book Now' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#D4AF37]/40 bg-[#0B0B0C]/95 backdrop-blur-md text-[#FAF6F0]">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Circular Instagram Logo + FUSION + THE MAGICAL MIRROR + By Mini Jain */}
        <NavLink to="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2.5 sm:gap-3">
          <FusionLogoMark size={42} />
          <div>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="font-display text-base sm:text-xl font-extrabold tracking-widest text-[#D4AF37] leading-none">
                FUSION
              </span>
              <span className="font-script text-sm sm:text-lg text-[#F3ECE1] leading-none">
                By Mini Jain
              </span>
            </div>
            <div className="text-[9px] sm:text-[10px] tracking-[0.22em] uppercase text-[#FAF6F0]/80 mt-0.5">
              THE MAGICAL MIRROR
            </div>
            <div className="text-[10px] text-[#FAF6F0]/60 hidden sm:flex items-center gap-2 mt-0.5">
              <span>Naka Madar, Ajmer</span>
              <span className="text-[#D4AF37]">|</span>
              <span className="inline-flex items-center gap-1 text-[#D4AF37] font-semibold">
                <CssStar size={10} /> 4.4
              </span>
              <span className="text-[#D4AF37]">|</span>
              <span className="inline-flex items-center gap-1">
                <CssClock /> 10 AM - 8:30 PM
              </span>
            </div>
          </div>
        </NavLink>

        {/* Center: Multi-Page Desktop Navigation */}
        <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#9E1B2B] text-[#FAF6F0] border border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                    : 'text-[#FAF6F0]/80 hover:text-[#D4AF37] hover:bg-white/5'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Admin + WhatsApp + Mobile Drawer Toggle */}
        <div className="flex items-center gap-2">
          <NavLink
            to="/admin"
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `press-bounce hidden sm:inline-block text-[11px] px-3 py-1.5 rounded-full border transition ${
                isActive
                  ? 'bg-[#D4AF37] text-[#0B0B0C] border-white font-bold'
                  : 'border-[#D4AF37]/55 text-[#D4AF37] hover:bg-[#D4AF37]/15'
              }`
            }
          >
            Owner Admin
          </NavLink>
          <a
            href="https://wa.me/919829000000?text=Hi%20Fusion%20The%20Magical%20Mirror%20By%20Mini%20Jain%20Ajmer"
            target="_blank"
            rel="noreferrer"
            className="press-bounce inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1F8A4C] text-white text-xs font-semibold shadow-md hover:bg-[#19743E]"
          >
            <CssPhone />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>

          {/* Pure CSS Mobile Hamburger Button */}
          <button
            type="button"
            aria-label="Toggle Menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((o) => !o)}
            className="lg:hidden w-9 h-9 rounded-full border border-[#D4AF37]/55 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className={`w-4 h-0.5 bg-[#D4AF37] transition-transform ${drawerOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-4 h-0.5 bg-[#D4AF37] transition-opacity ${drawerOpen ? 'opacity-0' : ''}`} />
            <span className={`w-4 h-0.5 bg-[#D4AF37] transition-transform ${drawerOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Navigation Drawer */}
      {drawerOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden border-t border-[#D4AF37]/30 bg-[#0B0B0C] px-4 py-4 grid grid-cols-2 gap-2"
        >
          {[...NAV_LINKS, { to: '/admin', label: 'Owner Admin' }].map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `px-3.5 py-2.5 rounded-xl text-xs font-bold border text-center transition ${
                  isActive
                    ? 'bg-[#9E1B2B] text-[#FAF6F0] border-[#D4AF37]'
                    : 'bg-white/5 text-[#FAF6F0]/85 border-white/10 hover:border-[#D4AF37]/50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
