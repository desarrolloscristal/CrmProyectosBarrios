export type PaymentPlanCode = "contado" | "plan_a" | "plan_b" | "plan_c" | "custom";

export interface PaymentPlanConfig {
  code: PaymentPlanCode;
  name: string;
  short: string;
  detail: string;
  totalPrice: number;
  downPayment: number;
  installments: number;
  installmentAmount: number;
  isCustom?: boolean;
}

/**
 * Planes fijos de Cristal Comercializa - Nuevo San Vicente
 * Comisión total = 6% sobre totalPrice (3% Cristal + 3% Vendedor)
 */
export const PAYMENT_PLANS: PaymentPlanConfig[] = [
  {
    code: "contado",
    name: "Contado",
    short: "Contado · pre-venta",
    detail: "Pago único",
    totalPrice: 13500,
    downPayment: 13500,
    installments: 0,
    installmentAmount: 0,
  },
  {
    code: "plan_a",
    name: "Plan A · Anticipo bajo",
    short: "Plan A",
    detail: "USD 5.000 + 70 cuotas de USD 250",
    totalPrice: 22500,
    downPayment: 5000,
    installments: 70,
    installmentAmount: 250,
  },
  {
    code: "plan_b",
    name: "Plan B · Anticipo mínimo",
    short: "Plan B",
    detail: "USD 3.300 + 70 cuotas de USD 300",
    totalPrice: 24300,
    downPayment: 3300,
    installments: 70,
    installmentAmount: 300,
  },
  {
    code: "plan_c",
    name: "Plan C · 50% + 12 cuotas",
    short: "Plan C",
    detail: "50% anticipo + 12 cuotas sin interés",
    totalPrice: 13500,
    downPayment: 6750,
    installments: 12,
    installmentAmount: 562.5,
  },
  {
    code: "custom",
    name: "Plan a medida",
    short: "Custom",
    detail: "Anticipo y cuotas personalizados",
    totalPrice: 0,
    downPayment: 0,
    installments: 0,
    installmentAmount: 0,
    isCustom: true,
  },
];

export function getPlan(code: PaymentPlanCode): PaymentPlanConfig {
  return PAYMENT_PLANS.find(p => p.code === code) || PAYMENT_PLANS[0];
}

export interface CommissionBreakdown {
  totalPct: number;
  totalAmount: number;
  companyPct: number;
  companyAmount: number;
  sellerPct: number;
  sellerAmount: number;
}

export const TOTAL_COMMISSION_PCT = 6;
export const COMPANY_COMMISSION_PCT = 3;
export const SELLER_COMMISSION_PCT = 3;

export function calculateCommission(totalPrice: number): CommissionBreakdown {
  const total = totalPrice * (TOTAL_COMMISSION_PCT / 100);
  const company = totalPrice * (COMPANY_COMMISSION_PCT / 100);
  const seller = totalPrice * (SELLER_COMMISSION_PCT / 100);
  return {
    totalPct: TOTAL_COMMISSION_PCT,
    totalAmount: Math.round(total * 100) / 100,
    companyPct: COMPANY_COMMISSION_PCT,
    companyAmount: Math.round(company * 100) / 100,
    sellerPct: SELLER_COMMISSION_PCT,
    sellerAmount: Math.round(seller * 100) / 100,
  };
}

export function formatUSD(n: number | null | undefined): string {
  if (n == null) return "—";
  return "USD " + Number(n).toLocaleString("es-AR", { maximumFractionDigits: 2 });
}
