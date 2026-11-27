import React, { useRef, useState } from 'react';
import { CssCheck, CssSparkle } from './CssIcons';

const LIP_SHADES = [
  { name: 'Bridal Red', hex: '#9E1B2B' },
  { name: 'Rose Pink', hex: '#D96B84' },
  { name: 'Royal Wine', hex: '#6E1428' },
  { name: 'Soft Nude', hex: '#C68B77' },
];

const HAIR_COLOURS = [
  { name: 'Natural Black', hex: '#0B0B0C' },
  { name: 'Burgundy', hex: '#6D182B' },
  { name: 'Caramel Blonde', hex: '#B68642' },
  { name: 'Espresso', hex: '#3D2318' },
];

const FACE_TIPS = {
  Round: 'Soft glam + elongated winged liner & sculpted cheekbones (avoid heavy round cut-crease).',
  Oval: 'Balanced royal gold shimmer lid + bold Bridal Red lip suits your symmetry.',
  Square: 'Soft diffused smokey eye + feathered brow & dewy blush to soften jawline.',
};

const SKIN_PLANS = {
  Dry: 'Hydra-Glow Facial on D-30 & D-15. Avoid matte alcohol primers; use hyaluronic mist.',
  Oily: 'Charcoal De-Tan + pore-tightening clean-up on D-15. Use silicone-free Airbrush base.',
  Combination: 'Zone-balanced Enzyme Facial on D-20. Satin-matte HD finish with T-zone lock.',
};

