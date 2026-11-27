import React, { useState } from 'react';
import { CssCheck, CssSparkle } from './CssIcons';

const INITIAL_MESSAGES = [
  { id: 1, sender: 'bride', text: 'How much does bridal makeup cost?' },
  { id: 2, sender: 'bot', text: 'Hi! Please share your event date, city, and preferred makeup finish (HD / Airbrush / Engagement).' },
];

const PRESET_STEPS = [
  {
    id: 'step-1',
    reply: '12 Feb, Jaipur, HD Bridal',
    botResponse: '12 Feb is Available — HD Bridal ₹25,000 + ₹3,500 Jaipur Travel (Advance ₹10,000).',
    hasPdf: true,
  },
  {
    id: 'step-2',
    reply: 'What is the difference with Airbrush?',
    botResponse: 'Airbrush Bridal is ₹35,000 — featherlight waterproof finish that lasts 16+ hours.',
    hasPdf: false,
  },
  {
    id: 'step-3',
    reply: 'How do I lock my wedding date?',
    botResponse: 'Click Pay Advance ₹10,000 below — your 48-Hr hold timer starts automatically!',
    hasPdf: false,
  },
];

const LANG_GREETINGS = {
  English: 'Hi! Please share your event date, city, and preferred makeup finish (HD / Airbrush / Engagement).',
  Hindi: 'Namaste! Please share your wedding date, city, and preferred finish (HD / Airbrush).',
  Marwari: 'Khamma Ghani! Please share your wedding date, city, and preferred finish.',
};

