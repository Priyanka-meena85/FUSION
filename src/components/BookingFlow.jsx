import React, { useEffect, useState } from 'react';
import { PACKAGES } from '../data/salonData';
import { CssCalendar, CssCheck, CssClock, CssLock, CssSparkle } from './CssIcons';

const CITY_TRAVEL = [
  { city: 'Ajmer', charge: 0 },
  { city: 'Kishangarh', charge: 1500 },
  { city: 'Pushkar', charge: 1500 },
  { city: 'Jaipur', charge: 3500 },
  { city: 'Udaipur', charge: 5000 },
];

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function BookingFlow({ preselectedLook, selectedArtist, onBookingSuccess }) {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('2026-02-18');
  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[0]);
  const [brideName, setBrideName] = useState('Priya Sharma');
  const [cityObj, setCityObj] = useState(CITY_TRAVEL[3]); // Jaipur default
  const [phone, setPhone] = useState('+91 98290 44120');
  const [step, setStep] = useState(1);
  const [holdExpiresAt, setHoldExpiresAt] = useState(() => Date.now() + (47 * 3600 + 12 * 60) * 1000);
  const [now, setNow] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [waitlistTargetDate, setWaitlistTargetDate] = useState(null);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [upsellAdded, setUpsellAdded] = useState([]);

  const activeArtist = selectedArtist || preselectedLook?.artist?.split(' (')[0] || 'Riya Sen';

  const fetchCalendar = async () => {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      if (data.dates) setDates(data.dates);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  useEffect(() => {
    if (preselectedLook) {
      const matched = PACKAGES.find((p) => p.name === preselectedLook.packageName) || PACKAGES[0];
      setSelectedPkg(matched);
      setStep(2);
    }
  }, [preselectedLook]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remainingMs = Math.max(0, holdExpiresAt - now);
  const isLastHour = remainingMs > 0 && remainingMs <= 3600 * 1000;
  const grandTotal = selectedPkg.price + cityObj.charge;

  const handleDateClick = (d) => {
    if (d.status === 'locked') {
      setWaitlistTargetDate(d);
      setWaitlistJoined(false);
      return;
    }
    setWaitlistTargetDate(null);
    setSelectedDate(d.date_str);
    setErrorMsg('');
    if (d.status === 'hold' && d.hold_expires_at) {
      setHoldExpiresAt(d.hold_expires_at);
    }
    setStep(2);
  };

  const handleJoinWaitlist = async () => {
    if (!waitlistTargetDate) return;
    await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date_str: waitlistTargetDate.date_str,
        bride_name: brideName,
        phone,
        package_name: selectedPkg.name,
      }),
    });
    setWaitlistJoined(true);
    if (onBookingSuccess) onBookingSuccess();
  };

  const handlePayAdvance = async (mode = 'pay') => {
    setIsSubmitting(true);
    setErrorMsg('');
    setUpsellAdded([]);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: brideName,
          phone,
          city: cityObj.city,
          event_date: selectedDate,
          package_name: selectedPkg.name,
          makeup_type: selectedPkg.name.includes('Airbrush') ? 'Airbrush' : 'HD',
          lehenga_colour: preselectedLook?.lehenga || 'Red',
          jewellery: preselectedLook?.jewellery || 'Kundan',
          artist_name: activeArtist,
          travel_charge: cityObj.charge,
          total_price: grandTotal,
          advance_amount: selectedPkg.advance,
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not complete booking');
      } else {
        setConfirmation({ ...data.booking, receiptCode: data.receiptCode, mode });
        await fetchCalendar();
        if (onBookingSuccess) onBookingSuccess();
      }
    } catch {
      setErrorMsg('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUpsell = async (name, price) => {
    if (!confirmation || upsellAdded.includes(name)) return;
    const res = await fetch(`/api/bookings/${confirmation.id}/upsell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_name: name, item_price: price }),
    });
    const data = await res.json();
    if (res.ok) {
      setConfirmation((prev) => ({ ...prev, ...data.booking }));
      setUpsellAdded((prev) => [...prev, name]);
      if (onBookingSuccess) onBookingSuccess();
    }
  };

  const formattedDateLabel = selectedDate ? `${Number(selectedDate.slice(-2))} Feb` : '18 Feb';

  return (
    <section id="book" className="reveal-section py-14 sm:py-18 px-4 bg-[#FADADD]/45 border-y border-[#D4AF37]/40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#B01E2E] bg-[#FFF8F0] px-3.5 py-1 rounded-full border border-[#D4AF37]/55">
            <CssCalendar /> Sirf 3 Click Me Date Lock
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#121212] mt-3">
            3-Click Bridal Booking &amp; 48-Hr Lock
          </h2>
          <p className="text-sm text-[#121212]/70 mt-1.5">
            Green = Available · Red Lock = Booked (Tap to Join Waitlist) · Gold = 48-Hr Hold
          </p>
        </div>

        {/* Live 48-Hr Countdown Banner: Bridal Red with Gold Glow */}
        <div
          className={`mb-7 rounded-2xl p-4 border-2 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors shadow-[0_0_28px_rgba(212,175,55,0.35)] ${
            isLastHour
              ? 'bg-[#7D111E] text-white border-[#D4AF37] animate-pulse'
              : 'bg-[#B01E2E] text-[#FFF8F0] border-[#D4AF37]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#121212] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37]">
              <CssClock />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-[#F5E08E] font-bold">48-Hour Auto-Release Rule</div>
              <p className="text-xs text-[#FFF8F0]/90">
                Payment nahi aaya to date auto-free + waitlist wali next bride ko auto-alert.
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className="font-mono text-2xl sm:text-3xl font-bold tracking-wider text-[#F5E08E]">
              {formatCountdown(remainingMs)}
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#FFF8F0]/80">
              Artist: {activeArtist}
            </span>
          </div>
        </div>

        {/* 3-Step Indicator */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { num: 1, label: '1. Feb 2026 Date' },
            { num: 2, label: '2. Package + Travel' },
            { num: 3, label: '3. Pay & Lock' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num)}
              className={`press-bounce py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                step === s.num
                  ? 'bg-[#B01E2E] text-[#FFF8F0] border-[#D4AF37] shadow-md'
                  : 'bg-white text-[#121212]/75 border-[#D4AF37]/30'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* CLICK 1: Feb 2026 Calendar + Waitlist */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-[#D4AF37]/35 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-[#B01E2E]">February 2026</h3>
              <span className="text-[11px] font-semibold text-[#121212]/65">Tap locked date for Waitlist</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-[#121212]/50 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {dates.map((d) => {
                const isSelected = selectedDate === d.date_str;
                const isLocked = d.status === 'locked';
                const isHold = d.status === 'hold';
                return (
                  <button
                    key={d.date_str}
                    type="button"
                    onClick={() => handleDateClick(d)}
                    title={
                      isLocked
                        ? `Booked: ${d.bride_name} (Tap to join Waitlist)`
                        : isHold
                        ? `48-Hr Hold: ${d.bride_name}`
                        : 'Available'
                    }
                    className={`press-bounce relative h-10 rounded-xl text-xs font-bold flex flex-col items-center justify-center border transition cursor-pointer ${
                      isLocked
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : isHold
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-[#D4AF37]'
                    } ${isSelected ? 'ring-2 ring-[#D4AF37] gold-ring-pulse -translate-y-0.5 shadow-md' : ''}`}
                  >
                    <span>{d.day_num}</span>
                    {isLocked && <CssLock className="scale-[0.6] -mt-0.5 text-red-600" />}
                  </button>
                );
              })}
            </div>

            {waitlistTargetDate && (
              <div className="mt-4 rounded-2xl bg-[#FFF8F0] border border-[#D4AF37] p-3 text-xs space-y-2">
                <div className="font-bold text-[#B01E2E]">
                  {waitlistTargetDate.day_num} Feb is currently Locked ({waitlistTargetDate.bride_name})
                </div>
                <p className="text-[11px] text-stone-600">
                  Join Waitlist: if any hold releases, WhatsApp alerts you first!
                </p>
                <button
                  type="button"
                  onClick={handleJoinWaitlist}
                  disabled={waitlistJoined}
                  className="press-bounce w-full py-2 rounded-full bg-[#B01E2E] text-white font-bold text-[11px] cursor-pointer disabled:bg-emerald-700"
                >
                  {waitlistJoined ? 'Added to Waitlist!' : `Join Waitlist for ${waitlistTargetDate.day_num} Feb`}
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-stone-100 text-[11px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Booked Lock
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 48-Hr Hold
              </span>
            </div>
          </div>

          {/* CLICK 2: Package Select */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-[#D4AF37]/35 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-[#B01E2E] mb-3">Select Package</h3>
              <div className="space-y-2">
                {PACKAGES.map((pkg) => {
                  const active = selectedPkg.id === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        setSelectedPkg(pkg);
                        setStep(3);
                      }}
                      className={`press-bounce w-full text-left p-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        active
                          ? 'border-[#D4AF37] bg-[#FFF8F0] shadow-[0_8px_20px_rgba(201,162,39,0.2)] -translate-y-0.5'
                          : 'border-stone-200 hover:border-[#D4AF37]/60'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-[#121212]">{pkg.name}</div>
                        <div className="text-[10px] text-[#121212]/60">
                          {pkg.duration} · {pkg.tag}
                        </div>
                      </div>
                      <div className="font-display text-sm font-bold text-[#B01E2E]">
                        ₹{pkg.price.toLocaleString('en-IN')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* #13 Outstation Travel Charge Clear */}
            <div className="mt-4 pt-3 border-t border-stone-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#B01E2E] mb-1.5">
                Venue City (Outstation Travel Clear)
              </label>
              <select
                value={cityObj.city}
                onChange={(e) => setCityObj(CITY_TRAVEL.find((c) => c.city === e.target.value) || CITY_TRAVEL[0])}
                className="w-full px-3 py-2 rounded-xl border border-[#D4AF37]/45 bg-[#FFF8F0] text-xs font-semibold"
              >
                {CITY_TRAVEL.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city} ({c.charge === 0 ? 'No Travel Charge' : `+₹${c.charge.toLocaleString('en-IN')} Travel`})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CLICK 3: Payment & Instant Lock */}
          <div className="lg:col-span-3 bg-gradient-to-b from-[#B01E2E] to-[#4A081C] text-[#FFF8F0] rounded-3xl p-5 border border-[#D4AF37] shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-widest text-[#F5E08E]">Click 3 · Instant Lock</div>
              <h3 className="font-display text-xl font-bold">
                {formattedDateLabel} · {selectedPkg.name}
              </h3>

              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="Bride / Client Name"
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-[#D4AF37]/40 text-white placeholder:text-white/50 focus:outline-none focus:border-[#F5E08E]"
                />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="WhatsApp Phone"
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-[#D4AF37]/40 text-white placeholder:text-white/50 focus:outline-none focus:border-[#F5E08E]"
                />
              </div>

              <div className="rounded-2xl bg-[#121212]/45 p-3 border border-[#D4AF37]/35 space-y-1 text-xs">
                <div className="flex justify-between text-[#FFF8F0]/75">
                  <span>Package</span>
                  <span>₹{selectedPkg.price.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#FFF8F0]/75">
                  <span>Travel ({cityObj.city})</span>
                  <span>₹{cityObj.charge.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#FFF8F0]/90 font-semibold">
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-white/10">
                  <span className="font-semibold text-[#F5E08E]">Advance Now</span>
                  <span className="font-display text-xl font-bold text-[#F5E08E]">
                    ₹{selectedPkg.advance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {errorMsg && <p className="text-xs text-red-300 bg-red-950/60 p-2 rounded-lg">{errorMsg}</p>}
            </div>

            <div className="space-y-2 mt-4">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handlePayAdvance('pay')}
                className="btn-shimmer w-full py-3 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F5E08E] to-[#D4AF37] text-[#121212] font-bold text-xs tracking-wide cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Locking Date...' : `Pay Advance ₹${selectedPkg.advance.toLocaleString('en-IN')}`}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handlePayAdvance('hold')}
                className="press-bounce w-full py-2 rounded-full border border-[#D4AF37]/50 text-[#F5E08E] text-[11px] font-semibold hover:bg-white/10 cursor-pointer"
              >
                Start 48-Hr Hold
              </button>
            </div>
          </div>
        </div>

        {/* Confirmation + Receipt PDF + #38 Upsell Bot Modal */}
        {confirmation && (
          <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative bg-[#FFF8F0] border-2 border-[#D4AF37] rounded-3xl max-w-md w-full p-6 text-center shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-center gap-3 mb-2 text-[#D4AF37]">
                <CssSparkle size={18} />
                <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                  <CssCheck />
                </div>
                <CssSparkle size={18} />
              </div>

              <p className="text-[11px] uppercase tracking-[0.2em] text-[#B01E2E] font-bold">
                {confirmation.mode === 'hold' ? '48-Hr Hold Activated' : 'Booking Confirmed · WhatsApp Receipt Sent'}
              </p>
              <h4 className="font-display text-xl font-bold text-[#121212] mt-1">
                {Number(confirmation.event_date.slice(-2))} Feb · {confirmation.package_name}, {confirmation.city}
              </h4>

              <div className="mt-3 bg-white rounded-2xl p-4 border border-[#D4AF37]/35 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Receipt ID</span>
                  <span className="font-mono font-bold text-[#B01E2E]">{confirmation.receiptCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Artist Assigned</span>
                  <span className="font-semibold">{confirmation.artist_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Total (incl. Travel)</span>
                  <span className="font-bold">₹{Number(confirmation.total_price).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Status</span>
                  <span className="font-bold text-emerald-700 inline-flex items-center gap-1">
                    <CssLock className="scale-75" /> {confirmation.mode === 'hold' ? '48-Hr Hold' : 'Date Locked'}
                  </span>
                </div>
              </div>

              {/* #38 Upsell Bot */}
              <div className="mt-4 rounded-2xl bg-[#FADADD] border border-[#D4AF37]/50 p-3.5 text-left">
                <div className="text-[10px] uppercase tracking-wider font-bold text-[#B01E2E] mb-2">
                  Fusion Upsell Assistant · Add Before D-Day?
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Pre-Bridal Hydra Facial', price: 1499 },
                    { name: 'Saree / Dupatta Draping Artist', price: 1200 },
                  ].map((up) => {
                    const added = upsellAdded.includes(up.name);
                    return (
                      <div key={up.name} className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-xl">
                        <span>
                          {up.name} <strong className="text-[#B01E2E]">+₹{up.price}</strong>
                        </span>
                        <button
                          type="button"
                          disabled={added}
                          onClick={() => handleAddUpsell(up.name, up.price)}
                          className="px-2.5 py-1 rounded-full bg-[#B01E2E] text-white text-[10px] font-bold cursor-pointer disabled:bg-emerald-700"
                        >
                          {added ? 'Added' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="press-bounce flex-1 py-2.5 rounded-full border border-[#B01E2E] text-[#B01E2E] font-bold text-xs cursor-pointer"
                >
                  Download Receipt PDF
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmation(null)}
                  className="btn-shimmer flex-1 py-2.5 rounded-full bg-[#B01E2E] text-[#FFF8F0] font-bold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
