import React, { useEffect, useState } from 'react';
import AdminDashboard from '../components/AdminDashboard';
import { CssLock } from '../components/CssIcons';

export default function AdminPage({ refreshTrigger }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/session', { credentials: 'include' })
      .then((res) => setIsAuthenticated(res.ok))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid PIN');
      } else {
        setIsAuthenticated(true);
        setPin('');
      }
    } catch {
      setError('Backend server unreachable');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setIsAuthenticated(false);
  };

  if (checkingSession) {
    return (
      <div className="min-h-[75vh] bg-[#0B0B0C] text-[#FAF6F0] flex items-center justify-center px-4 py-16">
        <p className="text-xs uppercase tracking-widest text-[#D4AF37]">Verifying Owner Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] bg-[#0B0B0C] text-[#FAF6F0] flex items-center justify-center px-4 py-16">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-3xl bg-[#1A1214] border-2 border-[#D4AF37] p-7 text-center shadow-[0_0_40px_rgba(212,175,55,0.2)] space-y-4"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-[#9E1B2B] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37]">
            <CssLock />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37] font-bold">
              Protected Area · By Mini Jain
            </span>
            <h1 className="font-display text-2xl font-bold mt-1">Owner Admin Login</h1>
            <p className="text-xs text-white/65 mt-1">
              Enter 4-digit Owner PIN to access bookings, revenue &amp; CRM leads.
            </p>
          </div>

          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            required
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter Owner PIN"
            className="w-full text-center tracking-[0.4em] font-mono text-lg px-4 py-3 rounded-2xl bg-black/50 border border-[#D4AF37]/50 text-[#D4AF37] focus:outline-none focus:border-[#D4AF37]"
          />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-shimmer w-full py-3 rounded-full bg-[#9E1B2B] border border-[#D4AF37] text-xs font-bold cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Verifying...' : 'Unlock Owner Dashboard'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] bg-[#0B0B0C]">
      <AdminDashboard
        refreshTrigger={refreshTrigger}
        onUnauthorized={handleLogout}
        onLogout={handleLogout}
      />
    </div>
  );
}
