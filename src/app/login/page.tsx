"use client";

import { useState } from "react";
import Image from "next/image";
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
      <div className="w-full max-w-sm bg-white rounded-lg border border-ink-200 p-8 shadow-sm">
        <div className="flex flex-col items-center mb-7">
          <Image
            src="/logo-nuevo-san-vicente.jpeg"
            alt="Nuevo San Vicente"
            width={180}
            height={120}
            className="h-20 w-auto object-contain mb-4"
            priority
          />
          <div className="text-center">
            <div className="text-lg font-medium text-ink-900">Cristal Comercializa</div>
            <div className="text-[10px] text-brand-600 tracking-[0.25em] mt-0.5">NUEVO SAN VICENTE</div>
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
            className="w-full py-2 rounded-md bg-brand-600 text-white text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >{loading ? "Ingresando…" : "Ingresar"}</button>
        </form>
      </div>
    </div>
  );
}
