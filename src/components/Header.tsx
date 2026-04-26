"use client";

import { LogOut } from "lucide-react";

export default function Header({ userName, role }: { userName?: string; role?: string }) {
  const initials = (userName || "??").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <header className="bg-ink-900 text-white">
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 60 40" className="w-7 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 30 Q15 8 28 18 Q22 12 30 5 Q35 18 30 22 Q42 12 55 30 Z" fill="#97C459" />
          </svg>
          <div>
            <div className="text-sm font-medium tracking-wide">Cristal Desarrollos</div>
            <div className="text-[10px] text-brand-400 tracking-[0.2em]">NUEVO SAN VICENTE</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="text-right hidden sm:block">
            <div className="text-white">{userName || "Invitado"}</div>
            <div className="text-[11px] text-ink-200 capitalize">{role || ""}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-medium">
            {initials}
          </div>
          <button
            onClick={async () => { await fetch("/api/logout", { method: "POST" }); window.location.href = "/login"; }}
            title="Cerrar sesión"
            className="text-ink-200 hover:text-white p-1"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
