import React, { useState } from 'react';
import { CssCheck, CssCrown, CssSparkle, FusionLogoMark } from './CssIcons';

export default function ViralEducatorHub() {
  const [stamps, setStamps] = useState(3);
  const [certName, setCertName] = useState('Kajal Sharma');
  const [classBooked, setClassBooked] = useState(false);
  const [reelPlaying, setReelPlaying] = useState(false);
  const [communityJoined, setCommunityJoined] = useState(false);

  return (
    <section className="reveal-section py-14 px-4 bg-[#FADADD]/35 border-y border-[#D4AF37]/35">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#B01E2E] bg-[#FFF8F0] px-3.5 py-1 rounded-full border border-[#D4AF37]/45">
            <CssCrown /> Viral Brand, Educator &amp; Community
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#121212] mt-3">
            Masterclass, Bride Stories &amp; Digital Loyalty
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* #25 Reels Auto-Generator */}
          <div className="rounded-3xl bg-[#121212] text-[#FFF8F0] p-5 border border-[#D4AF37]/60 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                25. Transformation Reel Generator
              </span>
              <div
                className={`mt-3 h-36 rounded-2xl border border-[#D4AF37]/50 flex flex-col items-center justify-center p-3 text-center transition-all ${
                  reelPlaying
                    ? 'bg-gradient-to-br from-[#B01E2E] via-[#D4AF37]/30 to-[#121212] scale-[1.02]'
                    : 'bg-[#1D1214]'
                }`}
              >
                <FusionLogoMark size={34} />
                <div className="font-display text-sm font-bold text-[#D4AF37] mt-2">
                  {reelPlaying ? 'Playing: Before → Royal Bridal Glam' : 'Ready: 15-Sec IG Reel Template'}
                </div>
                <span className="font-script text-base text-[#FADADD]">By Mini Jain</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReelPlaying((p) => !p)}
              className="btn-shimmer mt-4 w-full py-2 rounded-full bg-[#B01E2E] border border-[#D4AF37] text-xs font-bold cursor-pointer"
            >
              {reelPlaying ? 'Pause Reel Preview' : 'Auto-Generate Reel'}
            </button>
          </div>

          {/* #26 & #27 Digital Certificate + Online Masterclass */}
          <div className="rounded-3xl bg-[#FFF8F0] p-5 border-2 border-[#D4AF37] shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#B01E2E] font-bold">
                26 &amp; 27. Educator Masterclass + Certificate
              </span>
              <h3 className="font-display text-lg font-bold text-[#121212] mt-1">
                Online Bridal Class · ₹999
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Auto Zoom link + Digital Certificate: &ldquo;Certified by Mini Jain, Fusion Salon&rdquo;.
              </p>
              <input
                type="text"
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
                placeholder="Student Name on Certificate"
                className="mt-2.5 w-full px-3 py-1.5 rounded-xl bg-white border border-[#D4AF37]/50 text-xs"
              />
              <div className="mt-2 rounded-xl bg-[#121212] text-[#D4AF37] p-2.5 text-center border border-[#D4AF37]/50">
                <div className="text-[9px] uppercase tracking-widest">Official Certificate</div>
                <div className="font-display text-sm font-bold">{certName || 'Student'}</div>
                <div className="font-script text-sm text-[#FADADD]">Certified by Mini Jain</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setClassBooked(true)}
              className="btn-shimmer mt-3 w-full py-2 rounded-full bg-[#B01E2E] text-[#FFF8F0] text-xs font-bold cursor-pointer"
            >
              {classBooked ? 'Seat Booked! Zoom Link Sent' : 'Book Online Class (₹999)'}
            </button>
          </div>

          {/* #29 Leaderboard + #30 Digital Stamp Loyalty Card */}
          <div className="rounded-3xl bg-[#FFF8F0] p-5 border-2 border-[#D4AF37] shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#B01E2E] font-bold">
                29 &amp; 30. Leaderboard + Loyalty Card
              </span>
              <div className="mt-2 text-xs space-y-1 bg-[#FADADD]/45 p-2.5 rounded-xl">
                <div className="font-bold text-[#B01E2E]">Top Referrers This Month:</div>
                <div className="flex justify-between"><span>1. Neha Agarwal</span><strong>5 Friends</strong></div>
                <div className="flex justify-between"><span>2. Ananya Rathore</span><strong>3 Friends</strong></div>
              </div>

              <div className="mt-3">
                <div className="text-[11px] font-bold text-[#121212] mb-1.5">
                  Digital Salon Card ({stamps}/5 Stamps = Free Hair Spa)
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                        n <= stamps
                          ? 'bg-[#B01E2E] border-[#D4AF37] text-[#D4AF37]'
                          : 'border-stone-300 text-stone-400'
                      }`}
                    >
                      {n <= stamps ? <CssCheck /> : n}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStamps((s) => (s >= 5 ? 1 : s + 1))}
              className="press-bounce mt-3 w-full py-2 rounded-full bg-[#121212] text-[#D4AF37] text-xs font-bold cursor-pointer"
            >
              {stamps === 5 ? 'Free Hair Spa Unlocked! (Reset)' : 'Add Visit Stamp (+1)'}
            </button>
          </div>
        </div>

        {/* #28 Bride Story + #31 WhatsApp Community + #32 Sync Badge */}
        <div className="rounded-3xl bg-[#121212] text-[#FFF8F0] p-5 sm:p-6 border border-[#D4AF37]/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
              <CssSparkle size={10} /> 28, 31 &amp; 32. Bride Stories · Brides Community · All-Channel Sync
            </div>
            <h4 className="font-display text-lg font-bold">
              Featured Story: Priya — Jaipur Bride, Red Lehenga Look
            </h4>
            <p className="text-xs text-white/70">
              Google Map + JustDial + @fusionsaloon16 Instagram prices synced · 500+ Brides in WhatsApp Community.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCommunityJoined(true)}
            className="btn-shimmer shrink-0 px-5 py-2.5 rounded-full bg-[#B01E2E] border border-[#D4AF37] text-xs font-bold cursor-pointer"
          >
            {communityJoined ? 'Joined Fusion Brides Community!' : 'Join WhatsApp Brides Community'}
          </button>
        </div>
      </div>
    </section>
  );
}