export default function ChatbotDemo({ onJumpToBook, onLeadSaved }) {
  const [lang, setLang] = useState('English');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [stepIdx, setStepIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [pdfToast, setPdfToast] = useState(false);
  const [handoverTriggered, setHandoverTriggered] = useState(false);

  const switchLang = (nextLang) => {
    setLang(nextLang);
    setMessages([
      { id: 1, sender: 'bride', text: 'Bridal makeup kitna charge hai?' },
      { id: 2, sender: 'bot', text: LANG_GREETINGS[nextLang] },
    ]);
    setStepIdx(0);
  };

  const handlePresetClick = (preset) => {
    if (isTyping) return;
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'bride', text: preset.reply }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: preset.botResponse, hasPdf: preset.hasPdf },
      ]);
      setStepIdx((i) => Math.min(PRESET_STEPS.length, i + 1));
    }, 800);
  };

  // #28 Human Handover
  const handleHumanHandover = async () => {
    if (isTyping || handoverTriggered) return;
    setHandoverTriggered(true);
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'bride', text: 'I would like a custom skin & shade consultation' },
    ]);
    setIsTyping(true);

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Bot Handover Bride',
          phone: '+91 98290 77889',
          source: 'WhatsApp Bot',
          city: 'Ajmer',
          event_date: '2026-02-20',
          makeup_type: 'Custom Consult',
          status: 'Human Handover',
          notes: 'URGENT: Bot handed over — Artist callback in 30 min',
        }),
      });
      if (onLeadSaved) onLeadSaved();
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Lead saved! Senior Artist Riya will call you within 30 minutes. Owner dashboard alerted!',
        },
      ]);
    }, 800);
  };

  const resetChat = () => {
    setMessages(INITIAL_MESSAGES);
    setStepIdx(0);
    setIsTyping(false);
    setHandoverTriggered(false);
    setPdfToast(false);
  };

  return (
    <section className="reveal-section py-14 sm:py-18 px-4 bg-[#FAF6F0]">
      <div className="max-w-5xl mx-auto grid md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-6 space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#9E1B2B] bg-[#F3ECE1] px-3.5 py-1 rounded-full">
            <CssSparkle size={11} /> 24x7 Auto Inquiry Bot
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#0B0B0C]">
            From First DM to Date Lock — Zero Missed Leads
          </h2>
          <p className="text-sm text-[#0B0B0C]/75 leading-relaxed">
            Whether a bride messages at 2 AM on Instagram or WhatsApp, Fusion&apos;s bot checks availability, shares <span className="font-semibold text-[#9E1B2B]">Bridal_Packages.pdf</span>, saves the lead to CRM, and triggers Human Handover when needed.
          </p>
          <div className="space-y-2 text-xs text-[#0B0B0C]/80 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center"><CssCheck /></span>
              <span>Instant reply in under 1 second, 24x7</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center"><CssCheck /></span>
              <span>Auto-saves Name, Phone, Date &amp; City in Admin CRM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center"><CssCheck /></span>
              <span>Smart Human Handover: &ldquo;Artist 30 min me call karegi&rdquo;</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-6 flex justify-center">
          <div className="w-full max-w-[340px] rounded-[36px] bg-[#0B0B0C] p-3 shadow-[0_24px_60px_rgba(26,26,26,0.28)] border-2 border-[#D4AF37]/60">
            <div className="rounded-t-[26px] bg-[#9E1B2B] text-[#FAF6F0] px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-display text-sm font-bold text-[#EAD28B]">Fusion Bridal Bot</div>
                <div className="text-[10px] text-emerald-300">21. Multi-Lang: {lang}</div>
              </div>
              <div className="flex items-center gap-1">
                {['English', 'Hindi', 'Marwari'].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => switchLang(l)}
                    className={`text-[9px] px-1.5 py-0.5 rounded-full border cursor-pointer ${
                      lang === l ? 'bg-[#D4AF37] text-[#0B0B0C] border-white font-bold' : 'border-[#D4AF37]/40 text-[#EAD28B]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={resetChat}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-[#D4AF37]/50 text-[#EAD28B] hover:bg-white/10 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="bg-[#FAF6F0] h-[300px] overflow-y-auto p-3.5 space-y-2.5">
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.sender === 'bride' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      m.sender === 'bride'
                        ? 'bg-[#F3ECE1] text-[#0B0B0C] border border-[#D4AF37]/40 rounded-br-sm font-medium'
                        : 'bg-[#0B0B0C] text-[#D4AF37] border border-[#D4AF37]/55 rounded-bl-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.hasPdf && (
                    <button
                      type="button"
                      onClick={() => setPdfToast(true)}
                      className="press-bounce mt-1.5 px-3 py-1.5 rounded-xl bg-[#9E1B2B] border border-[#D4AF37] text-[#FAF6F0] text-[11px] font-bold shadow-sm animate-bounce cursor-pointer"
                    >
                      Bridal_Packages.pdf (Tap to Preview)
                    </button>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 bg-white border border-[#D4AF37]/35 px-3.5 py-2.5 rounded-2xl w-fit">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              )}

              {pdfToast && (
                <div className="rounded-xl bg-[#0B0B0C] text-[#EAD28B] p-2.5 text-[11px] flex items-center justify-between">
                  <span>Bridal_Packages.pdf (HD ₹25k · Airbrush ₹35k)</span>
                  <button type="button" onClick={onJumpToBook} className="underline font-bold ml-2 cursor-pointer">
                    Book
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-b-[26px] bg-white p-3 border-t border-stone-200">
              <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2">
                Tap a reply or test Human Handover:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_STEPS.slice(stepIdx, stepIdx + 2).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetClick(p)}
                    className="press-bounce text-[11px] px-3 py-1.5 rounded-full bg-[#F3ECE1] text-[#9E1B2B] font-semibold border border-[#D4AF37]/45 hover:bg-[#9E1B2B] hover:text-white transition cursor-pointer"
                  >
                    {p.reply}
                  </button>
                ))}
                {!handoverTriggered && (
                  <button
                    type="button"
                    onClick={handleHumanHandover}
                    className="press-bounce text-[11px] px-3 py-1.5 rounded-full bg-[#0B0B0C] text-[#EAD28B] font-semibold cursor-pointer"
                  >
                    Talk to Artist (Handover)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
