import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { SERVICES_DATA } from '../data/salonData';
import { CssCheck, CssSparkle } from './CssIcons';

const TABS = ['Hair', 'Skin', 'Makeup', 'Groom'];

export default function ServicesCalculator({ onTokenBooked }) {
  const [activeTab, setActiveTab] = useState('Hair');
  const [selectedIds, setSelectedIds] = useState(['haircut', 'facial']);
  const [displayTotal, setDisplayTotal] = useState(1998);
  const [tokenReceipt, setTokenReceipt] = useState(null);
  const prevTotalRef = useRef(1998);

  const allServices = Object.values(SERVICES_DATA).flat();
  const total = allServices
    .filter((s) => selectedIds.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  useEffect(() => {
    const obj = { val: prevTotalRef.current };
    gsap.to(obj, {
      val: total,
      duration: 0.45,
      ease: 'power2.out',
      onUpdate: () => setDisplayTotal(Math.round(obj.val)),
    });
    prevTotalRef.current = total;
  }, [total]);

  const toggleService = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleLockToken = async () => {
    if (selectedIds.length === 0) return;
    try {
      const names = allServices
        .filter((s) => selectedIds.includes(s.id))
        .map((s) => s.name)
        .join(', ');
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Salon Walk-in Client',
          phone: '+91 98290 11223',
          city: 'Ajmer',
          event_date: '2026-02-20',
          package_name: `Daily Salon (${selectedIds.length} Services)`,
          makeup_type: names,
          total_price: total,
          advance_amount: 199,
          mode: 'token',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTokenReceipt(data.receiptCode);
        if (onTokenBooked) onTokenBooked();
      }
    } catch {
      setTokenReceipt('TOK-199-AJM');
    }
  };

  return (
    <section id="services" className="reveal-section py-14 sm:py-18 px-4 bg-[#FAF6F0]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#9E1B2B] bg-[#F3ECE1] px-3.5 py-1 rounded-full">
            <CssSparkle size={11} /> Transparent Ajmer Rate Card
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#0B0B0C] mt-3">
            Services + Live Price Calculator
          </h2>
          <p className="text-sm text-[#0B0B0C]/70 mt-1.5">
            Select your services to see instant pricing. Lock your salon slot with just ₹199 token.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`press-bounce px-5 py-2.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#9E1B2B] text-[#FAF6F0] border-[#D4AF37] shadow-md'
                  : 'bg-white text-[#0B0B0C]/75 border-[#D4AF37]/35 hover:border-[#9E1B2B]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-12 gap-6 items-start">
          {/* Checkboxes List */}
          <div className="md:col-span-7 space-y-3">
            {SERVICES_DATA[activeTab].map((service) => {
              const checked = selectedIds.includes(service.id);
              return (
                <div
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`press-bounce cursor-pointer rounded-2xl p-4 border transition flex items-center justify-between ${
                    checked
                      ? 'bg-white border-[#D4AF37] shadow-[0_10px_25px_rgba(201,162,39,0.18)] -translate-y-0.5'
                      : 'bg-white/75 border-stone-200 hover:border-[#D4AF37]/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition ${
                        checked
                          ? 'bg-[#9E1B2B] border-[#D4AF37] text-[#FAF6F0]'
                          : 'border-stone-300'
                      }`}
                    >
                      {checked && <CssCheck />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#0B0B0C]">{service.name}</div>
                      <div className="text-[11px] text-stone-500">Duration: {service.duration}</div>
                    </div>
                  </div>
                  <div className="font-display text-lg font-bold text-[#9E1B2B]">
                    ₹{service.price.toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Total Card */}
          <div className="md:col-span-5 bg-gradient-to-br from-[#0B0B0C] to-[#2F101A] text-[#FAF6F0] rounded-3xl p-6 border border-[#D4AF37]/60 shadow-xl">
            <div className="text-[11px] uppercase tracking-widest text-[#EAD28B]">
              Selected Services ({selectedIds.length})
            </div>
            <div className="mt-3 max-h-36 overflow-y-auto space-y-1.5 text-xs text-[#FAF6F0]/80">
              {selectedIds.length === 0 ? (
                <p className="text-white/50">Tap any service on the left to calculate.</p>
              ) : (
                allServices
                  .filter((s) => selectedIds.includes(s.id))
                  .map((s) => (
                    <div key={s.id} className="flex justify-between">
                      <span>{s.name}</span>
                      <span className="text-[#EAD28B]">₹{s.price}</span>
                    </div>
                  ))
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-[#D4AF37]/30 flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider text-[#FAF6F0]/75">Estimated Total</span>
              <span className="font-display text-3xl font-bold text-[#EAD28B]">
                ₹{displayTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleLockToken}
              className="btn-shimmer mt-5 w-full py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#EAD28B] to-[#D4AF37] text-[#0B0B0C] font-bold text-xs tracking-wide cursor-pointer disabled:opacity-50"
            >
              {tokenReceipt ? 'Slot Locked!' : 'Lock Slot With ₹199 Token'}
            </button>

            {tokenReceipt && (
              <div className="mt-3 rounded-xl bg-emerald-950/80 border border-emerald-400/50 p-3 text-xs text-emerald-200 flex items-center justify-between">
                <span>Slot Locked! Token Receipt:</span>
                <span className="font-mono font-bold text-white">{tokenReceipt}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
