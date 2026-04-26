"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";

export default function Header({ userName, role }: { userName?: string; role?: string }) {
  const initials = (userName || "??").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <header className="bg-ink-900 text-white">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-md p-1.5 flex items-center justify-center">
            <Image
              src="/logo-nuevo-san-vicente.jpeg"
              alt="Nuevo San Vicente"
              width={48}
              height={32}
              className="h-7 w-auto object-contain"
              priority
            />
          </div>
          <div>
            <div className="text-sm font-medium tracking-wide">Cristal Comercializa</div>
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
