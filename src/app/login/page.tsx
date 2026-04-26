"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-100/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-lg border border-ink-200 p-6">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <svg viewBox="0 0 60 40" className="w-10 h-7" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 30 Q15 8 28 18 Q22 12 30 5 Q35 18 30 22 Q42 12 55 30 Z" fill="#3B6D11" />
          </svg>
          <div>
            <div className="font-medium text-ink-900">Cristal Desarrollos</div>
            <div className="text-[10px] text-brand-600 tracking-[0.2em]">NUEVO SAN VICENTE</div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="text-xs text-ink-600 block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-ink-200 rounded-md text-sm focus:outline-none focus:border-brand-600"
            />
          </div>
          <div>
            <label className="text-xs text-ink-600 block mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-ink-200 rounded-md text-sm focus:outline-none focus:border-brand-600"
            />
          </div>
          {error && <div className="text-xs text-status-sold">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-brand-600 text-white text-sm hover:bg-brand-700 disabled:opacity-50"
          >{loading ? "Ingresando…" : "Ingresar"}</button>
        </form>
      </div>
    </div>
  );
}
