import React, { useEffect, useState } from 'react';
import { CssCheck, CssPhone, CssSparkle, CssStar } from './CssIcons';

export default function BridalJourney({ onJourneyUpdate }) {
  const [steps, setSteps] = useState([]);
  const [latestBooking, setLatestBooking] = useState(null);
  const [prepForm, setPrepForm] = useState({
    lehenga_colour: 'Deep Red Velvet',
    blouse_note: 'Gold Zardosi Sweetheart Neck',
    jewellery: 'Kundan + Polki Matha Patti',
    lens_needed: 'Hazel Soft Lens',
    extension_needed: 'Yes — 24 inch Volume',
  });
  const [prepSaved, setPrepSaved] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('2026-02-26');
  const [rescheduleMsg, setRescheduleMsg] = useState('');
  const [celebrateDDay, setCelebrateDDay] = useState(false);

  const loadJourney = () => {
    fetch('/api/journey')
      .then((r) => r.json())
      .then((data) => {
        if (data.steps) setSteps(data.steps);
        if (data.prepForm) setPrepForm(data.prepForm);
        if (data.latestBooking) setLatestBooking(data.latestBooking);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadJourney();
  }, []);

  const completedCount = steps.filter((s) => s.completed).length;
  const percent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const toggleStep = async (step) => {
    const nextVal = step.completed ? 0 : 1;
    setSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, completed: nextVal } : s)));
    if (step.day_label === 'D-Day' && nextVal === 1) {
      setCelebrateDDay(true);
      setTimeout(() => setCelebrateDDay(false), 2200);
    }
    try {
      await fetch(`/api/journey/${step.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: Boolean(nextVal) }),
      });
    } catch {
      // ignore
    }
  };

  const handleSavePrep = async (e) => {
    e.preventDefault();
    await fetch('/api/prep-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prepForm),
    });
    setPrepSaved(true);
    setTimeout(() => setPrepSaved(false), 2500);
  };

  const handleReschedule = async () => {
    if (!latestBooking) return;
    const res = await fetch(`/api/bookings/${latestBooking.id}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_date: rescheduleDate }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRescheduleMsg(data.error || 'Could not reschedule');
    } else {
      setRescheduleMsg(`Rescheduled to ${rescheduleDate} (Free 1-time change used)`);
      setLatestBooking(data.booking);
      if (onJourneyUpdate) onJourneyUpdate();
    }
  };

  return (
    <section id="journey" className="reveal-section py-14 sm:py-18 px-4 bg-gradient-to-b from-[#4A081C] to-[#2A0510] text-[#FFF8F0]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#F5E08E] bg-white/10 px-3.5 py-1 rounded-full border border-[#D4AF37]/40">
            <CssSparkle size={11} /> Bride Personal Dashboard &amp; Prep
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold mt-3">
            My Bridal Journey &amp; Personal Portal
          </h2>
          <p className="text-sm text-[#FFF8F0]/75 mt-1.5">
            Track your D-30 to D+1 reminders, submit your Outfit &amp; Jewellery form, or reschedule 1-time without calling.
          </p>
        </div>

        {/* #18 Bride Personal Dashboard + #12 Reschedule */}
        {latestBooking && (
          <div className="mb-8 rounded-3xl bg-[#121212]/70 border border-[#D4AF37]/50 p-5 grid md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-7 space-y-1.5">
              <div className="text-[11px] uppercase tracking-widest text-[#F5E08E] font-bold">
                Active Booking · Receipt {latestBooking.receipt_code}
              </div>
              <h3 className="font-display text-xl font-bold">
                {latestBooking.customer_name} — {latestBooking.event_date} ({latestBooking.package_name})
              </h3>
              <p className="text-xs text-[#FFF8F0]/80 flex flex-wrap items-center gap-3">
                <span>Artist: <strong>{latestBooking.artist_name}</strong></span>
                <span className="inline-flex items-center gap-1 text-[#F5E08E]">
                  <CssPhone /> +91 98290 44100
                </span>
                <span>Advance Paid: ₹{Number(latestBooking.advance_amount).toLocaleString('en-IN')}</span>
              </p>
            </div>

            <div className="md:col-span-5 bg-white/5 rounded-2xl p-3.5 border border-white/10 space-y-2">
              <label className="block text-[10px] uppercase tracking-wider text-[#F5E08E] font-bold">
                1-Time Free Reschedule (No Call Needed)
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={rescheduleDate}
                  min="2026-02-01"
                  max="2026-02-28"
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-xl bg-black/40 border border-[#D4AF37]/40 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleReschedule}
                  className="press-bounce px-3.5 py-1.5 rounded-xl bg-[#D4AF37] text-[#121212] text-xs font-bold cursor-pointer"
                >
                  Change Date
                </button>
              </div>
              {rescheduleMsg && <p className="text-[11px] text-emerald-300">{rescheduleMsg}</p>}
            </div>
          </div>
        )}

        {/* Gamified Progress Bar */}
        <div className="bg-[#121212]/60 border border-[#D4AF37]/45 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-[#F5E08E] uppercase tracking-wider">Bridal Readiness</span>
            <span>{percent}% Complete</span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F5E08E] to-[#D4AF37] transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {celebrateDDay && (
          <div className="mb-6 rounded-2xl bg-[#D4AF37] text-[#121212] p-4 text-center font-display font-bold text-lg shadow-xl flex items-center justify-center gap-3">
            <CssSparkle size={18} />
            <span>Bride Ready! Wishing You a Magical Wedding Day!</span>
            <CssSparkle size={18} />
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Timeline Steps with Soft Nail Pink Line & Gold Star on Complete */}
          <div className="lg:col-span-7 relative pl-5 space-y-3 before:content-[''] before:absolute before:left-1.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#FADADD]/60">
            {steps.map((step) => {
              const done = Boolean(step.completed);
              return (
                <div
                  key={step.id}
                  onClick={() => toggleStep(step)}
                  className={`press-bounce relative cursor-pointer rounded-2xl p-4 border transition flex items-start justify-between gap-4 ${
                    done
                      ? 'bg-[#FADADD]/15 border-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.25)]'
                      : 'bg-[#121212]/65 border-white/15 hover:border-[#D4AF37]/60'
                  }`}
                >
                  <span
                    className={`absolute -left-[19px] top-6 w-2.5 h-2.5 rounded-full border ${
                      done ? 'bg-[#D4AF37] border-[#FFF8F0]' : 'bg-[#FADADD] border-[#B01E2E]'
                    }`}
                  />
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${
                        done ? 'bg-[#D4AF37] border-[#F5E08E] text-[#121212]' : 'border-[#D4AF37]/60'
                      }`}
                    >
                      {done && <CssCheck />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B01E2E] text-[#F5E08E] border border-[#D4AF37]/45">
                          {step.day_label}
                        </span>
                        <h3 className={`font-display text-base font-bold ${done ? 'text-[#F5E08E]' : 'text-white'}`}>
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-xs text-[#FFF8F0]/80 mt-0.5">{step.subtitle}</p>
                      <p className="text-[11px] text-[#FFF8F0]/65 mt-1">{step.detail}</p>
                    </div>
                  </div>
                  <CssStar
                    size={15}
                    filled={done}
                    className={done ? 'text-[#F5E08E] shrink-0' : 'text-white shrink-0'}
                  />
                </div>
              );
            })}
          </div>

          {/* #16 Outfit + Jewellery Form & #17 D-Day Checklist & #19 D+1 Thank You */}
          <div className="lg:col-span-5 space-y-5">
            <form
              onSubmit={handleSavePrep}
              className="rounded-3xl bg-[#121212]/65 border border-[#D4AF37]/45 p-5 space-y-3"
            >
              <div className="text-[11px] uppercase tracking-widest text-[#F5E08E] font-bold">
                Outfit + Jewellery Prep Form
              </div>
              <p className="text-[11px] text-white/70">
                So your artist plans your exact eye, lip &amp; hair setting before D-Day.
              </p>
              <input
                type="text"
                value={prepForm.lehenga_colour}
                onChange={(e) => setPrepForm({ ...prepForm, lehenga_colour: e.target.value })}
                placeholder="Lehenga Colour"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-[#D4AF37]/35 text-xs text-white"
              />
              <input
                type="text"
                value={prepForm.jewellery}
                onChange={(e) => setPrepForm({ ...prepForm, jewellery: e.target.value })}
                placeholder="Jewellery (Kundan / Polki / Gold)"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-[#D4AF37]/35 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={prepForm.lens_needed}
                  onChange={(e) => setPrepForm({ ...prepForm, lens_needed: e.target.value })}
                  placeholder="Contact Lens"
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-[#D4AF37]/35 text-xs text-white"
                />
                <input
                  type="text"
                  value={prepForm.extension_needed}
                  onChange={(e) => setPrepForm({ ...prepForm, extension_needed: e.target.value })}
                  placeholder="Hair Extension"
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-[#D4AF37]/35 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="btn-shimmer w-full py-2.5 rounded-full bg-[#D4AF37] text-[#121212] font-bold text-xs cursor-pointer"
              >
                {prepSaved ? 'Saved for Your Artist!' : 'Save Outfit & Jewellery Details'}
              </button>
            </form>

            {/* #17 D-Day Checklist + #19 D+1 Thank You */}
            <div className="rounded-3xl bg-white/5 border border-[#D4AF37]/35 p-5 space-y-3 text-xs">
              <div className="font-display text-base font-bold text-[#F5E08E]">
                D-Day Bag Checklist (Reporting 5:30 AM)
              </div>
              <ul className="space-y-1.5 text-white/80">
                <li>• Button-down shirt for makeup session (no pullover)</li>
                <li>• Double-sided fashion tape, safety pins &amp; lens solution</li>
                <li>• Freshly steamed double dupatta &amp; blouse</li>
              </ul>
              <div className="pt-3 border-t border-white/10 text-[11px] text-[#F5E08E]">
                <strong>D+1 Auto Thank You:</strong> &ldquo;Thank you Priya! Share your glow on Google &amp; unlock FUSION500.&rdquo;
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
