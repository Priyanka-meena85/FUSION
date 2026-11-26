import React, { useEffect, useState } from 'react';
import { CssCheck, CssCrown, CssSparkle, CssStar } from './CssIcons';

const GROOM_PACKS = [
  {
    name: 'Royal Groom Package',
    price: 8000,
    tag: 'Most Popular',
    items: ['Matte HD Camera-Ready Base', 'Beard Sculpt & Steam', 'Hair Styling & Safa Setting'],
  },
  {
    name: 'Groom Pre-Wedding Glow',
    price: 3499,
    tag: 'D-3 Prep',
    items: ['Charcoal De-Tan Facial', 'Keratin Hair Spa', 'Under-Eye & Lip Hydration'],
  },
  {
    name: 'Dulha + Best Man Duo',
    price: 12999,
    tag: 'Value Duo',
    items: ['Groom HD + Hair', 'Best Man / Brother Styling', 'Touch-Up Kit Included'],
  },
];

export default function ArtistsGroomSection({ selectedArtist, onChooseArtist, onBookGroom }) {
  const [artists, setArtists] = useState([]);

  useEffect(() => {
    fetch('/api/artists')
      .then((r) => r.json())
      .then((d) => {
        if (d.artists) setArtists(d.artists);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="reveal-section py-14 sm:py-18 px-4 bg-[#FFF8F0]">
      <div className="max-w-5xl mx-auto space-y-14">
        {/* #4 Artist Profiles */}
        <div>
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#B01E2E] bg-[#FADADD] px-3.5 py-1 rounded-full">
              <CssSparkle size={11} /> Choose Your Expert
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#121212] mt-3">
              Fusion Bridal &amp; Groom Artists
            </h2>
            <p className="text-sm text-[#121212]/70 mt-1.5">
              Pick your preferred artist. System automatically blocks double-bookings &amp; artist leave dates.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {artists.map((a) => {
              const isSelected = selectedArtist === a.name;
              const initials = a.name
                .split(' ')
                .map((n) => n[0])
                .join('');
              return (
                <div
                  key={a.id}
                  className={`rounded-3xl p-5 border transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#B01E2E] text-[#FFF8F0] border-[#D4AF37] shadow-xl'
                      : 'bg-white text-[#121212] border-[#D4AF37]/35 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-lg border-2 ${
                          isSelected
                            ? 'bg-[#D4AF37] text-[#121212] border-white'
                            : 'bg-[#FADADD] text-[#B01E2E] border-[#D4AF37]'
                        }`}
                      >
                        {initials}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D4AF37]">
                        <CssStar size={12} /> {a.rating}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-bold">{a.name}</h3>
                    <p className={`text-xs font-semibold mt-0.5 ${isSelected ? 'text-[#F5E08E]' : 'text-[#B01E2E]'}`}>
                      {a.specialty}
                    </p>
                    <p className={`text-[11px] mt-1 ${isSelected ? 'text-white/75' : 'text-stone-500'}`}>
                      {a.experience}
                    </p>
                    {a.leave_dates && (
                      <p className={`text-[10px] mt-2 ${isSelected ? 'text-amber-200' : 'text-amber-700'}`}>
                        Leave: {a.leave_dates}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onChooseArtist(a.name)}
                    className={`press-bounce mt-4 w-full py-2.5 rounded-full text-xs font-bold border cursor-pointer ${
                      isSelected
                        ? 'bg-[#D4AF37] text-[#121212] border-white'
                        : 'bg-[#FFF8F0] text-[#B01E2E] border-[#D4AF37]/50 hover:bg-[#B01E2E] hover:text-white'
                    }`}
                  >
                    {isSelected ? 'Selected for Booking' : 'Choose Artist'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* #7 Dedicated Groom Packages */}
        <div className="rounded-3xl bg-gradient-to-br from-[#121212] via-[#28181D] to-[#121212] text-[#FFF8F0] p-6 sm:p-9 border border-[#D4AF37]/60 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[#F5E08E] font-bold">
                <CssCrown /> Dulha Studio · Unisex Salon
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold mt-1.5">
                Royal Groom Packages — Camera-Ready Matte Finish
              </h3>
            </div>
            <span className="text-xs text-[#FFF8F0]/70">Zero cakey look · Beard, Hair &amp; Safa Sync</span>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {GROOM_PACKS.map((gp) => (
              <div
                key={gp.name}
                className="rounded-2xl bg-white/5 border border-[#D4AF37]/35 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#B01E2E] text-[#F5E08E] font-bold">
                      {gp.tag}
                    </span>
                    <span className="font-display text-xl font-bold text-[#F5E08E]">
                      ₹{gp.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <h4 className="font-display text-lg font-bold mt-3">{gp.name}</h4>
                  <ul className="mt-3 space-y-1.5 text-xs text-[#FFF8F0]/80">
                    {gp.items.map((it) => (
                      <li key={it} className="flex items-center gap-2">
                        <span className="text-[#D4AF37]"><CssCheck /></span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onBookGroom(gp)}
                  className="btn-shimmer mt-5 w-full py-2.5 rounded-full bg-[#D4AF37] text-[#121212] text-xs font-bold cursor-pointer"
                >
                  Book Groom Slot
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
