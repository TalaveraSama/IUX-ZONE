import React, { useState } from 'react';
import { Tv, Lock, User, MonitorPlay } from 'lucide-react';
import { apiFetch, setToken } from '../lib/api.js';

/**
 * IUX-ZONE Panel — XUI.One Edition (motor TVLister 24/7)
 * Pantalla de acceso estilo XUI.one modernizada.
 */
export default function LoginPage({ onLoginSuccess, onOpenWebTv }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      setToken(data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0e13] relative overflow-hidden p-4">
      <div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-[#2f7ceb]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full bg-[#2f7ceb]/8 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#2f7ceb] shadow-xl shadow-blue-900/40 mb-5">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-[0.14em]">
            IUX<span className="text-[#3b8bfd]">-ZONE</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-2 uppercase tracking-[0.2em] font-semibold">
            XUI.One Edition · motor TVLister 24/7
          </p>
          <p className="text-sm text-slate-400 mt-1.5">
            IPTV · OTT · VOD · Canales 24/7 · Resellers · WebTV
          </p>
        </div>

        <div className="rounded-lg bg-[#14161b]/95 border border-[#262a33] shadow-2xl p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Usuario</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-md bg-[#0f1116] border border-[#262a33] text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-[#2f7ceb] focus:ring-1 focus:ring-[#2f7ceb]/40 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-md bg-[#0f1116] border border-[#262a33] text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-[#2f7ceb] focus:ring-1 focus:ring-[#2f7ceb]/40 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md bg-[#2f7ceb] hover:bg-[#3b8bfd] disabled:opacity-60 text-white text-sm font-semibold tracking-wide transition shadow-md shadow-blue-900/30"
            >
              {loading ? 'Accediendo…' : 'Entrar al Panel'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#262a33] flex items-center justify-between">
            <button
              onClick={onOpenWebTv}
              className="inline-flex items-center gap-1.5 text-xs text-[#7db4ff] hover:text-white font-medium transition"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              Portal WebTV (clientes)
            </button>
            <span className="text-[10px] text-slate-600">v3.0.0</span>
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] text-slate-700">
          © 2026 IUX-ZONE · Estilo XUI.one · Motor TVLister 24/7 (Node.js)
        </div>
      </div>
    </div>
  );
}
