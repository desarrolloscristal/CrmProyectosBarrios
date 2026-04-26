"use client";

import { useState } from "react";
import { X, Ruler, Tag, Sparkles } from "lucide-react";
import type { Lot } from "@/lib/types";
import type { LotStatus } from "@/lib/blocks";

interface Props {
  lot: Lot | null;
  onClose: () => void;
  onChangeStatus: (lotId: string, status: LotStatus, extra?: { client_name?: string; client_phone?: string; final_price?: number }) => Promise<void>;
  canEdit: boolean;
}

export default function LotDetail({ lot, onClose, onChangeStatus, canEdit }: Props) {
  const [working, setWorking] = useState<LotStatus | null>(null);
  const [showForm, setShowForm] = useState<LotStatus | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [finalPrice, setFinalPrice] = useState<string>("");

  if (!lot) {
    return (
      <div className="bg-white border border-ink-200 rounded-lg p-5 text-center text-ink-600 text-sm">
        Seleccioná un lote en el masterplan para ver sus detalles.
      </div>
    );
  }

  const submit = async (newStatus: LotStatus) => {
    setWorking(newStatus);
    try {
      const extra: any = {};
      if (newStatus === "reservado" || newStatus === "vendido") {
        if (!clientName.trim()) { alert("Ingresá el nombre del cliente"); setWorking(null); return; }
        extra.client_name = clientName.trim();
        extra.client_phone = clientPhone.trim() || undefined;
        if (newStatus === "vendido" && finalPrice) extra.final_price = Number(finalPrice);
      }
      await onChangeStatus(lot.id, newStatus, extra);
      setShowForm(null);
      setClientName(""); setClientPhone(""); setFinalPrice("");
    } catch (e: any) {
      alert("Error: " + (e?.message || "no se pudo actualizar"));
    } finally {
      setWorking(null);
    }
  };

  const statusBadge: Record<LotStatus, { bg: string; fg: string; label: string }> = {
    disponible: { bg: "#EAF3DE", fg: "#3B6D11", label: "Disponible" },
    reservado:  { bg: "#FAC775", fg: "#854F0B", label: "Reservado" },
    vendido:    { bg: "#F09595", fg: "#791F1F", label: "Vendido" },
    bloqueado:  { bg: "#D3D1C7", fg: "#444441", label: "Bloqueado" },
  };
  const sb = statusBadge[lot.status];

  return (
    <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-ink-100">
        <div>
          <div className="text-xs text-ink-600">{lot.block_code}</div>
          <div className="text-lg font-medium">Lote {lot.number}</div>
        </div>
        <button onClick={onClose} className="text-ink-600 hover:text-ink-900 p-1"><X size={18} /></button>
      </div>

      <div className="p-4 space-y-3">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-medium" style={{ background: sb.bg, color: sb.fg }}>
          {sb.label}
        </div>

        <div className="flex items-center gap-2 text-sm text-ink-600">
          <Ruler size={14} className="text-ink-400" />
          <span>Superficie: <span className="text-ink-900 font-medium">{lot.area_m2 ? `${lot.area_m2} m²` : "—"}</span></span>
        </div>

        {(lot.list_price || lot.presale_price) && (
          <div className="space-y-2 pt-1">
            {lot.presale_price && (
              <div className="rounded-md p-3 bg-brand-50 border border-brand-400/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] px-2 py-0.5 rounded-bl-md flex items-center gap-1">
                  <Sparkles size={10} /> PRE-VENTA
                </div>
                <div className="text-[11px] text-brand-700 uppercase tracking-wide font-medium">Precio promocional</div>
                <div className="text-2xl font-medium text-brand-900 mt-0.5">
                  {lot.currency} {Number(lot.presale_price).toLocaleString("es-AR")}
                </div>
              </div>
            )}
            {lot.list_price && (
              <div className="flex items-center justify-between text-sm px-1">
                <div className="flex items-center gap-1.5 text-ink-600">
                  <Tag size={12} className="text-ink-400" />
                  <span>Precio de lista</span>
                </div>
                <div className={lot.presale_price ? "text-ink-600 line-through" : "text-ink-900 font-medium"}>
                  {lot.currency} {Number(lot.list_price).toLocaleString("es-AR")}
                </div>
              </div>
            )}
            {lot.list_price && lot.presale_price && (
              <div className="text-[11px] text-brand-700 px-1">
                Ahorro: {lot.currency} {(Number(lot.list_price) - Number(lot.presale_price)).toLocaleString("es-AR")}
                <span className="text-ink-600"> ({Math.round((1 - Number(lot.presale_price)/Number(lot.list_price)) * 100)}% off)</span>
              </div>
            )}
          </div>
        )}

        {canEdit && !showForm && (
          <div className="pt-3 border-t border-ink-100 flex gap-2 flex-wrap">
            {lot.status !== "reservado" && (
              <button
                onClick={() => setShowForm("reservado")}
                className="px-3 py-1.5 rounded-md text-sm bg-status-reserved text-white hover:opacity-90"
              >Reservar</button>
            )}
            {lot.status !== "vendido" && (
              <button
                onClick={() => setShowForm("vendido")}
                className="px-3 py-1.5 rounded-md text-sm bg-status-sold text-white hover:opacity-90"
              >Marcar vendido</button>
            )}
            {lot.status !== "disponible" && (
              <button
                onClick={() => submit("disponible")}
                disabled={working !== null}
                className="px-3 py-1.5 rounded-md text-sm border border-ink-200 hover:bg-ink-100"
              >Liberar</button>
            )}
          </div>
        )}

        {canEdit && showForm && (
          <div className="pt-3 border-t border-ink-100 space-y-2">
            <div className="text-xs text-ink-600">
              Datos del cliente para {showForm === "reservado" ? "reservar" : "marcar como vendido"}
            </div>
            <input
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Nombre completo del cliente"
              className="w-full px-3 py-2 border border-ink-200 rounded-md text-sm focus:outline-none focus:border-brand-600"
            />
            <input
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              placeholder="Teléfono (opcional)"
              className="w-full px-3 py-2 border border-ink-200 rounded-md text-sm focus:outline-none focus:border-brand-600"
            />
            {showForm === "vendido" && (
              <input
                type="number"
                value={finalPrice}
                onChange={e => setFinalPrice(e.target.value)}
                placeholder={lot.presale_price ? `Sugerido: ${lot.presale_price} (pre-venta)` : `Precio final en ${lot.currency}`}
                className="w-full px-3 py-2 border border-ink-200 rounded-md text-sm focus:outline-none focus:border-brand-600"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => submit(showForm)}
                disabled={working !== null}
                className={`flex-1 px-3 py-2 rounded-md text-sm text-white ${showForm === "reservado" ? "bg-status-reserved" : "bg-status-sold"} hover:opacity-90`}
              >{working ? "Guardando…" : "Confirmar"}</button>
              <button
                onClick={() => setShowForm(null)}
                className="px-3 py-2 rounded-md text-sm border border-ink-200 hover:bg-ink-100"
              >Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
