import React, { useState } from 'react';
import { CssCheck, CssPin, CssSparkle } from './CssIcons';

const NAIL_DESIGNS = [
  { id: 'french-gold', name: 'Sheer Pink + White French + Gold Swirl', price: 1499, tip: '#FFF8F0', base: '#FADADD' },
  { id: 'bridal-chrome', name: 'Bridal Red Chrome + Kundan Stone', price: 1999, tip: '#D4AF37', base: '#B01E2E' },
  { id: 'pastel-ombre', name: 'Soft Nail Pink Ombre + Glitter', price: 1299, tip: '#FADADD', base: '#F5E08E' },
  { id: 'black-gold', name: 'Glossy Black + 24K Gold Foil', price: 1799, tip: '#D4AF37', base: '#121212' },
];

export default function BrideSuiteExtra({ onBookNail }) {
  const [groupMembers, setGroupMembers] = useState([
    { role: 'Bride (HD Bridal)', price: 25000 },
    { role: 'Mummy (Party Glam)', price: 5000 },
  ]);
  const [buddyName, setBuddyName] = useState('');
  const [buddyCode, setBuddyCode] = useState('');
  const [selectedNail, setSelectedNail] = useState(NAIL_DESIGNS[0]);
  const [reordered, setReordered] = useState([]);

  const addFamilyMember = (role, price) => {
    setGroupMembers((prev) => [...prev, { role, price }]);
  };

  const groupTotal = groupMembers.reduce((s, m) => s + m.price, 0);

  return (
    <section className="reveal-section py-14 px-4 bg-[#FFF8F0]">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Top Row: #8 Shaadi Countdown + #11 Venue Tracking + #7 Trial Buddy */}
        <div className="grid md:grid-cols-3 gap-5">
          {/* #8 Shaadi Countdown Widget */}
          <div className="rounded-3xl bg-[#B01E2E] text-[#FFF8F0] p-5 border-2 border-[#D4AF37] shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#F5E08E] font-bold">
                Wedding Countdown
              </span>
              <div className="font-display text-3xl font-bold mt-2">23 Days Left</div>
              <p className="text-xs text-[#FADADD] mt-1">Priya&apos;s Wedding · 12 Feb 2026</p>
            </div>
            <div className="mt-4 rounded-xl bg-[#121212]/45 p-3 text-[11px] border border-[#D4AF37]/40">
              <strong>Today&apos;s Tip:</strong> Drink 3L water + apply SPF 50 indoors.
            </div>
          </div>

          {/* #11 Live Venue Artist Tracking */}
          <div className="rounded-3xl bg-[#FFF8F0] p-5 border-2 border-[#D4AF37] shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#B01E2E] font-bold">
                D-Day Artist Arrival
              </span>
              <h3 className="font-display text-lg font-bold mt-1 text-[#121212]">
                Riya Sen Is On Her Way
              </h3>
              <p className="text-xs text-stone-600">ETA: Arriving at Hotel in 20 Mins</p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="w-full h-2.5 rounded-full bg-[#FADADD] overflow-hidden">
                <div className="w-3/4 h-full bg-[#B01E2E] rounded-full animate-pulse" />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-[#B01E2E]">
                <span>Fusion Studio</span>
                <span className="inline-flex items-center gap-1"><CssPin /> Hotel Venue</span>
              </div>
            </div>
          </div>

          {/* #7 Dulhan Ki Best Friend Invite */}
          <div className="rounded-3xl bg-[#FADADD]/55 p-5 border-2 border-[#D4AF37] shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#B01E2E] font-bold">
                Trial Buddy Pass (10% Off)
              </span>
              <h3 className="font-display text-lg font-bold mt-1 text-[#121212]">
                Bring Your Best Friend Along
              </h3>
              <input
                type="text"
                value={buddyName}
                onChange={(e) => setBuddyName(e.target.value)}
                placeholder="Friend's Name (e.g. Ritu)"
                className="mt-2 w-full px-3 py-2 rounded-xl bg-white border border-[#D4AF37]/50 text-xs"
              />
            </div>
            <button
              type="button"
              onClick={() => setBuddyCode(`BUDDY10-${(buddyName || 'RITU').toUpperCase().slice(0, 4)}`)}
              className="btn-shimmer mt-3 w-full py-2 rounded-full bg-[#B01E2E] text-[#FFF8F0] text-xs font-bold cursor-pointer"
            >
              {buddyCode ? `Invite Ready: ${buddyCode}` : 'Generate 10% Off Trial Pass'}
            </button>
          </div>
        </div>

        {/* #6 Bride + Family Group Booking & #10/#12 Emergency Kit + Post-Shaadi */}
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-7 rounded-3xl bg-white p-6 border-2 border-[#D4AF37]/60 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#B01E2E]">
                  Bride &amp; Family Suite
                </span>
                <h3 className="font-display text-xl font-bold text-[#121212]">
                  Mom, Sister &amp; Family — Book Together
                </h3>
              </div>
              <div className="font-display text-xl font-bold text-[#B01E2E]">
                ₹{groupTotal.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              {groupMembers.map((m, i) => (
                <div key={i} className="flex justify-between text-xs bg-[#FFF8F0] px-3 py-2 rounded-xl border border-[#D4AF37]/30">
                  <span>{m.role}</span>
                  <span className="font-bold text-[#B01E2E]">₹{m.price.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addFamilyMember('Sister (Party Makeup)', 5000)}
                className="press-bounce px-3 py-1.5 rounded-full bg-[#FADADD] text-[#B01E2E] text-xs font-bold cursor-pointer"
              >
                + Add Sister (₹5,000)
              </button>
              <button
                type="button"
                onClick={() => addFamilyMember('Saas (Saree + Glam)', 4500)}
                className="press-bounce px-3 py-1.5 rounded-full bg-[#FADADD] text-[#B01E2E] text-xs font-bold cursor-pointer"
              >
                + Add Saas (₹4,500)
              </button>
            </div>
          </div>

          {/* #10 Emergency Bride Kit + #12 Post-Shaadi Glow Plan */}
          <div className="md:col-span-5 rounded-3xl bg-[#121212] text-[#FFF8F0] p-6 border border-[#D4AF37]/60 space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                D-Day Touch-Up Guide
              </span>
              <p className="text-xs text-white/80 mt-1">
                • Lipstick fade? Blot tissue + tap touch-up tint.<br />
                • Kajal smudge? Use cotton bud + micellar water dot.
              </p>
            </div>
            <div className="pt-3 border-t border-white/15">
              <span className="text-[10px] uppercase tracking-widest text-[#FADADD] font-bold">
                Post-Wedding Skin Recovery
              </span>
              <p className="text-xs text-white/80 mt-1">
                Book your D+10 Calming Hydra Recovery Facial to detox heavy bridal makeup &amp; restore natural glow.
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 3: #13 Nail Design Library + #14 Nail Try-On + #15/#16 Hair Spa & Product Reorder */}
        <div className="rounded-3xl bg-[#121212] text-[#FFF8F0] p-6 sm:p-8 border-2 border-[#D4AF37]/60">
          <div className="grid lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                <CssSparkle size={10} /> Signature Nail Art Studio
              </span>
              <h3 className="font-display text-2xl font-bold">
                Select Nail Art &amp; Try On Your Hand
              </h3>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {NAIL_DESIGNS.map((nd) => (
                  <button
                    key={nd.id}
                    type="button"
                    onClick={() => setSelectedNail(nd)}
                    className={`press-bounce text-left p-3 rounded-2xl border cursor-pointer ${
                      selectedNail.id === nd.id ? 'border-[#D4AF37] bg-[#B01E2E]/35' : 'border-white/15 bg-white/5'
                    }`}
                  >
                    <div className="text-xs font-bold">{nd.name}</div>
                    <div className="text-xs text-[#D4AF37] font-bold mt-1">₹{nd.price}</div>
                  </button>
                ))}
              </div>
              {onBookNail && (
                <button
                  type="button"
                  onClick={() => onBookNail(selectedNail)}
                  className="btn-shimmer px-6 py-2.5 rounded-full bg-[#B01E2E] border border-[#D4AF37] text-xs font-bold cursor-pointer"
                >
                  Book This Nail Design (₹{selectedNail.price})
                </button>
              )}
            </div>

            {/* Hand Try-On Visual + #15/#16 Hair Health & Reorder */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl bg-black/50 border border-[#D4AF37]/40 p-4 flex items-center justify-center gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="w-9 h-18 rounded-t-full rounded-b-lg border border-[#D4AF37] overflow-hidden"
                    style={{ backgroundColor: selectedNail.base }}
                  >
                    <div className="h-3.5 w-full rounded-b-[50%]" style={{ backgroundColor: selectedNail.tip }} />
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/15 p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#D4AF37] font-bold">Hair Health Score</span>
                  <span className="font-bold text-emerald-400">70% Healthy (Spa Due in 15 Days)</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span>Moroccan Serum (₹850)</span>
                  <button
                    type="button"
                    onClick={() => setReordered((p) => [...p, 'serum'])}
                    className="px-3 py-1 rounded-full bg-[#D4AF37] text-[#121212] font-bold text-[10px] cursor-pointer"
                  >
                    {reordered.includes('serum') ? <span className="inline-flex items-center gap-1"><CssCheck /> Ordered</span> : 'Re-Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
