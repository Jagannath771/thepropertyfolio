"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Wrench,
  FolderOpen,
  MessageSquare,
  Settings,
  Home,
  DollarSign,
  ChevronRight,
  Bell,
  Menu,
  Loader2,
  CheckCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

import {
  getApplicationsStreamUrl,
  listApplications,
  type Application,
} from "@/lib/applications";
import { listMessages, markMessageRead, type MessageRow } from "@/lib/messages";
import { listMaintenance, submitMaintenance, type MaintenanceRequest } from "@/lib/maintenance";
import {
  createPaymentIntent,
  listPayments,
  type Payment,
} from "@/lib/payments";
import { getPropertyClient } from "@/lib/properties";
import type { Property } from "@/lib/types";
import { listTenantDocuments, type TenantDocumentItem } from "@/lib/tenant-documents";
import { getTenantProfile, type TenantProfile } from "@/lib/tenant-profile";

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  under_review: "Under review",
  background_check: "Background check",
  approved: "Approved",
  denied: "Denied",
  withdrawn: "Withdrawn",
};

function OverviewTab({
  profile,
  lease,
  payments,
  maintenance,
  loading,
}: {
  profile: TenantProfile | null;
  lease: Property | null;
  payments: Payment[];
  maintenance: MaintenanceRequest[];
  loading: boolean;
}) {
  const openMaint = maintenance.filter((m) => m.status !== "resolved" && m.status !== "closed").length;
  const lastPaid = payments.find((p) => p.status === "completed" && p.paid_at);
  const nextDue = payments.find((p) => p.status === "pending" && p.due_date);

  return (
    <div className="space-y-6" data-testid="tenant-overview-tab">
      <h2
        className="text-2xl font-bold text-foreground"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin inline mr-2" />
        ) : (
          `Welcome back, ${profile?.full_name?.split(" ")[0] || "there"}!`
        )}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Home,
            label: "Current lease",
            value: lease
              ? `${lease.address}, ${lease.city}`
              : "No approved lease on file yet",
            color: "#6366F1",
            bg: "rgba(99,102,241,0.1)",
          },
          {
            icon: DollarSign,
            label: "Rent",
            value: nextDue
              ? `${formatCurrency(nextDue.amount)} due ${formatDate(nextDue.due_date)}`
              : lastPaid
                ? `Last paid ${formatCurrency(lastPaid.amount)} on ${formatDate(lastPaid.paid_at)}`
                : "No payment schedule yet",
            color: "#10B981",
            bg: "rgba(16,185,129,0.1)",
          },
          {
            icon: Wrench,
            label: "Maintenance",
            value:
              openMaint === 0
                ? "No open requests"
                : `${openMaint} open request${openMaint === 1 ? "" : "s"}`,
            color: "#F59E0B",
            bg: "rgba(245,158,11,0.1)",
          },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="glass-card p-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: bg }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-xs text-foreground-muted mb-1">{label}</p>
            <p className="text-sm font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Quick actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Pay rent", tab: "payments" as const, icon: CreditCard, color: "#6366F1" },
            { label: "Submit maintenance", tab: "maintenance" as const, icon: Wrench, color: "#F59E0B" },
            { label: "My application", tab: "application" as const, icon: FileText, color: "#10B981" },
            { label: "Messages", tab: "messages" as const, icon: MessageSquare, color: "#8B5CF6" },
          ].map(({ label, tab, icon: Icon, color }) => (
            <button
              key={label}
              type="button"
              className="flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-foreground-secondary hover:bg-white/5 transition-all text-left"
              data-testid={`tenant-quick-${tab}`}
              onClick={() => {
                window.dispatchEvent(new CustomEvent("tenant-tab", { detail: tab }));
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              {label}
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApplicationTab({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return (
      <div className="space-y-6" data-testid="tenant-application-tab">
        <h2
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          My application
        </h2>
        <div className="glass-card p-12 text-center">
          <FileText className="w-12 h-12 text-foreground-muted mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground mb-2">No applications yet</h3>
          <p className="text-foreground-secondary max-w-sm mx-auto">
            You haven&apos;t submitted any rental applications. Browse listings to apply.
          </p>
          <Link href="/availability" className="btn-primary mt-6 inline-flex">
            Browse properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tenant-application-tab">
      <h2
        className="text-2xl font-bold text-foreground"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        My applications
      </h2>
      <div className="space-y-3">
        {applications.map((app) => (
          <div
            key={app.id}
            className="glass-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            data-testid="tenant-application-row"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                Application · {formatDate(app.submitted_at || app.created_at)}
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                {app.property_id ? (
                  <Link
                    href={`/availability/${app.property_id}`}
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View property <ExternalLink className="w-3 h-3" />
                  </Link>
                ) : (
                  "Property TBD"
                )}
              </p>
            </div>
            <span
              className={
                app.status === "approved"
                  ? "badge-available"
                  : app.status === "denied"
                    ? "badge-coming-soon"
                    : "px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-foreground-secondary"
              }
            >
              {STATUS_LABEL[app.status] ?? app.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentsTab({
  payments,
  payDisabledReason,
  onPayRent,
  paying,
}: {
  payments: Payment[];
  payDisabledReason: string | null;
  onPayRent: () => Promise<void>;
  paying: boolean;
}) {
  const completed = payments.filter((p) => p.status === "completed");
  const pending = payments.filter((p) => p.status === "pending");
  const balance = pending.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6" data-testid="tenant-payments-tab">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Payments & billing
        </h2>
        <button
          type="button"
          className="btn-primary py-2 px-4 text-sm font-semibold disabled:opacity-50"
          disabled={!!payDisabledReason || paying}
          title={payDisabledReason ?? undefined}
          data-testid="tenant-pay-rent"
          onClick={() => void onPayRent()}
        >
          {paying ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Pay rent (test)"}
        </button>
      </div>
      {payDisabledReason && (
        <p className="text-sm text-foreground-muted">{payDisabledReason}</p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(balance)}</p>
          <p className="text-xs text-foreground-muted mt-2">
            {pending.length ? `${pending.length} pending` : "No pending charges"}
          </p>
        </div>
        <div className="glass-card p-6">
          <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">Completed payments</p>
          <p className="text-3xl font-bold text-foreground">{completed.length}</p>
          <p className="text-xs text-foreground-muted mt-2">Recorded in your ledger</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-4">History</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-foreground-muted text-center py-8">No payments yet.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">{p.payment_type}</p>
                  <p className="text-xs text-foreground-muted">{formatDate(p.paid_at || p.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-success capitalize">{p.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MaintenanceTab({
  items,
  propertyOptions,
  onSubmitted,
}: {
  items: MaintenanceRequest[];
  propertyOptions: { id: string; label: string }[];
  onSubmitted: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    property_id: propertyOptions[0]?.id ?? "",
    category: "",
    description: "",
    urgency: "medium",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!form.property_id && propertyOptions[0]) {
      setForm((f) => ({ ...f, property_id: propertyOptions[0].id }));
    }
  }, [propertyOptions, form.property_id]);

  return (
    <div className="space-y-6" data-testid="tenant-maintenance-tab">
      <h2
        className="text-2xl font-bold text-foreground"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Maintenance
      </h2>

      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-5">New request</h3>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.description.trim()) return;
            setSaving(true);
            try {
              await submitMaintenance({
                property_id: form.property_id || null,
                category: form.category || null,
                description: form.description,
                urgency: form.urgency as "low" | "medium" | "high" | "emergency",
              });
              toast.success("Request submitted");
              setForm((f) => ({ ...f, description: "", category: "" }));
              await onSubmitted();
            } catch (err) {
              toast.error((err as Error).message || "Could not submit");
            } finally {
              setSaving(false);
            }
          }}
        >
          {propertyOptions.length > 0 && (
            <div>
              <label className="text-sm text-foreground-secondary block mb-2">Property</label>
              <select
                className="input-glass w-full"
                value={form.property_id}
                onChange={(e) => setForm((f) => ({ ...f, property_id: e.target.value }))}
              >
                {propertyOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-foreground-secondary block mb-2">Category</label>
              <select
                className="input-glass w-full"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                required
              >
                <option value="">Select…</option>
                {["Plumbing", "Electrical", "HVAC", "Appliances", "Structural", "Pest Control", "Other"].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className="text-sm text-foreground-secondary block mb-2">Urgency</label>
              <select
                className="input-glass w-full"
                value={form.urgency}
                onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-foreground-secondary block mb-2">Description</label>
            <textarea
              className="input-glass w-full min-h-[100px] resize-none"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn-primary py-2.5" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Submit request"}
          </button>
        </form>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Your requests</h3>
        {items.length === 0 ? (
          <p className="text-sm text-foreground-muted text-center py-6">No requests yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
                data-testid="tenant-maintenance-row"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{m.category || "General"}</p>
                  <p className="text-xs text-foreground-muted line-clamp-2">{m.description}</p>
                  <p className="text-xs text-foreground-muted mt-1">{formatDate(m.created_at)}</p>
                </div>
                <span
                  className={
                    m.status === "resolved" || m.status === "closed"
                      ? "badge-available"
                      : "badge-coming-soon"
                  }
                >
                  {String(m.status).replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentsTab({ docs }: { docs: TenantDocumentItem[] }) {
  return (
    <div className="space-y-6" data-testid="tenant-documents-tab">
      <h2
        className="text-2xl font-bold text-foreground"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Documents
      </h2>
      {docs.length === 0 ? (
        <div className="glass-card p-10 text-center text-foreground-muted text-sm">
          No documents uploaded for your account yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {docs.map((doc) => (
            <a
              key={doc.id}
              href={doc.download_url ?? undefined}
              className={`glass-card p-4 flex items-center gap-4 transition-colors group ${
                doc.download_url ? "hover:bg-white/5 cursor-pointer" : "opacity-60 cursor-not-allowed"
              }`}
              onClick={(e) => {
                if (!doc.download_url) e.preventDefault();
              }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                <p className="text-xs text-foreground-muted">
                  {doc.byte_size != null ? `${(doc.byte_size / 1024).toFixed(0)} KB` : "—"} ·{" "}
                  {formatDate(doc.created_at)}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesTab({
  profile,
  messages,
  onRefresh,
}: {
  profile: TenantProfile | null;
  messages: MessageRow[];
  onRefresh: () => Promise<void>;
}) {
  return (
    <div className="space-y-6" data-testid="tenant-messages-tab">
      <h2
        className="text-2xl font-bold text-foreground"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Messages
      </h2>
      <div className="glass-card overflow-hidden">
        {messages.length === 0 ? (
          <p className="text-sm text-foreground-muted text-center py-10">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const incoming = profile && m.recipient_id === profile.id;
            const unread = incoming && !m.is_read;
            return (
              <button
                key={m.id}
                type="button"
                className={`w-full text-left p-4 border-b last:border-0 hover:bg-white/5 transition-colors flex gap-4 ${
                  unread ? "bg-primary/5" : ""
                }`}
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
                data-testid="tenant-message-row"
                onClick={async () => {
                  if (unread) {
                    try {
                      await markMessageRead(m.id);
                      await onRefresh();
                    } catch {
                      /* ignore */
                    }
                  }
                }}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${unread ? "bg-primary" : "bg-transparent"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <p className="text-sm font-bold text-foreground truncate">
                      {incoming ? "From landlord / team" : "Sent by you"}
                    </p>
                    <p className="text-xs text-foreground-muted flex-shrink-0">
                      {formatDate(m.created_at)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-foreground-secondary mb-1 truncate">
                    {m.subject || "(no subject)"}
                  </p>
                  <p className="text-xs text-foreground-muted line-clamp-2">{m.body}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function SettingsTab({ profile }: { profile: TenantProfile | null }) {
  return (
    <div className="space-y-6" data-testid="tenant-settings-tab">
      <h2
        className="text-2xl font-bold text-foreground"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Settings
      </h2>
      <div className="glass-card p-6 space-y-4">
        <div>
          <label className="text-xs text-foreground-muted uppercase block mb-1">Email</label>
          <input
            type="email"
            className="input-glass w-full"
            readOnly
            value={profile?.email ?? ""}
            data-testid="tenant-settings-email"
          />
        </div>
        <div>
          <label className="text-xs text-foreground-muted uppercase block mb-1">Full name</label>
          <input
            type="text"
            className="input-glass w-full"
            readOnly
            value={profile?.full_name ?? ""}
            data-testid="tenant-settings-name"
          />
        </div>
        <p className="text-xs text-foreground-muted pt-2">
          Profile edits are coming soon — contact support to update your details.
        </p>
      </div>
    </div>
  );
}

type TabId = "overview" | "application" | "payments" | "maintenance" | "documents" | "messages" | "settings";

export default function TenantDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [documents, setDocuments] = useState<TenantDocumentItem[]>([]);
  const [lease, setLease] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const refreshAll = useCallback(async () => {
    const [apps, pays, maint, msgs, docs] = await Promise.all([
      listApplications(),
      listPayments(),
      listMaintenance(),
      listMessages(),
      listTenantDocuments().then((r) => r.items),
    ]);
    setApplications(apps);
    setPayments(pays);
    setMaintenance(maint);
    setMessages(msgs);
    setDocuments(docs);
  }, []);

  useEffect(() => {
    const onTab = (e: Event) => {
      const d = (e as CustomEvent<TabId>).detail;
      if (d) setActiveTab(d);
    };
    window.addEventListener("tenant-tab", onTab as EventListener);
    return () => window.removeEventListener("tenant-tab", onTab as EventListener);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const prof = await getTenantProfile();
        if (cancelled) return;
        setProfile(prof);
        await refreshAll();
      } catch (err) {
        if (!cancelled) {
          toast.error((err as Error).message || "Could not load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshAll]);

  const approvedPropertyIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of applications) {
      if (a.status === "approved" && a.property_id) ids.add(a.property_id);
    }
    return Array.from(ids);
  }, [applications]);

  const primaryLeasePropertyId = approvedPropertyIds[0] ?? null;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!primaryLeasePropertyId) {
        setLease(null);
        return;
      }
      const p = await getPropertyClient(primaryLeasePropertyId);
      if (!cancelled) setLease(p);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [primaryLeasePropertyId]);

  useEffect(() => {
    const url = getApplicationsStreamUrl();
    if (!url) return;
    const es = new EventSource(url);
    es.onmessage = (ev) => {
      if (!ev.data || ev.data.startsWith(":")) return;
      try {
        const updated = JSON.parse(ev.data) as Application;
        setApplications((prev) => {
          const i = prev.findIndex((a) => a.id === updated.id);
          if (i === -1) {
            return [updated, ...prev].sort((a, b) =>
              a.created_at < b.created_at ? 1 : -1,
            );
          }
          const next = [...prev];
          next[i] = updated;
          return next;
        });
        if (updated.status === "approved" || updated.status === "denied") {
          toast.message("Application updated", {
            description: `Status is now “${STATUS_LABEL[updated.status] ?? updated.status}”.`,
          });
        }
      } catch {
        /* ignore parse errors */
      }
    };
    es.onerror = () => {
      /* browser will retry; avoid toast spam */
    };
    return () => es.close();
  }, []);

  const propertyOptions = useMemo(() => {
    return approvedPropertyIds.map((id) => ({
      id,
      label: lease && lease.id === id ? lease.address : `Property ${id.slice(0, 8)}…`,
    }));
  }, [approvedPropertyIds, lease]);

  const payDisabledReason = useMemo(() => {
    if (!primaryLeasePropertyId) {
      return "Pay rent unlocks once you have an approved application tied to a property.";
    }
    return null;
  }, [primaryLeasePropertyId]);

  const onPayRent = async () => {
    if (!primaryLeasePropertyId) return;
    const amount =
      lease?.monthly_rent != null ? Number(lease.monthly_rent) : payments[0]?.amount ?? 2400;
    setPaying(true);
    try {
      const intent = await createPaymentIntent({
        property_id: primaryLeasePropertyId,
        amount,
      });
      toast.success("Payment intent created", {
        description: `Ref ${intent.payment_id} — Stripe checkout arrives in a later release.`,
      });
      await refreshAll();
    } catch (err) {
      toast.error((err as Error).message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const pendingAppCount = applications.filter((a) =>
    ["pending", "under_review", "background_check"].includes(a.status),
  ).length;
  const unreadCount = profile
    ? messages.filter((m) => m.recipient_id === profile.id && !m.is_read).length
    : 0;

  const nav = [
    { icon: LayoutDashboard, label: "Overview", id: "overview" as const, badge: undefined },
    { icon: FileText, label: "My application", id: "application" as const, badge: pendingAppCount || undefined },
    { icon: CreditCard, label: "Payments", id: "payments" as const, badge: undefined },
    { icon: Wrench, label: "Maintenance", id: "maintenance" as const, badge: undefined },
    { icon: FolderOpen, label: "Documents", id: "documents" as const, badge: undefined },
    { icon: MessageSquare, label: "Messages", id: "messages" as const, badge: unreadCount || undefined },
    { icon: Settings, label: "Settings", id: "settings" as const, badge: undefined },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "application":
        return <ApplicationTab applications={applications} />;
      case "payments":
        return (
          <PaymentsTab
            payments={payments}
            payDisabledReason={payDisabledReason}
            onPayRent={onPayRent}
            paying={paying}
          />
        );
      case "maintenance":
        return (
          <MaintenanceTab
            items={maintenance}
            propertyOptions={propertyOptions}
            onSubmitted={refreshAll}
          />
        );
      case "documents":
        return <DocumentsTab docs={documents} />;
      case "messages":
        return (
          <MessagesTab profile={profile} messages={messages} onRefresh={refreshAll} />
        );
      case "settings":
        return <SettingsTab profile={profile} />;
      default:
        return (
          <OverviewTab
            profile={profile}
            lease={lease}
            payments={payments}
            maintenance={maintenance}
            loading={loading}
          />
        );
    }
  };

  return (
    <div className="min-h-screen pt-16 flex">
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 z-30 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "rgba(10,15,30,0.97)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="p-4 space-y-1">
          <div className="px-4 py-3 mb-4">
            <p className="text-xs text-foreground-muted uppercase tracking-wider">Tenant portal</p>
            {profile && (
              <p className="text-sm font-medium text-foreground truncate">
                {profile.full_name ?? profile.email}
              </p>
            )}
          </div>
          {nav.map(({ icon: Icon, label, id, badge }) => (
            <button
              key={id}
              type="button"
              data-testid={`tenant-nav-${id}`}
              onClick={() => {
                setActiveTab(id);
                setSidebarOpen(false);
              }}
              className={`sidebar-item w-full ${activeTab === id ? "active" : ""}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge ? (
                <span
                  className="min-w-[1.25rem] h-5 px-1 rounded-full text-xs flex items-center justify-center font-bold text-white"
                  style={{ background: "#6366F1" }}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <main className="flex-1 lg:ml-64 p-6 lg:py-8">
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg glass-card"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-foreground">Dashboard</span>
          <button type="button" className="p-2 rounded-lg glass-card" aria-label="Notifications">
            <Bell className="w-5 h-5" />
          </button>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderTab()}
        </motion.div>
      </main>
    </div>
  );
}
