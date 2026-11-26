import React, { useEffect, useState } from 'react';
import { CssSparkle } from './CssIcons';

export default function FestivalOffers() {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    fetch('/api/campaigns')
      .then((r) => r.json())
      .then((data) => {
        if (data.campaigns) setCampaigns(data.campaigns);
      })
      .catch(() => {});
  }, []);

  const toggleCampaign = async (camp) => {
    const nextEnabled = camp.enabled ? 0 : 1;
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === camp.id
          ? {
              ...c,
              enabled: nextEnabled,
              last_sent_at: nextEnabled ? `WhatsApp blast queued · ${c.target_count} clients` : null,
            }
          : c
      )
    );
    try {
      await fetch(`/api/campaigns/${camp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: Boolean(nextEnabled) }),
      });
    } catch {
      // keep optimistic
    }
  };

  return (
    <section className="reveal-section py-14 px-4 bg-[#FADADD]/55 border-y border-[#D4AF37]/25">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#B01E2E] bg-white px-3.5 py-1 rounded-full border border-[#D4AF37]/35">
            <CssSparkle size={11} /> Auto Repeat Bookings
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#121212] mt-3">
            Festival Offers — Auto WhatsApp Campaign
          </h2>
          <p className="text-sm text-[#121212]/70 mt-1.5">
            Toggle ON any festival campaign to auto-send party makeup offers to past brides &amp; Ajmer regulars.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {campaigns.map((c) => {
            const on = Boolean(c.enabled);
            return (
              <div
                key={c.id}
                className={`relative rounded-3xl p-5 border transition-all duration-300 ${
                  on
                    ? 'bg-gradient-to-br from-[#B01E2E] to-[#4A081C] text-[#FFF8F0] border-[#D4AF37] shadow-[0_14px_35px_rgba(201,162,39,0.3)]'
                    : 'bg-white text-[#121212] border-[#D4AF37]/30 opacity-90'
                }`}
              >
                {on && (
                  <div className="absolute top-3 right-3 text-[#F5E08E] pointer-events-none">
                    <CssSparkle size={16} />
                  </div>
                )}

                <div className="text-[11px] uppercase tracking-wider font-bold text-[#D4AF37]">
                  {c.subtitle}
                </div>
                <h3 className="font-display text-xl font-bold mt-1">{c.title}</h3>
                <p className={`text-xs mt-2 leading-relaxed ${on ? 'text-[#FFF8F0]/80' : 'text-stone-600'}`}>
                  {c.offer_text}
                </p>

                <div className="mt-5 pt-4 border-t border-current/15 flex items-center justify-between">
                  <div className="text-[11px]">
                    <span className="font-bold">{c.target_count} Clients</span>
                    <span className="block opacity-75">
                      {on ? c.last_sent_at || 'Auto-WhatsApp ON' : 'Campaign Paused'}
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => toggleCampaign(c)}
                    className={`press-bounce relative w-12 h-7 rounded-full transition-colors cursor-pointer ${
                      on ? 'bg-[#D4AF37]' : 'bg-stone-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        on ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
