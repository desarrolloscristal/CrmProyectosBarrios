"use client";

import { ReactNode } from "react";

export function MetricCard({ label, value, delta, deltaTone = "neutral", icon }: {
  label: string;
  value: ReactNode;
  delta?: string;
  deltaTone?: "good" | "warn" | "neutral";
  icon?: ReactNode;
}) {
  const deltaClass =
    deltaTone === "good" ? "text-brand-700" :
    deltaTone === "warn" ? "text-amber-700" :
    "text-ink-600";

  return (
    <div className="bg-white border border-ink-200 rounded-md p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-ink-600 font-medium">{label}</div>
        {icon && <div className="text-ink-400">{icon}</div>}
      </div>
      <div className="text-xl font-medium mt-1.5 text-ink-900">{value}</div>
      {delta && <div className={`text-[11px] mt-1 ${deltaClass}`}>{delta}</div>}
    </div>
  );
}

export function SectionCard({ title, subtitle, children, action }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="bg-white border border-ink-200 rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-medium text-ink-900">{title}</div>
          {subtitle && <div className="text-[11px] text-ink-600 mt-0.5">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, { bg: string; fg: string; label: string }> = {
    disponible: { bg: "#EAF3DE", fg: "#3B6D11", label: "Disponible" },
    reservado: { bg: "#FAC775", fg: "#854F0B", label: "Reservado" },
    vendido: { bg: "#F09595", fg: "#791F1F", label: "Vendido" },
    active: { bg: "#FAC775", fg: "#854F0B", label: "Activa" },
    expired: { bg: "#D3D1C7", fg: "#444441", label: "Vencida" },
    cancelled: { bg: "#D3D1C7", fg: "#444441", label: "Cancelada" },
    converted: { bg: "#EAF3DE", fg: "#3B6D11", label: "Convertida" },
    signed: { bg: "#EAF3DE", fg: "#3B6D11", label: "Firmada" },
    pending: { bg: "#FAC775", fg: "#854F0B", label: "Pendiente" },
    paid_in_full: { bg: "#EAF3DE", fg: "#3B6D11", label: "Pagada" },
  };
  const s = styles[status] || { bg: "#D3D1C7", fg: "#444441", label: status };
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}

export function LotsDonut({ available, reserved, sold }: { available: number; reserved: number; sold: number }) {
  const total = available + reserved + sold;
  if (total === 0) return <div className="text-sm text-ink-600">Sin datos</div>;

  const C = 220;
  const r = 35;
  const circumf = 2 * Math.PI * r;
  const soldPct = (sold / total);
  const resPct = (reserved / total);

  const soldDash = soldPct * circumf;
  const resDash = resPct * circumf;
  const resOffset = -soldDash;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#EAF3DE" strokeWidth="14" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E24B4A" strokeWidth="14"
          strokeDasharray={`${soldDash} ${C}`} transform="rotate(-90 50 50)" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="#EF9F27" strokeWidth="14"
          strokeDasharray={`${resDash} ${C}`} strokeDashoffset={resOffset} transform="rotate(-90 50 50)" />
        <text x="50" y="48" textAnchor="middle" fontSize="13" fontWeight="500" fill="currentColor">
          {Math.round((sold / total) * 100)}%
        </text>
        <text x="50" y="60" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.6">
          vendido
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 text-xs">
        <LegendDot color="#97C459" label={`${available} disponibles`} />
        <LegendDot color="#EF9F27" label={`${reserved} reservados`} />
        <LegendDot color="#E24B4A" label={`${sold} vendidos`} />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

export function SalesBarChart({ data }: { data: Array<{ month: string; revenue: number }> }) {
  if (data.length === 0) {
    return <div className="text-sm text-ink-600 py-8 text-center">Aún no hay ventas registradas</div>;
  }
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-2 h-32 pt-2">
      {data.map((d, i) => {
        const h = (d.revenue / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="w-full bg-brand-600 rounded-t-sm hover:bg-brand-700 transition-colors relative group cursor-default"
              style={{ height: `${Math.max(h, 2)}%`, minHeight: 4 }}
              title={`${d.month}: USD ${d.revenue.toLocaleString("es-AR")}`}
            />
            <div className="text-[10px] text-ink-600">{d.month}</div>
          </div>
        );
      })}
    </div>
  );
}
