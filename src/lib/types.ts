import type { LotStatus } from "./blocks";

export interface Lot {
  id: string;
  block_code: string;
  number: number;
  status: LotStatus;
  area_m2: number | null;
  list_price: number | null;
  presale_price: number | null;
  currency: string;
  notes?: string | null;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "seller" | "viewer";
}

export interface Reservation {
  id: string;
  lot_id: string;
  client_name: string;
  client_phone?: string | null;
  client_email?: string | null;
  seller_id: string;
  reserved_at: string;
  expires_at: string;
}
