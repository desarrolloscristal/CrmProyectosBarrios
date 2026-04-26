import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const {
    status,
    client_name, client_phone, client_document,
    payment_plan, total_price, down_payment, installments_count, installment_amount,
  } = body;

  if (!["disponible", "reservado", "vendido", "bloqueado"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const { error: updErr } = await supabase
    .from("lots")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

  if ((status === "reservado" || status === "vendido") && client_name) {
    let clientId: string | null = null;
    const { data: existing } = await supabase
      .from("clients").select("id").eq("full_name", client_name).limit(1).maybeSingle();
    if (existing) clientId = existing.id;
    else {
      const { data: created } = await supabase
        .from("clients")
        .insert({
          full_name: client_name,
          phone: client_phone || null,
          document_id: client_document || null,
          created_by: user.id,
        })
        .select("id").single();
      clientId = created?.id || null;
    }

    if (clientId) {
      if (status === "reservado") {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("reservations").insert({
          lot_id: params.id, client_id: clientId, seller_id: user.id,
          status: "active", expires_at: expiresAt,
        });
      } else if (status === "vendido") {
        const tp = Number(total_price) || 0;
        await supabase.from("sales").insert({
          lot_id: params.id, client_id: clientId, seller_id: user.id,
          status: "signed",
          payment_plan: payment_plan || "contado",
          total_price: tp,
          final_price: tp,
          down_payment: Number(down_payment) || null,
          installments_count: Number(installments_count) || 0,
          installment_amount: Number(installment_amount) || null,
          signed_at: new Date().toISOString(),
          company_commission_pct: 3,
          seller_commission_pct: 3,
          commission_pct: 6,
        });
      }
    }
  }

  await supabase.from("lot_status_history").insert({
    lot_id: params.id, to_status: status, changed_by: user.id, reason: "manual_update",
  });

  return NextResponse.json({ ok: true });
}
