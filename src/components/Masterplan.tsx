"use client";

import { useEffect, useMemo, useState } from "react";
import { BLOCKS, AMENITIES, computeLotRects, type LotStatus, type BlockDef } from "@/lib/blocks";

const STATUS_COLORS: Record<LotStatus, { fill: string; stroke: string }> = {
  disponible: { fill: "#EAF3DE", stroke: "#97C459" },
  reservado:  { fill: "#FAC775", stroke: "#EF9F27" },
  vendido:    { fill: "#F09595", stroke: "#E24B4A" },
  bloqueado:  { fill: "#D3D1C7", stroke: "#888780" },
};

interface SelectedLot { code: string; num: number; }

export interface MasterplanProps {
  lotStatus: Record<string, LotStatus>;
  onLotClick?: (block: string, num: number) => void;
  selected?: SelectedLot | null;
  filterEtapa?: 1 | 2 | "all";
  showLotNumbers?: boolean;
  interactive?: boolean;
}

export default function Masterplan({
  lotStatus,
  onLotClick,
  selected,
  filterEtapa = "all",
  showLotNumbers = true,
  interactive = true,
}: MasterplanProps) {
  const blocksWithRects = useMemo(
    () => BLOCKS.map(b => ({ b, rects: computeLotRects(b) })),
    []
  );

  const counts = useMemo(() => {
    const c = { disponible: 0, reservado: 0, vendido: 0, bloqueado: 0, total: 0 };
    blocksWithRects.forEach(({ b, rects }) => {
      if (filterEtapa !== "all" && b.etapa !== filterEtapa) return;
      rects.forEach(r => {
        const s = lotStatus[`${b.code}-${r.num}`] || "disponible";
        c[s]++; c.total++;
      });
    });
    return c;
  }, [blocksWithRects, lotStatus, filterEtapa]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 mb-3 px-2">
        <div className="text-sm text-ink-600">
          <span className="font-medium text-ink-900">{counts.total}</span> lotes
        </div>
        <div className="flex gap-2 ml-auto flex-wrap">
          <Stat dot="#97C459" label={`${counts.disponible} disponibles`} />
          <Stat dot="#EF9F27" label={`${counts.reservado} reservados`} />
          <Stat dot="#E24B4A" label={`${counts.vendido} vendidos`} />
        </div>
      </div>

      <div className="relative bg-[#fafaf7] rounded-lg border border-ink-200 overflow-hidden">
        <Legend />
        <svg
          viewBox="0 0 720 360"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block"
          style={{ aspectRatio: "720 / 360" }}
        >
          <rect x="8" y="6" width="306" height="150" fill="none" stroke="#378ADD" strokeWidth="0.5" strokeDasharray="2 1.5" opacity="0.5" rx="3" />
          <rect x="308" y="130" width="392" height="220" fill="none" stroke="#378ADD" strokeWidth="0.5" strokeDasharray="2 1.5" opacity="0.5" rx="3" />

          {AMENITIES.map(a => (
            <g key={a.code}>
              <rect x={a.x} y={a.y} width={a.w} height={a.h} rx="2" fill="#C0DD97" stroke="#97C459" strokeWidth="0.4" opacity="0.85" />
              <text x={a.x + a.w / 2} y={a.y + a.h / 2 + 1.5} textAnchor="middle" fontSize="3.5" fontWeight="500" fill="#27500A">{a.label}</text>
            </g>
          ))}

          {blocksWithRects.map(({ b, rects }) => {
            const dim = filterEtapa !== "all" && b.etapa !== filterEtapa;
            return (
              <g key={b.code} opacity={dim ? 0.18 : 1}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="1.5" fill="#fff" stroke="#b4b2a9" strokeWidth="0.3" />
                <BlockLabel b={b} />
                {rects.map(r => {
                  const status = lotStatus[`${b.code}-${r.num}`] || "disponible";
                  const c = STATUS_COLORS[status];
                  const isSel = selected?.code === b.code && selected?.num === r.num;
                  return (
                    <g
                      key={r.num}
                      className={interactive && !dim ? "lot-cell" : ""}
                      onClick={() => interactive && !dim && onLotClick?.(b.code, r.num)}
                    >
                      <rect
                        x={r.x} y={r.y} width={r.w} height={r.h}
                        rx="0.4"
                        fill={c.fill}
                        stroke={isSel ? "#1a1a1a" : c.stroke}
                        strokeWidth={isSel ? 1 : 0.25}
                      />
                      {showLotNumbers && r.w >= 2.5 && r.h >= 2 && (
                        <text
                          x={r.x + r.w / 2}
                          y={r.y + r.h / 2 + 0.9}
                          textAnchor="middle"
                          fontSize={Math.min(r.w * 0.45, r.h * 0.5, 2.6)}
                          fill="#2C2C2A"
                          fontWeight="500"
                          style={{ pointerEvents: "none" }}
                        >{r.num}</text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function BlockLabel({ b }: { b: BlockDef }) {
  if (b.layout === "linear21" || b.layout === "linear18") {
    return (
      <text x={b.x + b.w / 2} y={b.y + b.h - 1} textAnchor="middle" fontSize="3" fill="#5F5E5A" fontWeight="500">{b.code}</text>
    );
  }
  return (
    <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 1.5} textAnchor="middle" fontSize="4" fill="#5F5E5A" fontWeight="500">{b.code}</text>
  );
}

function Stat({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-ink-100">
      <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
      <span>{label}</span>
    </div>
  );
}

function Legend() {
  return (
    <div className="absolute top-3 right-3 z-10 bg-white border border-ink-200 rounded-md px-2.5 py-2 text-[11px] flex flex-col gap-1 shadow-sm">
      <LegendRow color="#EAF3DE" border="#97C459" label="Disponible" />
      <LegendRow color="#FAC775" border="#EF9F27" label="Reservado" />
      <LegendRow color="#F09595" border="#E24B4A" label="Vendido" />
    </div>
  );
}

function LegendRow({ color, border, label }: { color: string; border: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-sm border" style={{ background: color, borderColor: border }} />
      <span>{label}</span>
    </div>
  );
}
