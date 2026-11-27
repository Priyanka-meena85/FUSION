import React, { useEffect, useState } from 'react';
import { CssCheck, CssCopy, CssSparkle, CssStar } from './CssIcons';

export default function ReviewsReferral() {
  const [reviews, setReviews] = useState([]);
  const [hoverRating, setHoverRating] = useState(5);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('Ajmer');
  const [newComment, setNewComment] = useState('');
  const [copied, setCopied] = useState(false);

  const loadReviews = () => {
    fetch('/api/reviews')
      .then((r) => r.json())
      .then((data) => {
        if (data.reviews) setReviews(data.reviews);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newComment.trim()) return;
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bride_name: newName,
          city: newCity,
          look_type: 'Bridal Look',
          rating: hoverRating,
          comment: newComment,
        }),
      });
      setNewName('');
      setNewComment('');
      setShowModal(false);
      loadReviews();
    } catch {
      setShowModal(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText('FUSION500').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const marqueeItems = [...reviews, ...reviews];

  return (
    <section className="reveal-section py-14 sm:py-18 px-4 bg-[#FFF8F0] overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#B01E2E] bg-[#FADADD] px-3.5 py-1 rounded-full">
              <CssStar size={11} /> 4.4 Google &amp; JustDial Wall
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#121212] mt-3">
              Loved by 500+ Ajmer &amp; Jaipur Brides
            </h2>
          </div>

          {/* Interactive 5-Star CTA */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#D4AF37]/40 shadow-sm flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => {
                    setHoverRating(star);
                    setShowModal(true);
                  }}
                  aria-label={`Rate ${star} stars`}
                  className="p-0.5 cursor-pointer hover:scale-125 transition"
                >
                  <CssStar
                    size={16}
                    filled={star <= hoverRating}
                    className={star <= hoverRating ? 'text-[#D4AF37]' : 'text-stone-300'}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-xs font-bold text-[#B01E2E] underline cursor-pointer"
            >
              Write Review
            </button>
          </div>
        </div>

        {/* Auto-scrolling Carousel (pauses on hover) */}
        <div className="overflow-hidden py-2">
          <div className="reviews-marquee gap-4">
            {marqueeItems.map((rev, i) => (
              <div
                key={`${rev.id}-${i}`}
                className="w-[300px] sm:w-[330px] shrink-0 bg-white rounded-2xl p-5 border border-[#D4AF37]/35 shadow-sm"
              >
                <div className="flex items-center gap-1 text-[#D4AF37] mb-2">
                  {Array.from({ length: rev.rating }).map((_, idx) => (
                    <CssStar key={idx} size={12} />
                  ))}
                </div>
                <p className="text-xs text-[#121212]/80 leading-relaxed line-clamp-3">
                  &ldquo;{rev.comment}&rdquo;
                </p>
                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#B01E2E]">{rev.bride_name}</span>
                  <span className="text-stone-500">{rev.city} · {rev.look_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Card */}
        <div className="mt-9 rounded-3xl bg-gradient-to-r from-[#B01E2E] via-[#8D173A] to-[#B01E2E] text-[#FFF8F0] p-6 sm:p-8 border border-[#D4AF37] shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#F5E08E] font-bold">
              <CssSparkle size={11} /> Referral Wallet
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold">
              Refer a Friend — Both Get ₹500 Off
            </h3>
            <p className="text-xs text-[#FFF8F0]/80">
              Share your personal referral code with a bride-to-be. Both get instant ₹500 credit at Fusion Ajmer.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#121212]/60 border border-[#D4AF37] rounded-2xl px-4 py-3">
            <div>
              <span className="text-[10px] uppercase text-[#FFF8F0]/60 block">Referral Code</span>
              <span className="font-mono text-lg font-bold tracking-widest text-[#F5E08E]">
                FUSION500
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="press-bounce inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#121212] text-xs font-bold cursor-pointer"
            >
              {copied ? <CssCheck /> : <CssCopy />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Review Popup Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReview}
            className="bg-[#FFF8F0] border-2 border-[#D4AF37] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-display text-xl font-bold text-[#B01E2E]">Share Your Fusion Glow</h4>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs font-bold text-stone-500 cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setHoverRating(s)}
                  className="cursor-pointer"
                >
                  <CssStar size={18} filled={s <= hoverRating} className="text-[#D4AF37]" />
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Your Name (e.g. Kritika Jain)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D4AF37]/40 text-xs"
            />
            <input
              type="text"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              placeholder="City (Ajmer / Jaipur)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D4AF37]/40 text-xs"
            />
            <textarea
              required
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="How was your Magical Mirror & artist experience?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D4AF37]/40 text-xs"
            />
            <button
              type="submit"
              className="btn-shimmer w-full py-3 rounded-full bg-[#B01E2E] text-[#FFF8F0] font-bold text-xs cursor-pointer"
            >
              Publish Review
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
