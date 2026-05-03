/**
 * Owner financials endpoint — monthly revenue, YTD, recent transactions.
 * Backend: `backend/app/routers/owners.py::get_owner_financials`.
 */

import { apiFetch } from "./api";
import { authHeader } from "./auth-client";

export interface RevenuePoint {
  month: string; // "YYYY-MM"
  revenue: number;
}

export interface RecentTransaction {
  id: string;
  property_id: string | null;
  amount: number;
  payment_type: string;
  paid_at: string | null;
  created_at: string;
}

export interface OwnerFinancials {
  revenue_series: RevenuePoint[];
  ytd_revenue: number;
  previous_ytd_revenue: number;
  ytd_change_pct: number | null;
  ytd_expenses: number;
  ytd_net_income: number;
  expenses_feature: "released" | "unreleased" | string;
  recent_transactions: RecentTransaction[];
}

export async function getOwnerFinancials(
  months = 12,
): Promise<OwnerFinancials> {
  return apiFetch<OwnerFinancials>(`/api/owners/financials?months=${months}`, {
    headers: authHeader(),
    cache: "no-store",
  });
}

export interface OwnerPortfolio {
  total_units: number;
  occupied_units: number;
  occupancy_rate: number;
  monthly_revenue: number;
  open_maintenance_tickets: number;
  available_units: number;
  units_added_this_year: number;
  revenue_last_30d: number;
  revenue_prev_30d: number;
  revenue_change_pct: number | null;
}

export async function getOwnerPortfolio(): Promise<OwnerPortfolio> {
  return apiFetch<OwnerPortfolio>(`/api/owners/portfolio`, {
    headers: authHeader(),
    cache: "no-store",
  });
}

export interface OwnerProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  is_verified: boolean;
  totp_enabled: boolean;
  created_at: string;
}

export async function getOwnerProfile(): Promise<OwnerProfile> {
  return apiFetch<OwnerProfile>(`/api/owners/me`, {
    headers: authHeader(),
    cache: "no-store",
  });
}
