import React, { useEffect, useState } from 'react';
import { CssCheck, CssClock, CssCrown, CssLock } from './CssIcons';

function formatTimer(expiresAt, now) {
  const ms = Math.max(0, expiresAt - now);
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function AdminDashboard({ isOpen, onClose, refreshTrigger, adminToken, onUnauthorized, onLogout }) {
  const [data, setData] = useState(null);
  const [selectedBride, setSelectedBride] = useState(null);
  const [activeTab, setActiveTab] = useState('operations'); // 'operations' | 'reports' | 'pro' | 'media'
  const [peakPricingOn, setPeakPricingOn] = useState(true);
  const [flashSent, setFlashSent] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [now, setNow] = useState(Date.now());

  const handleImageUpload = (slot, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(adminToken ? { 'x-admin-token': adminToken } : {}),
          },
          body: JSON.stringify({ slot, dataUrl: reader.result }),
        });
        if (res.ok) {
          setUploadStatus(`Saved ${slot} — refresh any page to see your real photo!`);
        } else {
          setUploadStatus('Upload failed. Ensure file is an image.');
        }
      } catch {
        setUploadStatus('Upload failed.');
      }
    };
    reader.readAsDataURL(file);
  };

  const loadOverview = () => {
    fetch('/api/admin/overview', {
      headers: adminToken ? { 'x-admin-token': adminToken } : {},
    })
      .then((r) => {
        if (r.status === 401 && onUnauthorized) {
          onUnauthorized();
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setData(d);
        if (d.bookings?.length && !selectedBride) {
          setSelectedBride(d.bookings[0]);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadOverview();
  }, [refreshTrigger, isOpen]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const authHeaders = adminToken ? { 'x-admin-token': adminToken } : {};

  const handleMarkPaid = async (bookingId) => {
    await fetch(`/api/bookings/${bookingId}/pay`, { method: 'POST', headers: authHeaders });
    loadOverview();
  };

  const handleNotifyWaitlist = async (id) => {
    await fetch(`/api/waitlist/${id}/notify`, { method: 'POST', headers: authHeaders });
    loadOverview();
  };

  const handleToggleArtistLeave = async (artistId) => {
    await fetch(`/api/artists/${artistId}/leave`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ date_str: '2026-02-18' }),
    });
    loadOverview();
  };

  return (
    <section id="admin" className="reveal-section py-14 sm:py-18 px-4 bg-[#0B0B0C] text-[#FAF6F0]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#EAD28B] bg-[#9E1B2B] px-3.5 py-1 rounded-full border border-[#D4AF37]/45">
              <CssCrown /> Owner Command Center
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold mt-3">
              Admin Dashboard — CRM, Timers &amp; Reports
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('operations')}
              className={`px-4 py-2 rounded-full text-xs font-bold border cursor-pointer ${
                activeTab === 'operations'
                  ? 'bg-[#D4AF37] text-[#0B0B0C] border-white'
                  : 'border-[#D4AF37]/40 text-[#EAD28B]'
              }`}
            >
              Live Operations
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-full text-xs font-bold border cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-[#D4AF37] text-[#0B0B0C] border-white'
                  : 'border-[#D4AF37]/40 text-[#EAD28B]'
              }`}
            >
              Monthly Reports
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pro')}
              className={`px-4 py-2 rounded-full text-xs font-bold border cursor-pointer ${
                activeTab === 'pro'
                  ? 'bg-[#9E1B2B] text-white border-[#D4AF37]'
                  : 'border-[#D4AF37]/40 text-[#EAD28B]'
              }`}
            >
              Owner Pro Suite
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2 rounded-full text-xs font-bold border cursor-pointer ${
                activeTab === 'media'
                  ? 'bg-[#D4AF37] text-[#0B0B0C] border-white'
                  : 'border-[#D4AF37]/40 text-[#EAD28B]'
              }`}
            >
              Upload IG Photos
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 rounded-full border border-white/25 text-xs font-bold text-white/80 hover:border-[#D4AF37] cursor-pointer"
              >
                Lock
              </button>
            )}
            {isOpen && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full border border-[#D4AF37] text-xs font-bold text-[#EAD28B] cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* 3 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <div className="rounded-2xl bg-white/5 border border-[#D4AF37]/35 p-5">
            <span className="text-xs uppercase tracking-wider text-[#FAF6F0]/60">Total Bookings</span>
            <div className="font-display text-3xl font-bold text-[#EAD28B] mt-1">
              {data?.stats?.todayBookings ?? 5}
            </div>
            <span className="text-[11px] text-emerald-400">Live from SQLite DB</span>
          </div>
          <div className="rounded-2xl bg-white/5 border border-[#D4AF37]/35 p-5">
            <span className="text-xs uppercase tracking-wider text-[#FAF6F0]/60">Advance Collected</span>
            <div className="font-display text-3xl font-bold text-[#EAD28B] mt-1">
              ₹{(data?.stats?.advanceCollected ?? 22500).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-[#FAF6F0]/60">UPI &amp; ₹199 Token Advances</span>
          </div>
          <div className="rounded-2xl bg-white/5 border border-[#D4AF37]/35 p-5">
            <span className="text-xs uppercase tracking-wider text-[#FAF6F0]/60">Pending 48-Hr Timers</span>
            <div className="font-display text-3xl font-bold text-amber-300 mt-1">
              {data?.stats?.pendingTimersCount ?? 2}
            </div>
            <span className="text-[11px] text-amber-200/80">Auto-release if unpaid</span>
          </div>
        </div>

        {activeTab === 'media' ? (
          <div className="rounded-3xl bg-white/5 border border-[#D4AF37]/45 p-6 space-y-4">
            <div>
              <h3 className="font-display text-xl font-bold text-[#EAD28B]">
                1-Click Instagram Photo Uploader (No Code Needed)
              </h3>
              <p className="text-xs text-white/70 mt-1">
                Download your photos from @fusionsaloon16 and upload them directly to any slot below.
              </p>
              {uploadStatus && (
                <div className="mt-2 px-3 py-2 rounded-xl bg-emerald-950/70 border border-emerald-400/50 text-xs text-emerald-200">
                  {uploadStatus}
                </div>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { slot: 'logo.jpg', label: 'Circular Header Logo' },
                { slot: 'bride-red.jpg', label: 'Red Lehenga Bride (Mirror)' },
                { slot: 'bride-pastel.jpg', label: 'Pastel Bride (Mirror)' },
                { slot: 'engagement.jpg', label: 'Engagement Look (Mirror)' },
                { slot: 'groom.jpg', label: 'Royal Groom Look (Mirror)' },
                { slot: 'nails.jpg', label: 'Nail Art Studio Photo' },
              ].map((item) => (
                <label
                  key={item.slot}
                  className="rounded-2xl bg-black/35 border border-[#D4AF37]/35 p-4 flex flex-col gap-2 cursor-pointer hover:border-[#D4AF37]"
                >
                  <span className="text-xs font-bold text-[#EAD28B]">{item.label}</span>
                  <span className="text-[10px] text-white/60">Target: /images/{item.slot}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(item.slot, e.target.files?.[0])}
                    className="text-[11px] text-white/80 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-[#9E1B2B] file:text-white file:text-[10px] file:font-bold"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : activeTab === 'pro' ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* #17 Artist Performance + #23 Staff Commission */}
            <div className="rounded-3xl bg-white/5 border border-[#D4AF37]/35 p-5 space-y-3">
              <h3 className="font-display text-lg font-bold text-[#EAD28B]">
                17 &amp; 23. Artist Performance &amp; Commission
              </h3>
              {[
                { name: 'Riya Sen', bookings: 14, rating: 4.9, repeat: '68%', comm: '₹18,400' },
                { name: 'Neha Kapoor', bookings: 9, rating: 4.8, repeat: '54%', comm: '₹11,200' },
                { name: 'Arjun Mehta', bookings: 11, rating: 4.7, repeat: '61%', comm: '₹9,800' },
              ].map((ar) => (
                <div key={ar.name} className="rounded-xl bg-black/35 p-3 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold">{ar.name}</div>
                    <div className="text-[11px] text-white/65">
                      {ar.bookings} Bookings · {ar.rating} Rating · {ar.repeat} Repeat
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/50 block">Commission</span>
                    <span className="font-bold text-[#D4AF37]">{ar.comm}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* #18 Peak Pricing + #19 Flash Sale + #22 Competitor Watch + #24 Inventory */}
            <div className="rounded-3xl bg-white/5 border border-[#D4AF37]/35 p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between bg-black/35 p-3 rounded-xl">
                <div>
                  <div className="font-bold text-[#EAD28B]">18. Peak Wedding Season Smart Pricing</div>
                  <div className="text-[11px] text-white/65">Auto-adjusts Feb/Nov rates (+10% peak / off-season offers)</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPeakPricingOn((p) => !p)}
                  className={`px-3 py-1.5 rounded-full font-bold cursor-pointer ${
                    peakPricingOn ? 'bg-[#9E1B2B] text-white border border-[#D4AF37]' : 'bg-stone-700 text-white'
                  }`}
                >
                  {peakPricingOn ? 'Peak ON' : 'Standard'}
                </button>
              </div>

              <div className="flex items-center justify-between bg-black/35 p-3 rounded-xl">
                <div>
                  <div className="font-bold text-[#EAD28B]">19. Cancelled Slot Flash Sale</div>
                  <div className="text-[11px] text-white/65">Blast 50 local clients: Today 4 PM Slot 20% OFF</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFlashSent(true)}
                  className="px-3 py-1.5 rounded-full bg-[#D4AF37] text-[#0B0B0C] font-bold cursor-pointer"
                >
                  {flashSent ? 'Sent to 50!' : 'Send Flash Sale'}
                </button>
              </div>

              <div className="bg-black/35 p-3 rounded-xl space-y-1">
                <div className="font-bold text-[#EAD28B]">22. Competitor Price Watch (Ajmer)</div>
                <div className="flex justify-between text-white/80">
                  <span>HD Bridal (Fusion vs Local Luxury)</span>
                  <strong className="text-emerald-400">₹25k vs ₹28k (Save ₹3,000)</strong>
                </div>
              </div>

              <div className="bg-red-950/60 border border-red-400/40 p-3 rounded-xl flex justify-between items-center">
                <span><strong>24. Inventory Alert:</strong> Setting Spray low (2 days left)</span>
                <span className="px-2 py-0.5 rounded-full bg-[#9E1B2B] text-white text-[10px] font-bold">Reorder</span>
              </div>
            </div>
          </div>
        ) : activeTab === 'reports' ? (
          /* #45 Monthly Reports + #34 Artist Leave Calendar */
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white/5 border border-[#D4AF37]/35 p-6 space-y-4">
              <h3 className="font-display text-xl font-bold text-[#EAD28B]">Feb 2026 Business Report</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Projected Monthly Revenue</span>
                  <span className="font-bold text-[#EAD28B]">
                    ₹{(data?.stats?.totalRevenueProjected ?? 113000).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Top-Selling Package</span>
                  <span className="font-bold">{data?.stats?.topPackage || 'HD Bridal'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Referral Conversions (FUSION500)</span>
                  <span className="font-bold text-emerald-400">{data?.stats?.referralConversions ?? 4} Brides</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/5 border border-[#D4AF37]/35 p-6 space-y-3">
              <h3 className="font-display text-xl font-bold text-[#EAD28B]">Artist Leave Calendar</h3>
              <p className="text-xs text-white/65">
                Toggle leave on 18 Feb to automatically block that artist&apos;s slot in the booking flow.
              </p>
              <div className="space-y-2">
                {(data?.artists || []).map((a) => {
                  const onLeave18 = a.leave_dates.includes('2026-02-18');
                  return (
                    <div key={a.id} className="flex items-center justify-between bg-black/30 p-3 rounded-xl text-xs">
                      <div>
                        <div className="font-bold">{a.name}</div>
                        <div className="text-[11px] text-white/60">Leaves: {a.leave_dates || 'None'}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleArtistLeave(a.id)}
                        className={`px-3 py-1.5 rounded-full font-bold cursor-pointer ${
                          onLeave18 ? 'bg-red-600 text-white' : 'bg-[#D4AF37] text-[#0B0B0C]'
                        }`}
                      >
                        {onLeave18 ? 'On Leave 18 Feb' : 'Toggle 18 Feb Leave'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              {/* Pending 48-Hr Timers */}
              <div className="rounded-3xl bg-white/5 border border-[#D4AF37]/30 p-5">
                <h3 className="font-display text-lg font-bold text-[#EAD28B] mb-3 flex items-center gap-2">
                  <CssClock /> Pending 48-Hr Hold Timers
                </h3>
                <div className="space-y-2.5">
                  {(data?.pendingTimers || []).length === 0 ? (
                    <p className="text-xs text-white/60">All active holds are paid &amp; locked!</p>
                  ) : (
                    data.pendingTimers.map((b) => (
                      <div
                        key={b.id}
                        className="rounded-2xl bg-[#2A0510] border border-[#D4AF37]/40 p-3.5 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-sm font-bold">{b.customer_name} · {b.city}</div>
                          <div className="text-[11px] text-[#FAF6F0]/70">
                            {b.event_date} · {b.package_name} (Adv ₹{b.advance_amount.toLocaleString('en-IN')})
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-amber-300">
                            {formatTimer(b.hold_expires_at, now)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(b.id)}
                            className="press-bounce px-3 py-1.5 rounded-full bg-[#D4AF37] text-[#0B0B0C] text-[11px] font-bold cursor-pointer"
                          >
                            Mark Paid &amp; Lock
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* #31 Waitlist Auto-Refill */}
              <div className="rounded-3xl bg-white/5 border border-[#D4AF37]/30 p-5">
                <h3 className="font-display text-lg font-bold text-[#EAD28B] mb-3">
                  Waitlist &amp; Auto-Refill Queue
                </h3>
                <div className="space-y-2">
                  {(data?.waitlist || []).map((w) => (
                    <div key={w.id} className="rounded-xl bg-white/5 p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold">{w.bride_name}</span> · {w.date_str} ({w.package_name})
                      </div>
                      <button
                        type="button"
                        disabled={Boolean(w.notified)}
                        onClick={() => handleNotifyWaitlist(w.id)}
                        className="px-3 py-1 rounded-full bg-[#9E1B2B] text-[#EAD28B] font-bold text-[11px] border border-[#D4AF37]/40 cursor-pointer disabled:opacity-60"
                      >
                        {w.notified ? 'WhatsApp Sent' : 'Auto-Notify'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unified Lead Inbox */}
              <div className="rounded-3xl bg-white/5 border border-[#D4AF37]/30 p-5">
                <h3 className="font-display text-lg font-bold text-[#EAD28B] mb-3">
                  Unified Lead Inbox (Instagram + WhatsApp + Web)
                </h3>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(data?.leads || []).map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">
                          {lead.name} <span className="text-[#EAD28B] font-normal">· {lead.city}</span>
                        </div>
                        <div className="text-[11px] text-white/65">
                          {lead.makeup_type} · {lead.event_date} · {lead.notes}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-[#9E1B2B] text-[#EAD28B] text-[10px] font-bold">
                          {lead.source}
                        </span>
                        <div className="text-[10px] text-emerald-300 mt-1">{lead.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Bride Detail & Payment Tracking */}
            <div className="lg:col-span-5 rounded-3xl bg-gradient-to-b from-[#2A0510] to-[#0B0B0C] border border-[#D4AF37]/50 p-5">
              <h3 className="font-display text-lg font-bold text-[#EAD28B] mb-3">
                Bride Detail &amp; Payment History
              </h3>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {(data?.bookings || []).slice(0, 5).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBride(b)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold border cursor-pointer ${
                      selectedBride?.id === b.id
                        ? 'bg-[#D4AF37] text-[#0B0B0C] border-white'
                        : 'bg-white/5 text-white/80 border-white/15'
                    }`}
                  >
                    {b.customer_name.split(' ')[0]}
                  </button>
                ))}
              </div>

              {selectedBride && (
                <div className="space-y-3 text-xs">
                  <div className="rounded-2xl bg-black/35 p-4 border border-[#D4AF37]/30 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/60">Bride Name</span>
                      <span className="font-bold text-[#EAD28B]">{selectedBride.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Event Date &amp; City</span>
                      <span>{selectedBride.event_date} · {selectedBride.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Package</span>
                      <span>{selectedBride.package_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Outfit &amp; Jewellery</span>
                      <span>{selectedBride.lehenga_colour || 'Red'} · {selectedBride.jewellery || 'Kundan'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Assigned Artist</span>
                      <span>{selectedBride.artist_name || 'Riya Sen'}</span>
                    </div>
                    {selectedBride.upsells && (
                      <div className="flex justify-between text-[#EAD28B]">
                        <span>Upsells</span>
                        <span>{selectedBride.upsells}</span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-black/35 p-4 border border-[#D4AF37]/30 space-y-2">
                    <div className="text-[11px] uppercase tracking-wider text-[#EAD28B] font-bold">
                      Payment History
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Receipt {selectedBride.receipt_code}</span>
                      <span className="font-bold text-emerald-300 inline-flex items-center gap-1">
                        {selectedBride.status === 'locked' ? <CssCheck /> : <CssLock />}
                        ₹{selectedBride.advance_amount.toLocaleString('en-IN')} ({selectedBride.status})
                      </span>
                    </div>
                    <div className="flex justify-between text-white/60 pt-1 border-t border-white/10">
                      <span>Balance Due on D-Day</span>
                      <span>
                        ₹{Math.max(0, selectedBride.total_price - selectedBride.advance_amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
