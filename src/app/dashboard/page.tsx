"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import Masterplan from "@/components/Masterplan";
import LotDetail from "@/components/LotDetail";
import { createClient } from "@/lib/supabase-client";
import { useProfile } from "@/lib/use-profile";
import type { LotStatus } from "@/lib/blocks";
import type { Lot } from "@/lib/types";

export default function DashboardPage() {
  const supabase = createClient();
  const { profile } = useProfile();
  const [lots, setLots] = useState<Lot[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, LotStatus>>({});
  const [selected, setSelected] = useState<{ code: string; num: number } | null>(null);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [filterEtapa, setFilterEtapa] = useState<1 | 2 | "all">("all");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase.from("lots_view").select("*");
    if (!error && data) {
      setLots(data as Lot[]);
      const map: Record<string, LotStatus> = {};
      (data as Lot[]).forEach(l => { map[`${l.block_code}-${l.number}`] = l.status; });
      setStatusMap(map);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const ch = supabase
      .channel("lots-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "lots" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase, fetchData]);

  useEffect(() => {
    if (!selected) { setSelectedLot(null); return; }
    const lot = lots.find(l => l.block_code === selected.code && l.number === selected.num);
    setSelectedLot(lot || null);
  }, [selected, lots]);

  const handleLotClick = (code: string, num: number) => setSelected({ code, num });

  const handleStatusChange = async (lotId: string, newStatus: LotStatus, extra?: Record<string, unknown>) => {
    const res = await fetch(`/api/lots/${lotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, ...extra }),
    });
    if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "Error"); }
    await fetchData();
  };

  return (
    <div className="min-h-screen bg-ink-100/40">
      <Header userName={profile?.full_name || "..."} role={profile?.role} />
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <h1 className="text-xl font-medium">Masterplan</h1>
          <div className="ml-auto flex gap-1 bg-white border border-ink-200 rounded-md p-0.5">
            {(["all", 1, 2] as const).map(e => (
              <button
                key={e}
                onClick={() => setFilterEtapa(e)}
                className={`px-3 py-1 text-sm rounded ${filterEtapa === e ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-100"}`}
              >{e === "all" ? "Todo" : `Etapa ${e}`}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          <div>
            {loading ? (
              <div className="bg-white rounded-lg border border-ink-200 h-96 flex items-center justify-center text-ink-600">Cargando masterplan…</div>
            ) : (
              <Masterplan
                lotStatus={statusMap}
                onLotClick={handleLotClick}
                selected={selected ? { code: selected.code, num: selected.num } : null}
                filterEtapa={filterEtapa}
              />
            )}
          </div>
          <div className="lg:sticky lg:top-4 self-start">
            <LotDetail
              lot={selectedLot}
              onClose={() => setSelected(null)}
              onChangeStatus={handleStatusChange}
              canEdit={!!profile && profile.role !== "viewer"}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
