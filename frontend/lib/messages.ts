/**
 * Messages API — `backend/app/routers/_combined.py::messages_router`.
 */

import { apiFetch } from "./api";
import { authHeader } from "./auth-client";

export interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  property_id: string | null;
  subject: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
}

export async function listMessages(): Promise<MessageRow[]> {
  return apiFetch<MessageRow[]>(`/api/messages`, {
    headers: authHeader(),
    cache: "no-store",
  });
}

export async function markMessageRead(messageId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/messages/${messageId}/read`, {
    method: "PATCH",
    headers: authHeader(),
  });
}
