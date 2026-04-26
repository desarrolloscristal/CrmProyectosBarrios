"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, DollarSign, Calendar, Award } from "lucide-react";
import Header from "@/components/Header";
import { MetricCard, SectionCard, StatusPill } from "@/components/Metrics";
import { createClient } from "@/lib/supabase-client";
import { useProfile } from "@/lib/use-profile";
import { formatUSD, getPlan } from "@/lib/payment-plans";

interface SaleRow {
  id: string; block_code: string; lot_number: number; client_name: string;
  payment_plan: string; total_price: number; seller_commission_amt: number;
  status: string; signed_at: string | null; created_at: string;
}

interface ReservationRow {
  id: string; block_code: string; lot_number: number; client_name: string;
  expires_at: string; days_until_expiry: number; status: string;
}

export default function MyDashboardPage() {
  const supabase = createClient();
  const { profile, loading: profileLoading } = useProfile();
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    const [salesRes, resRes] = await Promise.all([
      supabase.from("sales_full").select("*").eq("seller_id", profile.id).order("created_at", { ascending: false }),
      supabase.from("reservations_full").select("*").eq("seller_id", profile.id).order("expires_at", { ascending: true }),
    ]);
    if (salesRes.data) setSales(salesRes.data as SaleRow[]);
    if (resRes.data) setReservations(resRes.data as ReservationRow[]);
    setLoading(false);
  }, [supabase, profile]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const completedSales = sales.filter(s => s.status === "signed" || s.status === "paid_in_full");
  const totalSold = completedSales.reduce((sum, s) => sum + Number(s.total_price || 0), 0);
  const totalCommission = completedSales.reduce((sum, s) => sum + Number(s.seller_commission_amt || 0), 0);
  const activeReservations = reservations.filter(r => r.status === "active");
  const cashSales = completedSales.filter(s => s.payment_plan === "contado").length;
  const financedSales = completedSales.length - cashSales;

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-ink-100/40">
        <Header userName="..." />
        <main className="max-w-7xl mx-auto p-6 text-ink-600">Cargando tus métricas…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-100/40">
      <Header userName={profile?.full_name} role={profile?.role} />
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-5">
          <h1 className="text-xl font-medium">Mi performance</h1>
          <p className="text-sm text-ink-600 mt-1">Hola {profile?.full_name?.split(" ")[0]}, este es el resumen de tus ventas y reservas.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <MetricCard label="Total vendido" value={formatUSD(totalSold)} delta={`${completedSales.length} ventas firmadas`} icon={<DollarSign size={14} />} />
          <MetricCard label="Mi comisión" value={formatUSD(totalCommission)} delta="3% sobre cada venta" deltaTone="good" icon={<Award size={14} />} />
          <MetricCard label="Reservas activas" value={activeReservations.length} delta={activeReservations.filter(r => r.days_until_expiry <= 3).length > 0 ? `${activeReservations.filter(r => r.days_until_expiry <= 3).length} vencen pronto` : "Todo al día"} deltaTone={activeReservations.filter(r => r.days_until_expiry <= 3).length > 0 ? "warn" : "good"} icon={<Calendar size={14} />} />
          <MetricCard label="Mix de ventas" value={`${cashSales} / ${financedSales}`} delta="Contado / Financiado" icon={<TrendingUp size={14} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <SectionCard title="Reservas activas" subtitle={`${activeReservations.length} reservas en curso`}>
            {activeReservations.length === 0 ? (
              <div className="text-sm text-ink-600 py-6 text-center">No tenés reservas activas todavía. ¡Andá al masterplan!</div>
            ) : (
              <div className="space-y-2">
                {activeReservations.slice(0, 6).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2.5 rounded-md bg-ink-100/50 text-sm">
                    <div>
                      <div className="font-medium">{r.block_code} · Lote {r.lot_number}</div>
                      <div className="text-xs text-ink-600">{r.client_name}</div>
                    </div>
                    <div className={`text-xs ${r.days_until_expiry <= 3 ? "text-amber-700 font-medium" : "text-ink-600"}`}>
                      Vence en {Math.max(0, Math.floor(r.days_until_expiry))}d
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Últimas ventas" subtitle={`${completedSales.length} ventas firmadas en total`}>
            {completedSales.length === 0 ? (
              <div className="text-sm text-ink-600 py-6 text-center">Tu primera venta está cerca 💪</div>
            ) : (
              <div className="space-y-2">
                {completedSales.slice(0, 6).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 rounded-md bg-ink-100/50 text-sm">
                    <div>
                      <div className="font-medium">{s.block_code} · Lote {s.lot_number}</div>
                      <div className="text-xs text-ink-600">{s.client_name} · {getPlan(s.payment_plan as never).short}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-brand-700">+{formatUSD(s.seller_commission_amt)}</div>
                      <div className="text-[10px] text-ink-600">{formatUSD(s.total_price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Detalle de mis ventas" subtitle="Todas las operaciones registradas a tu nombre">
          {sales.length === 0 ? (
            <div className="text-sm text-ink-600 py-6 text-center">Aún sin ventas registradas</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-ink-600 border-b border-ink-200">
                    <th className="text-left py-2 px-2 font-medium">Lote</th>
                    <th className="text-left py-2 px-2 font-medium">Cliente</th>
                    <th className="text-left py-2 px-2 font-medium">Plan</th>
                    <th className="text-right py-2 px-2 font-medium">Total</th>
                    <th className="text-right py-2 px-2 font-medium">Mi comisión</th>
                    <th className="text-center py-2 px-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(s => (
                    <tr key={s.id} className="border-b border-ink-100 hover:bg-ink-100/30">
                      <td className="py-2.5 px-2 font-medium">{s.block_code} · {s.lot_number}</td>
                      <td className="py-2.5 px-2">{s.client_name}</td>
                      <td className="py-2.5 px-2 text-xs text-ink-600">{getPlan(s.payment_plan as never).short}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums">{formatUSD(s.total_price)}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-brand-700 font-medium">{formatUSD(s.seller_commission_amt)}</td>
                      <td className="py-2.5 px-2 text-center"><StatusPill status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </main>
    </div>
  );
}
