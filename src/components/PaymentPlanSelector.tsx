"use client";

import { useState, useMemo } from "react";
import { PAYMENT_PLANS, getPlan, calculateCommission, formatUSD, type PaymentPlanCode, type PaymentPlanConfig } from "@/lib/payment-plans";

export interface PaymentPlanSelection {
  code: PaymentPlanCode;
  totalPrice: number;
  downPayment: number;
  installments: number;
  installmentAmount: number;
}

interface Props {
  onChange: (selection: PaymentPlanSelection | null) => void;
  defaultCode?: PaymentPlanCode;
}

export default function PaymentPlanSelector({ onChange, defaultCode = "contado" }: Props) {
  const [selectedCode, setSelectedCode] = useState<PaymentPlanCode>(defaultCode);
  const [customTotal, setCustomTotal] = useState("");
  const [customDown, setCustomDown] = useState("");
  const [customInstallments, setCustomInstallments] = useState("");

  const plan = getPlan(selectedCode);

  const selection = useMemo<PaymentPlanSelection | null>(() => {
    if (plan.isCustom) {
      const total = Number(customTotal) || 0;
      const down = Number(customDown) || 0;
      const inst = Number(customInstallments) || 0;
      if (total <= 0) return null;
      const installmentAmount = inst > 0 ? Math.round(((total - down) / inst) * 100) / 100 : 0;
      return { code: "custom", totalPrice: total, downPayment: down, installments: inst, installmentAmount };
    }
    return {
      code: plan.code,
      totalPrice: plan.totalPrice,
      downPayment: plan.downPayment,
      installments: plan.installments,
      installmentAmount: plan.installmentAmount,
    };
  }, [plan, customTotal, customDown, customInstallments]);

  const handleSelect = (code: PaymentPlanCode) => {
    setSelectedCode(code);
    const p = getPlan(code);
    if (!p.isCustom) {
      onChange({ code, totalPrice: p.totalPrice, downPayment: p.downPayment, installments: p.installments, installmentAmount: p.installmentAmount });
    } else {
      onChange(selection);
    }
  };

  const updateCustom = (field: "total" | "down" | "inst", value: string) => {
    if (field === "total") setCustomTotal(value);
    if (field === "down") setCustomDown(value);
    if (field === "inst") setCustomInstallments(value);
    setTimeout(() => onChange(selection), 0);
  };

  const commission = selection && selection.totalPrice > 0 ? calculateCommission(selection.totalPrice) : null;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-ink-600 font-medium mb-2">Forma de pago</div>
        <div className="space-y-1.5">
          {PAYMENT_PLANS.map(p => (
            <PlanRow key={p.code} plan={p} selected={selectedCode === p.code} onClick={() => handleSelect(p.code)} />
          ))}
        </div>
      </div>

      {plan.isCustom && (
        <div className="space-y-2 p-3 rounded-md bg-ink-100/50 border border-ink-200">
          <div className="text-[11px] text-ink-600 font-medium">Plan a medida</div>
          <input
            type="number"
            value={customTotal}
            onChange={e => updateCustom("total", e.target.value)}
            placeholder="Precio total (USD)"
            className="w-full px-3 py-2 border border-ink-200 rounded-md text-sm bg-white focus:outline-none focus:border-brand-600"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={customDown}
              onChange={e => updateCustom("down", e.target.value)}
              placeholder="Anticipo (USD)"
              className="px-3 py-2 border border-ink-200 rounded-md text-sm bg-white focus:outline-none focus:border-brand-600"
            />
            <input
              type="number"
              value={customInstallments}
              onChange={e => updateCustom("inst", e.target.value)}
              placeholder="Cuotas"
              className="px-3 py-2 border border-ink-200 rounded-md text-sm bg-white focus:outline-none focus:border-brand-600"
            />
          </div>
        </div>
      )}

      {selection && selection.totalPrice > 0 && (
        <div className="rounded-md bg-ink-100/50 p-3 space-y-1 text-sm">
          <Row label="Anticipo" value={formatUSD(selection.downPayment)} />
          {selection.installments > 0 && (
            <>
              <Row label="Cuotas" value={`${selection.installments} × ${formatUSD(selection.installmentAmount)}`} />
              <Row label="Saldo a financiar" value={formatUSD(selection.totalPrice - selection.downPayment)} />
            </>
          )}
          <div className="border-t border-ink-200 pt-1 mt-1">
            <Row label="Total a pagar" value={formatUSD(selection.totalPrice)} highlight />
          </div>
        </div>
      )}

      {commission && (
        <div className="rounded-md bg-status-reserved-bg/30 border border-status-reserved/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-amber-800 font-medium mb-2">Comisiones (6% sobre {formatUSD(selection!.totalPrice)})</div>
          <div className="space-y-1 text-sm">
            <Row label="Total" value={formatUSD(commission.totalAmount)} />
            <Row label="Cristal (3%)" value={formatUSD(commission.companyAmount)} />
            <Row label="Tu comisión (3%)" value={formatUSD(commission.sellerAmount)} bold green />
          </div>
        </div>
      )}
    </div>
  );
}

function PlanRow({ plan, selected, onClick }: { plan: PaymentPlanConfig; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-md border text-left transition-colors ${
        selected ? "border-brand-600 bg-brand-50/60 border-[1.5px]" : "border-ink-200 bg-white hover:bg-ink-100/30"
      }`}
    >
      <div className={`w-3.5 h-3.5 rounded-full border-[1.5px] flex-shrink-0 relative ${selected ? "border-brand-600" : "border-ink-400"}`}>
        {selected && <div className="absolute top-[3px] left-[3px] w-1.5 h-1.5 rounded-full bg-brand-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink-900">{plan.name}</div>
        <div className="text-[11px] text-ink-600">{plan.detail}</div>
      </div>
      <div className="text-xs font-medium text-brand-600 whitespace-nowrap">
        {plan.isCustom ? "Custom" : formatUSD(plan.totalPrice)}
      </div>
    </button>
  );
}

function Row({ label, value, highlight = false, bold = false, green = false }: { label: string; value: string; highlight?: boolean; bold?: boolean; green?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-ink-600 ${highlight ? "font-medium text-ink-900" : ""}`}>{label}</span>
      <span className={`${highlight ? "font-medium text-brand-700" : ""} ${bold ? "font-medium" : ""} ${green ? "text-brand-700" : "text-ink-900"}`}>{value}</span>
    </div>
  );
}
