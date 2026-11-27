import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HeroMirror from '../components/HeroMirror';
import LookFinder from '../components/LookFinder';
import AiStudioMirror from '../components/AiStudioMirror';
import ArtistsGroomSection from '../components/ArtistsGroomSection';
import BookingFlow from '../components/BookingFlow';
import ChatbotDemo from '../components/ChatbotDemo';
import BridalJourney from '../components/BridalJourney';
import ServicesCalculator from '../components/ServicesCalculator';
import GallerySection from '../components/GallerySection';
import ReviewsReferral from '../components/ReviewsReferral';
import FestivalOffers from '../components/FestivalOffers';
import LoyaltyMembership from '../components/LoyaltyMembership';
import FaqSection from '../components/FaqSection';
import { CssClock, CssSparkle } from '../components/CssIcons';

function formatTimer(ms) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function HomePage({
  preselectedLook,
  selectedArtist,
  onSelectLookForBooking,
  onChooseArtist,
  onBookGroom,
  onBookingSuccess,
}) {
  const navigate = useNavigate();
  const [expiresAt] = useState(() => Date.now() + (47 * 3600 + 12 * 60) * 1000);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBookLook = (lookData) => {
    onSelectLookForBooking(lookData);
    scrollTo('book');
  };

  return (
    <>
      {/* Screen 1: Hero Magical Mirror */}
      <HeroMirror
        onTryLook={() => scrollTo('looks')}
        onCheckDate={() => scrollTo('book')}
        onOpenAdmin={() => navigate('/admin')}
      />

      {/* Live 48-Hr Date Lock Banner */}
      <section className="px-4 -mt-6 relative z-20">
        <div className="max-w-5xl mx-auto rounded-2xl bg-[#0B0B0C] text-[#FAF6F0] border-2 border-[#D4AF37] p-4 sm:p-5 shadow-[0_16px_40px_rgba(18,18,18,0.4)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9E1B2B] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shrink-0">
              <CssClock />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold inline-flex items-center gap-1.5">
                <CssSparkle size={10} /> 48-Hr Date Lock Rule · Feb 2026 Open
              </div>
              <p className="text-xs text-[#FAF6F0]/80">
                12 Feb Locked · 14 Feb on 48-Hr Hold. Lock your wedding date in 3 clicks before timer expires.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#EAD28B]">
              {formatTimer(expiresAt - now)}
            </div>
            <button
              type="button"
              onClick={() => scrollTo('book')}
              className="btn-shimmer px-5 py-2.5 rounded-full bg-[#9E1B2B] border border-[#D4AF37] text-xs font-bold text-white cursor-pointer"
            >
              Lock Date Now
            </button>
          </div>
        </div>
      </section>

      {/* Screen 2: Look Finder — Mirror Me Try Karo */}
      <LookFinder onBookLook={handleBookLook} />

      {/* Next-Level AI & AR Mirror Studio */}
      <AiStudioMirror onApplyRecommendation={handleBookLook} />

      {/* Artist Profiles + Dedicated Royal Groom Studio */}
      <ArtistsGroomSection
        selectedArtist={selectedArtist}
        onChooseArtist={(name) => {
          onChooseArtist(name);
          scrollTo('book');
        }}
        onBookGroom={(gp) => {
          onBookGroom(gp);
          scrollTo('book');
        }}
      />

      {/* Screen 3: 3-Click Booking Flow + Feb 2026 Calendar */}
      <BookingFlow
        preselectedLook={preselectedLook}
        selectedArtist={selectedArtist}
        onBookingSuccess={onBookingSuccess}
      />

      {/* Screen 4: Interactive Multi-Language Chatbot Demo */}
      <ChatbotDemo onJumpToBook={() => scrollTo('book')} onLeadSaved={onBookingSuccess} />

      {/* Screen 5: My Bridal Journey Timeline + Personal Portal */}
      <BridalJourney onJourneyUpdate={onBookingSuccess} />

      {/* Screen 6: Services + Live Price Calculator + ₹199 Token */}
      <ServicesCalculator onTokenBooked={onBookingSuccess} />

      {/* Screen 7: Before / After Gallery Sliders + Nail Art Studio + Real Brides */}
      <GallerySection />

      {/* Screen 8: Google Reviews Wall + FUSION500 Referral */}
      <ReviewsReferral />

      {/* Screen 9: Festival Auto-Campaigns */}
      <FestivalOffers />

      {/* Loyalty Packs, Birthday Offer & Clear Policy */}
      <LoyaltyMembership />

      {/* Interactive Bridal & Salon FAQ */}
      <FaqSection />

      {/* Quick Link to Protected Owner Admin */}
      <section className="py-8 px-4 bg-[#0B0B0C] text-center border-t border-[#D4AF37]/30">
        <Link
          to="/admin"
          className="press-bounce inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#D4AF37] text-[#D4AF37] text-xs font-bold hover:bg-[#D4AF37] hover:text-[#0B0B0C] transition"
        >
          Open Protected Owner Admin Dashboard (PIN: 2026) &rarr;
        </Link>
      </section>
    </>
  );
}