export default function AiStudioMirror({ onApplyRecommendation }) {
  const [activeTab, setActiveTab] = useState('ar'); // 'ar' | 'skin' | 'budget' | 'voice'
  const [lipShade, setLipShade] = useState(LIP_SHADES[0]);
  const [hairColour, setHairColour] = useState(HAIR_COLOURS[0]);
  const [faceShape, setFaceShape] = useState('Oval');
  const [skinType, setSkinType] = useState('Dry');
  const [budget, setBudget] = useState(25000);
  const [lehengaTone, setLehengaTone] = useState('Red');
  const [cameraOn, setCameraOn] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceResult, setVoiceResult] = useState('');
  const videoRef = useRef(null);

  const toggleCamera = async () => {
    if (cameraOn) {
      const stream = videoRef.current?.srcObject;
      stream?.getTracks().forEach((t) => t.stop());
      setCameraOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      setCameraOn(false);
    }
  };

  const getBudgetRec = (val) => {
    if (val >= 35000) return { pkg: 'Airbrush Bridal + Pre-Bridal Hydra Facial', note: 'Full luxury waterproof airbrush + D-15 facial included.' };
    if (val >= 25000) return { pkg: 'HD Bridal + 1 Pre-Bridal Clean-up', note: 'Best value! Airbrush upgrade is +₹10,000.' };
    if (val >= 15000) return { pkg: 'Engagement Shimmer Glam + Hair Spa', note: 'Ideal for engagement/cocktail. For HD Bridal, budget ₹25,000.' };
    return { pkg: 'Party Glam + Saree Draping', note: 'Includes HD party makeup & hair styling.' };
  };

  const budgetRec = getBudgetRec(budget);

  const handleVoiceDemo = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.lang = 'hi-IN';
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setVoiceText(transcript);
        setVoiceResult('Detected: 12 Feb · Dulhan Bridal Makeup · Checking live calendar...');
      };
      rec.onerror = () => {
        setVoiceText('Mujhe 12 Feb ko dulhan wala makeup karwana hai');
        setVoiceResult('Parsed Hindi Voice: Date = 12 Feb | Service = HD Bridal | Status = Waitlist/Check');
      };
      rec.start();
    } else {
      setVoiceText('Mujhe 12 Feb ko dulhan wala makeup karwana hai');
      setVoiceResult('Parsed Hindi Voice: Date = 12 Feb | Service = HD Bridal | Ready to Lock');
    }
  };

  return (
    <section className="reveal-section py-14 px-4 bg-[#0B0B0C] text-[#FAF6F0] border-y border-[#D4AF37]/40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37] bg-[#9E1B2B]/30 px-3.5 py-1 rounded-full border border-[#D4AF37]/45">
            <CssSparkle size={11} /> Virtual Mirror Studio
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold mt-3">
            Shade Try-On, Skin Guide &amp; Budget Planner
          </h2>
          <p className="text-sm text-[#FAF6F0]/70 mt-1.5">
            Preview lipstick &amp; hair shades, get your pre-bridal skin guide, or plan by budget.
          </p>
        </div>

        {/* Studio Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-7">
          {[
            { id: 'ar', label: 'Lip & Hair Try-On' },
            { id: 'skin', label: 'Skin & Face Guide' },
            { id: 'budget', label: 'Budget & Lehenga Match' },
            { id: 'voice', label: 'Voice Booking' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`press-bounce px-4 py-2 rounded-full text-xs font-bold border cursor-pointer ${
                activeTab === t.id
                  ? 'bg-[#9E1B2B] text-[#FAF6F0] border-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.35)]'
                  : 'bg-white/5 text-[#D4AF37] border-[#D4AF37]/35'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl bg-white/5 border border-[#D4AF37]/45 p-5 sm:p-8">
          {activeTab === 'ar' && (
            <div className="grid md:grid-cols-12 gap-6 items-center">
              {/* Live AR Mirror Preview */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="relative w-60 h-72 rounded-t-[130px] rounded-b-2xl border-4 border-[#D4AF37] bg-[#1E1014] overflow-hidden flex flex-col items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.25)]">
                  {cameraOn ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center">
                      {/* Hair Tint */}
                      <div
                        className="w-28 h-14 rounded-t-full transition-colors duration-500 -mb-4"
                        style={{ backgroundColor: hairColour.hex, borderTop: '2px solid #D4AF37' }}
                      />
                      {/* Face */}
                      <div className="w-22 h-26 rounded-[45%] bg-gradient-to-b from-[#F7D8C2] to-[#E6B89A] flex flex-col items-center justify-center relative">
                        <div className="flex gap-5">
                          <div className="w-3.5 h-1 border-b-2 border-[#0B0B0C] rounded-full" />
                          <div className="w-3.5 h-1 border-b-2 border-[#0B0B0C] rounded-full" />
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#9E1B2B] mt-1" />
                        <div
                          className="w-6 h-2 rounded-full mt-5 transition-colors duration-300"
                          style={{ backgroundColor: lipShade.hex }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 inset-x-2 text-center bg-[#0B0B0C]/80 rounded-lg py-1 text-[10px] text-[#D4AF37]">
                    Lip: {lipShade.name} · Hair: {hairColour.name}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="press-bounce mt-3 px-4 py-1.5 rounded-full border border-[#D4AF37] text-[11px] font-bold text-[#D4AF37] cursor-pointer"
                >
                  {cameraOn ? 'Stop Live Camera' : 'Try With Live Camera'}
                </button>
              </div>

              {/* Lip & Hair Selectors */}
              <div className="md:col-span-7 space-y-5">
                <div>
                  <label className="text-xs uppercase tracking-wider text-[#D4AF37] font-bold block mb-2">
                    Lipstick Shade Preview
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LIP_SHADES.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => setLipShade(s)}
                        className={`press-bounce p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                          lipShade.name === s.name ? 'border-[#D4AF37] bg-[#9E1B2B]/30' : 'border-white/15 bg-black/30'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: s.hex }} />
                        <span>{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-[#D4AF37] font-bold block mb-2">
                    Hair Colour Preview
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {HAIR_COLOURS.map((h) => (
                      <button
                        key={h.name}
                        type="button"
                        onClick={() => setHairColour(h)}
                        className={`press-bounce p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                          hairColour.name === h.name ? 'border-[#D4AF37] bg-[#9E1B2B]/30' : 'border-white/15 bg-black/30'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: h.hex }} />
                        <span>{h.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'skin' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-display text-lg font-bold text-[#D4AF37]">Pre-Bridal Skin Guide</h3>
                <div className="flex gap-2">
                  {Object.keys(SKIN_PLANS).map((sk) => (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => setSkinType(sk)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        skinType === sk ? 'bg-[#9E1B2B] border-[#D4AF37]' : 'bg-black/40 border-white/15'
                      }`}
                    >
                      {sk} Skin
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl bg-[#F3ECE1]/15 border border-[#D4AF37]/40 p-4 text-xs text-[#FAF6F0]/90 leading-relaxed">
                  <strong>AI Prescription ({skinType}):</strong> {SKIN_PLANS[skinType]}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-lg font-bold text-[#D4AF37]">Face Shape &amp; Glam Guide</h3>
                <div className="flex gap-2">
                  {Object.keys(FACE_TIPS).map((fs) => (
                    <button
                      key={fs}
                      type="button"
                      onClick={() => setFaceShape(fs)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        faceShape === fs ? 'bg-[#9E1B2B] border-[#D4AF37]' : 'bg-black/40 border-white/15'
                      }`}
                    >
                      {fs}
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl bg-[#F3ECE1]/15 border border-[#D4AF37]/40 p-4 text-xs text-[#FAF6F0]/90 leading-relaxed">
                  <strong>AI Look Match ({faceShape} Face):</strong> {FACE_TIPS[faceShape]}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <h3 className="font-display text-lg font-bold text-[#D4AF37]">
                  Package Budget Planner
                </h3>
                <div className="flex justify-between text-xs">
                  <span>Your Bridal Budget</span>
                  <strong className="text-[#D4AF37] text-base">₹{budget.toLocaleString('en-IN')}</strong>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={40000}
                  step={5000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-[#D4AF37]"
                />
                <div className="rounded-2xl bg-black/40 border border-[#D4AF37]/45 p-4 text-xs space-y-1">
                  <div className="font-bold text-[#F3ECE1]">{budgetRec.pkg}</div>
                  <div className="text-white/75">{budgetRec.note}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-lg font-bold text-[#D4AF37]">
                  Lehenga &amp; Makeup Pairing
                </h3>
                <div className="flex gap-2">
                  {['Red', 'Pastel Pink', 'Wine', 'Ivory Gold'].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLehengaTone(l)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        lehengaTone === l ? 'bg-[#9E1B2B] border-[#D4AF37]' : 'bg-black/40 border-white/15'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl bg-black/40 border border-[#D4AF37]/45 p-4 text-xs">
                  <strong>Best Match for {lehengaTone}:</strong>{' '}
                  {lehengaTone === 'Red'
                    ? '24K Gold Foil Lid + Bold Bridal Red Lip (#9E1B2B)'
                    : lehengaTone === 'Pastel Pink'
                    ? 'Champagne Shimmer + Soft Rose-Pink Lip + Dewy Highlighter'
                    : 'Bronze Smokey Eye + Deep Berry/Nude Lip'}
                </div>
                {onApplyRecommendation && (
                  <button
                    type="button"
                    onClick={() => onApplyRecommendation({ packageName: budget >= 35000 ? 'Airbrush Bridal' : 'HD Bridal', price: budget })}
                    className="btn-shimmer px-5 py-2 rounded-full bg-[#9E1B2B] border border-[#D4AF37] text-xs font-bold cursor-pointer"
                  >
                    Lock Recommended Package
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="text-center max-w-xl mx-auto space-y-4">
              <h3 className="font-display text-xl font-bold text-[#D4AF37]">
                Hands-Free Voice Booking
              </h3>
              <p className="text-xs text-white/75">
                Tap below and say: &ldquo;I want to book bridal makeup for 12 February&rdquo;
              </p>
              <button
                type="button"
                onClick={handleVoiceDemo}
                className="btn-shimmer px-7 py-3 rounded-full bg-[#9E1B2B] border-2 border-[#D4AF37] text-sm font-bold cursor-pointer"
              >
                Start Voice Booking
              </button>
              {voiceText && (
                <div className="rounded-2xl bg-black/45 border border-[#D4AF37]/40 p-4 text-xs space-y-1">
                  <div className="text-[#F3ECE1]">&ldquo;{voiceText}&rdquo;</div>
                  <div className="text-emerald-300 font-bold inline-flex items-center gap-1.5">
                    <CssCheck /> {voiceResult}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
