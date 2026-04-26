"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Building2, Calendar, Users, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import { MetricCard, SectionCard, StatusPill, LotsDonut, SalesBarChart } from "@/components/Metrics";
import { createClient } from "@/lib/supabase-client";
import { useProfile } from "@/lib/use-profile";
import { formatUSD, getPlan } from "@/lib/payment-plans";

interface Kpis {
  total_lots: number; available_lots: number; reserved_lots: number; sold_lots: number;
  active_reservations: number; expiring_soon: number;
  total_revenue: number; total_commission: number;
  company_commission: number; sellers_commission: number;
}

interface SellerPerf {
  seller_id: string; seller_name: string; email: string; role: string;
  sales_count: number; total_sold: number; seller_commission: number;
  company_commission_generated: number; active_reservations: number;
  cash_sales: number; financed_sales: number;
}

interface SaleRow {
  id: string; block_code: string; lot_number: number; client_name: string;
  seller_name: string; payment_plan: string; total_price: number;
  total_commission_amt: number; status: string; signed_at: string | null; created_at: string;
}

interface ReservationRow {
  id: string; block_code: string; lot_number: number; client_name: string;
  seller_name: string; expires_at: string; days_until_expiry: number;
}

interface MonthSale {
  month: string; sales_count: number; revenue: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: profileLoading } = useProfile();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [sellers, setSellers] = useState<SellerPerf[]>([]);
  const [recentSales, setRecentSales] = useState<SaleRow[]>([]);
  const [expiringRes, setExpiringRes] = useState<ReservationRow[]>([]);
  const [monthly, setMonthly] = useState<MonthSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileLoading && profile && profile.role !== "admin" && profile.role !== "manager") {
      router.replace("/dashboard");
    }
  }, [profile, profileLoading, router]);

  const fetchData = useCallback(async () => {
    const [kpiRes, sellersRes, salesRes, resRes, monthlyRes] = await Promise.all([
      supabase.from("v_admin_kpis").select("*").single(),
      supabase.from("v_sellers_performance").select("*").order("total_sold", { ascending: false }),
      supabase.from("sales_full").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("reservations_full").select("*").eq("status", "active").lte("days_until_expiry", 3).order("expires_at", { ascending: true }),
      supabase.from("v_sales_by_month").select("*").limit(6),
    ]);
    if (kpiRes.data) setKpis(kpiRes.data as Kpis);
    if (sellersRes.data) setSellers(sellersRes.data as SellerPerf[]);
    if (salesRes.data) setRecentSales(salesRes.data as SaleRow[]);
    if (resRes.data) setExpiringRes(resRes.data as ReservationRow[]);
    if (monthlyRes.data) setMonthly((monthlyRes.data as MonthSale[]).reverse());
    setLoading(false);
  }, [supabase]);

  useEffect(() => { if (profile?.role === "admin" || profile?.role === "manager") fetchData(); }, [fetchData, profile]);

  if (profileLoading || !profile) {
    return (
      <div className="min-h-screen bg-ink-100/40">
        <Header />
        <main className="max-w-7xl mx-auto p-6 text-ink-600">Verificando acceso…</main>
      </div>
    );
  }

  if (profile.role !== "admin" && profile.role !== "manager") {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-100/40">
        <Header userName={profile.full_name} role={profile.role} />
        <main className="max-w-7xl mx-auto p-6 text-ink-600">Cargando dashboard…</main>
      </div>
    );
  }

  const monthlyChartData = monthly.map(m => ({
    month: new Date(m.month).toLocaleDateString("es-AR", { month: "short" }),
    revenue: Number(m.revenue),
  }));

  return (
    <div className="min-h-screen bg-ink-100/40">
      <Header userName={profile.full_name} role={profile.role} />
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-5">
          <h1 className="text-xl font-medium">Panel administrador</h1>
          <p className="text-sm text-ink-600 mt-1">Métricas globales del proyecto Nuevo San Vicente</p>
        </div>

        {kpis && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <MetricCard label="Total recaudado" value={formatUSD(kpis.total_revenue)} delta={`${kpis.sold_lots} ventas firmadas`} deltaTone="good" icon={<DollarSign size={14} />} />
            <MetricCard label="Avance del proyecto" value={`${kpis.sold_lots} / ${kpis.total_lots}`} delta={`${((kpis.sold_lots / Math.max(kpis.total_lots, 1)) * 100).toFixed(1)}% vendido`} icon={<Building2 size={14} />} />
            <MetricCard label="Reservas activas" value={kpis.active_reservations} delta={kpis.expiring_soon > 0 ? `${kpis.expiring_soon} vencen pronto` : "Todo al día"} deltaTone={kpis.expiring_soon > 0 ? "warn" : "good"} icon={<Calendar size={14} />} />
            <MetricCard label="Comisiones a pagar" value={formatUSD(kpis.sellers_commission)} delta={`${sellers.filter(s => s.sales_count > 0).length} vendedores activos`} icon={<Users size={14} />} />
          </div>
        )}

        {expiringRes.length > 0 && (
          <div className="mb-5 bg-amber-50 border-l-4 border-status-reserved rounded-r-md p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-700 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-amber-800">{expiringRes.length} reservas vencen en los próximos 3 días</div>
                <div className="text-xs text-ink-600 mt-1 space-x-2">
                  {expiringRes.slice(0, 5).map(r => (
                    <span key={r.id}>{r.block_code} · L{r.lot_number} ({r.seller_name?.split(" ")[0]})</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <div className="lg:col-span-2">
            <SectionCard title="Ventas por mes" subtitle="USD recaudado · últimos 6 meses">
              <SalesBarChart data={monthlyChartData} />
            </SectionCard>
          </div>
          {kpis && (
            <SectionCard title="Estado de lotes" subtitle={`${kpis.total_lots} lotes en total`}>
              <LotsDonut available={kpis.available_lots} reserved={kpis.reserved_lots} sold={kpis.sold_lots} />
            </SectionCard>
          )}
        </div>

        {kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="bg-ink-900 text-white rounded-md p-4">
              <div className="text-[10px] uppercase tracking-wider text-ink-200 font-medium">Comisión total cobrada</div>
              <div className="text-xl font-medium mt-1.5">{formatUSD(kpis.total_commission)}</div>
              <div className="text-[11px] mt-1 text-ink-200">6% sobre las ventas firmadas</div>
            </div>
            <div className="bg-brand-600 text-white rounded-md p-4">
              <div className="text-[10px] uppercase tracking-wider text-brand-100 font-medium">Utilidad Cristal (3%)</div>
              <div className="text-xl font-medium mt-1.5">{formatUSD(kpis.company_commission)}</div>
              <div className="text-[11px] mt-1 text-brand-50/90">Lo que retiene la empresa</div>
            </div>
            <div className="bg-white border border-ink-200 rounded-md p-4">
              <div className="text-[10px] uppercase tracking-wider text-ink-600 font-medium">Pago a vendedores (3%)</div>
              <div className="text-xl font-medium mt-1.5 text-ink-900">{formatUSD(kpis.sellers_commission)}</div>
              <div className="text-[11px] mt-1 text-ink-600">A distribuir entre vendedores</div>
            </div>
          </div>
        )}

        <SectionCard title="Performance de vendedores" subtitle="Resumen acumulado del equipo">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-ink-600 border-b border-ink-200">
                  <th className="text-left py-2 px-2 font-medium">Vendedor</th>
                  <th className="text-center py-2 px-2 font-medium">Reservas</th>
                  <th className="text-center py-2 px-2 font-medium">Ventas</th>
                  <th className="text-center py-2 px-2 font-medium">Mix C/F</th>
                  <th className="text-right py-2 px-2 font-medium">Total vendido</th>
                  <th className="text-right py-2 px-2 font-medium">Comisión</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map(s => (
                  <tr key={s.seller_id} className="border-b border-ink-100 hover:bg-ink-100/30">
                    <td className="py-2.5 px-2 font-medium">
                      {s.seller_name}
                      {s.role !== "seller" && <span className="ml-2 text-[10px] text-ink-600 capitalize">({s.role})</span>}
                    </td>
                    <td className="py-2.5 px-2 text-center tabular-nums">{s.active_reservations}</td>
                    <td className="py-2.5 px-2 text-center tabular-nums">{s.sales_count}</td>
                    <td className="py-2.5 px-2 text-center text-xs text-ink-600">{s.cash_sales}/{s.financed_sales}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums">{formatUSD(s.total_sold)}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-brand-700 font-medium">{formatUSD(s.seller_commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="mt-5">
          <SectionCard title="Últimas operaciones" subtitle="Ventas más recientes del equipo">
            {recentSales.length === 0 ? (
              <div className="text-sm text-ink-600 py-6 text-center">Aún sin ventas registradas</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-ink-600 border-b border-ink-200">
                      <th className="text-left py-2 px-2 font-medium">Lote</th>
                      <th className="text-left py-2 px-2 font-medium">Cliente</th>
                      <th className="text-left py-2 px-2 font-medium">Vendedor</th>
                      <th className="text-left py-2 px-2 font-medium">Plan</th>
                      <th className="text-right py-2 px-2 font-medium">Total</th>
                      <th className="text-right py-2 px-2 font-medium">Comisión</th>
                      <th className="text-center py-2 px-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map(s => (
                      <tr key={s.id} className="border-b border-ink-100 hover:bg-ink-100/30">
                        <td className="py-2.5 px-2 font-medium">{s.block_code} · {s.lot_number}</td>
                        <td className="py-2.5 px-2">{s.client_name}</td>
                        <td className="py-2.5 px-2 text-xs">{s.seller_name}</td>
                        <td className="py-2.5 px-2 text-xs text-ink-600">{getPlan(s.payment_plan as never).short}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums">{formatUSD(s.total_price)}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-brand-700">{formatUSD(s.total_commission_amt)}</td>
                        <td className="py-2.5 px-2 text-center"><StatusPill status={s.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
