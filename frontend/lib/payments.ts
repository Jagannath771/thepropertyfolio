/**
 * Typed fetchers for the Payments API.
 * Backend: `backend/app/routers/_combined.py::payments_router`.
 */

import { apiFetch } from "./api";
import { authHeader } from "./auth-client";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: string;
  tenant_id: string;
  property_id: string | null;
  amount: number;
  payment_type: string;
  payment_method: string | null;
  stripe_payment_id: string | null;
  status: PaymentStatus | string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

export async function listPayments(): Promise<Payment[]> {
  return apiFetch<Payment[]>(`/api/payments`, {
    headers: authHeader(),
    cache: "no-store",
  });
}

export interface PaymentIntentResponse {
  payment_id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export async function createPaymentIntent(input: {
  property_id: string;
  amount: number;
  payment_type?: string;
}): Promise<PaymentIntentResponse> {
  return apiFetch<PaymentIntentResponse>(`/api/payments/intent`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ payment_type: "rent", ...input }),
  });
}
