"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Building2,
  FileText,
  BarChart3,
  Wrench,
  MessageSquare,
  Settings,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  PlusCircle,
  Menu,
  Bell,
  Loader2,
  Archive,
  Home as HomeIcon,
  ImageOff,
  Check,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  getOwnerPortfolio,
  getOwnerProfile,
  getOwnerFinancials,
  type OwnerFinancials,
  type OwnerPortfolio,
  type OwnerProfile,
} from "@/lib/owner-financials";
import { archiveProperty, listOwnerProperties } from "@/lib/owner-properties";
import {
  listApplications,
  updateApplicationStatus,
  type Application,
  type ApplicationStatus,
} from "@/lib/applications";
import {
  listMaintenance,
  updateMaintenance,
  type MaintenanceRequest,
  type MaintenanceStatus,
} from "@/lib/maintenance";
import type { Property } from "@/lib/types";

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: Building2, label: "My Properties", id: "properties" },
  { icon: FileText, label: "Applications", id: "applications" },
  { icon: DollarSign, label: "Financials", id: "financials" },
  { icon: Wrench, label: "Maintenance", id: "maintenance" },
  { icon: BarChart3, label: "Reports", id: "reports" },
  { icon: MessageSquare, label: "Messages", id: "messages" },
  { icon: Settings, label: "Settings", id: "settings" },
];

// ───────────────────────────── Utilities ─────────────────────────────

function formatMonthLabel(iso: string): string {
  const [y, m] = iso.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short" });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(value: number, opts: Intl.NumberFormatOptions = {}): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  });
}

function changeLabel(pct: number | null, periodLabel: string): string {
  if (pct === null) return `No data ${periodLabel}`;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}% ${periodLabel}`;
}

// ───────────────────────────── Overview ─────────────────────────────

function OverviewTab({
  kpis,
  financials,
  loading,
}: {
  kpis: OwnerPortfolio | null;
  financials: OwnerFinancials | null;
  loading: boolean;
}) {
  const revenueData = (financials?.revenue_series ?? []).map((p) => ({
    month: formatMonthLabel(p.month),
    revenue: p.revenue,
  }));

  return (
    <div className="space-y-6" data-testid="overview-tab">
      <h2
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Portfolio Overview
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Units",
            value: loading ? "…" : String(kpis?.total_units ?? 0),
            icon: Building2,
            color: "#6366F1",
            change:
              loading || !kpis
                ? ""
                : kpis.units_added_this_year > 0
                  ? `+${kpis.units_added_this_year} this year`
                  : "No new listings this year",
          },
          {
            label: "Occupancy Rate",
            value: loading ? "…" : `${kpis?.occupancy_rate ?? 0}%`,
            icon: TrendingUp,
            color: "#10B981",
            change: loading || !kpis ? "" : `${kpis.occupied_units}/${kpis.total_units} leased`,
          },
          {
            label: "Monthly Revenue",
            value: loading ? "…" : formatCurrency(kpis?.monthly_revenue ?? 0),
            icon: DollarSign,
            color: "#F59E0B",
            change:
              loading || !kpis
                ? ""
                : changeLabel(kpis.revenue_change_pct, "vs prev 30d"),
          },
          {
            label: "Open Tickets",
            value: loading ? "…" : String(kpis?.open_maintenance_tickets ?? 0),
            icon: Wrench,
            color: "#EF4444",
            change: "Current maintenance",
          },
        ].map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="glass-card p-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${color}20` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-xs text-foreground-muted mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
            <p className="text-xs text-foreground-muted">{change}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-5">
          Monthly Revenue ({new Date().getFullYear()})
        </h3>
        {loading ? (
          <div className="h-[200px] bg-white/5 rounded animate-pulse" />
        ) : revenueData.every((p) => p.revenue === 0) ? (
          <div className="h-[200px] flex items-center justify-center text-sm text-foreground-muted">
            Revenue will appear here once rent payments start flowing in.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 11 }}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  color: "#F9FAFB",
                }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────── Properties ─────────────────────────────

function statusPillClass(status: string): string {
  switch (status) {
    case "leased":
      return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    case "available":
      return "bg-primary/20 text-primary border border-primary/30";
    case "coming_soon":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "archived":
      return "bg-white/10 text-foreground-muted border border-white/10";
    default:
      return "bg-white/10 text-foreground-secondary border border-white/10";
  }
}

function PropertyThumbnail({ images, title }: { images: string[]; title: string }) {
  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white/5">
        <div className="text-center">
          <ImageOff className="w-6 h-6 text-foreground-muted mx-auto mb-1" />
          <p className="text-xs text-foreground-muted">No photo yet</p>
        </div>
      </div>
    );
  }
  return (
    <img
      src={images[0]}
      alt={title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  );
}

function PropertiesTab() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listOwnerProperties(includeArchived)
      .then((res) => {
        if (!cancelled) setProperties(res.items);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "Failed to load your properties.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [includeArchived, reloadKey]);

  const onArchive = useCallback(async (id: string, title: string) => {
    if (!window.confirm(`Archive "${title}"? Tenants will no longer see this listing.`)) {
      return;
    }
    setArchivingId(id);
    try {
      await archiveProperty(id);
      toast.success(`Archived "${title}".`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error((err as Error).message || "Failed to archive.");
    } finally {
      setArchivingId(null);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          My Properties
        </h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-foreground-muted">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="accent-primary"
            />
            Include archived
          </label>
          <Link
            href="/owners/dashboard/properties/new"
            className="btn-primary py-2 px-4 text-sm font-semibold flex items-center gap-2"
            data-testid="add-property-btn"
          >
            <PlusCircle className="w-4 h-4" /> Add Property
          </Link>
        </div>
      </div>

      {error && (
        <div className="glass-card border border-danger/30 p-5 text-sm text-foreground">
          <AlertTriangle className="w-4 h-4 inline mr-2 text-danger" />
          {error}
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="ml-3 text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card overflow-hidden animate-pulse" aria-hidden>
              <div className="h-40 bg-white/5" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-2/3 bg-white/5 rounded" />
                <div className="h-3 w-1/2 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <HomeIcon className="w-10 h-10 text-primary mx-auto mb-4 opacity-70" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No properties yet</h3>
          <p className="text-sm text-foreground-muted mb-6 max-w-md mx-auto">
            Add your first listing and it will appear on the public availability page
            within seconds.
          </p>
          <Link
            href="/owners/dashboard/properties/new"
            className="btn-primary inline-flex"
          >
            <PlusCircle className="w-4 h-4" /> List your first property
          </Link>
        </div>
      ) : (
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-testid="owner-properties-grid"
        >
          {properties.map((p) => (
            <div
              key={p.id}
              className="glass-card overflow-hidden group"
              data-testid="owner-property-card"
            >
              <div className="h-40 bg-white/5 relative overflow-hidden">
                <PropertyThumbnail images={p.images} title={p.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                <span
                  className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusPillClass(p.status)}`}
                >
                  {p.status.replace("_", " ")}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-foreground mb-1 truncate">{p.title}</h3>
                <p className="text-xs text-foreground-muted mb-3">
                  {p.property_type
                    ? p.property_type.charAt(0).toUpperCase() + p.property_type.slice(1)
                    : "Listing"}
                  {p.city ? ` · ${p.city}${p.state ? `, ${p.state}` : ""}` : ""}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-xs text-foreground-secondary">Monthly rent</span>
                  <span className="text-sm font-bold text-primary">
                    {p.monthly_rent ? formatCurrency(p.monthly_rent) : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Link
                    href={`/availability/${p.id}`}
                    className="text-xs text-foreground-secondary hover:text-foreground inline-flex items-center gap-1"
                  >
                    View public page <ChevronRight className="w-3 h-3" />
                  </Link>
                  <div className="flex-1" />
                  {p.status !== "archived" && (
                    <button
                      type="button"
                      onClick={() => onArchive(p.id, p.title)}
                      disabled={archivingId === p.id}
                      className="text-xs text-foreground-muted hover:text-danger inline-flex items-center gap-1 disabled:opacity-50"
                      aria-label={`Archive ${p.title}`}
                    >
                      {archivingId === p.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Archive className="w-3 h-3" />
                      )}
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── Applications ─────────────────────────────

function appStatusColor(status: string): string {
  switch (status) {
    case "approved":
      return "#10B981";
    case "denied":
    case "withdrawn":
      return "#EF4444";
    case "under_review":
    case "background_check":
      return "#F59E0B";
    default:
      return "#9CA3AF";
  }
}

function ApplicationsTab() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listApplications()
      .then((res) => {
        if (!cancelled) setApps(res);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "Failed to load applications.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const setStatus = useCallback(async (id: string, status: ApplicationStatus) => {
    setMutatingId(id);
    try {
      const updated = await updateApplicationStatus(id, status);
      setApps((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast.success(
        status === "approved"
          ? "Application approved. Tenant will be notified."
          : status === "denied"
            ? "Application denied."
            : `Application marked as ${status.replace("_", " ")}.`,
      );
    } catch (err) {
      toast.error((err as Error).message || "Action failed.");
    } finally {
      setMutatingId(null);
    }
  }, []);

  return (
    <div className="space-y-6" data-testid="applications-tab">
      <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
        Tenant Applications
      </h2>

      {error && (
        <div className="glass-card border border-danger/30 p-5 text-sm text-foreground">
          <AlertTriangle className="w-4 h-4 inline mr-2 text-danger" />
          {error}
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="ml-3 text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="glass-card p-6 animate-pulse space-y-3" aria-hidden>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText className="w-10 h-10 text-primary mx-auto mb-4 opacity-60" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No applications yet
          </h3>
          <p className="text-sm text-foreground-muted max-w-md mx-auto">
            When tenants apply to your listings, you'll be able to approve or deny
            them here.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Submitted", "Tenant", "Property", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => {
                const submitted = a.submitted_at ?? a.created_at;
                const isClosed = ["approved", "denied", "withdrawn"].includes(a.status);
                const color = appStatusColor(a.status);
                const tenantName =
                  (a.personal_info && (a.personal_info as Record<string, unknown>).full_name as string) ||
                  a.tenant_id.slice(0, 8);
                return (
                  <tr
                    key={a.id}
                    className="border-b hover:bg-white/5 transition-colors border-white/5"
                    data-testid="application-row"
                  >
                    <td className="px-4 py-3 text-xs text-foreground-muted whitespace-nowrap">
                      {formatDate(submitted)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{tenantName}</td>
                    <td className="px-4 py-3 text-xs text-foreground-secondary font-mono">
                      {a.property_id ? a.property_id.slice(0, 8) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                        style={{
                          background: `${color}20`,
                          color,
                          border: `1px solid ${color}30`,
                        }}
                      >
                        {a.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isClosed ? (
                        <span className="text-xs text-foreground-muted">Closed</span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setStatus(a.id, "approved")}
                            disabled={mutatingId === a.id}
                            className="text-xs px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50 inline-flex items-center gap-1"
                            data-testid="approve-btn"
                          >
                            {mutatingId === a.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => setStatus(a.id, "denied")}
                            disabled={mutatingId === a.id}
                            className="text-xs px-3 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 disabled:opacity-50 inline-flex items-center gap-1"
                            data-testid="deny-btn"
                          >
                            <X className="w-3 h-3" />
                            Deny
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── Financials ─────────────────────────────

function FinancialsTab({ financials }: { financials: OwnerFinancials | null }) {
  if (!financials) {
    return (
      <div className="space-y-4" data-testid="financials-tab">
        <h2
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Financials
        </h2>
        <div className="glass-card p-6 animate-pulse h-40" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="financials-tab">
      <h2
        className="text-2xl font-bold text-foreground"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Financials
      </h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-foreground-muted uppercase mb-1">
            Year-to-date revenue
          </p>
          <p
            className="text-2xl font-bold text-success"
            data-testid="financials-ytd-revenue"
          >
            {formatCurrency(financials.ytd_revenue)}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            {changeLabel(financials.ytd_change_pct, "vs last YTD")}
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-foreground-muted uppercase mb-1">
            Year-to-date expenses
          </p>
          <p className="text-2xl font-bold text-foreground-muted">
            {formatCurrency(financials.ytd_expenses)}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            {financials.expenses_feature === "released"
              ? "Tracked automatically"
              : "Expense tracking coming soon"}
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-foreground-muted uppercase mb-1">Net income</p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(financials.ytd_net_income)}
          </p>
          <p className="text-xs text-foreground-muted mt-1">YTD (revenue − expenses)</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Recent transactions</h3>
        {financials.recent_transactions.length === 0 ? (
          <p className="text-sm text-foreground-muted text-center py-8">
            No completed payments yet. Once tenants pay rent you'll see each
            transaction here.
          </p>
        ) : (
          <div className="space-y-3">
            {financials.recent_transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-2 border-b last:border-0 border-white/5"
              >
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {t.payment_type.replace("_", " ")} payment
                  </p>
                  <p className="text-xs text-foreground-muted">{formatDate(t.paid_at)}</p>
                </div>
                <p
                  className="text-sm font-bold text-success"
                  data-testid={`financials-tx-${t.id}-amount`}
                >
                  +{formatCurrency(t.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────── Maintenance ─────────────────────────────

function maintStatusColor(status: string): string {
  switch (status) {
    case "resolved":
    case "closed":
      return "#10B981";
    case "in_progress":
    case "scheduled":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
}

function MaintenanceTab() {
  const [items, setItems] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listMaintenance()
      .then((res) => {
        if (!cancelled) setItems(res);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "Failed to load maintenance requests.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const updateStatus = useCallback(async (id: string, status: MaintenanceStatus) => {
    setMutatingId(id);
    try {
      const updated = await updateMaintenance(id, { status });
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      toast.success(`Marked as ${status.replace("_", " ")}.`);
    } catch (err) {
      toast.error((err as Error).message || "Action failed.");
    } finally {
      setMutatingId(null);
    }
  }, []);

  return (
    <div className="space-y-6" data-testid="maintenance-tab">
      <h2
        className="text-2xl font-bold text-foreground"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Maintenance Overview
      </h2>

      {error && (
        <div className="glass-card border border-danger/30 p-5 text-sm text-foreground">
          <AlertTriangle className="w-4 h-4 inline mr-2 text-danger" />
          {error}
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="ml-3 text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="glass-card p-6 animate-pulse space-y-3" aria-hidden>
          <div className="h-4 w-1/3 bg-white/5 rounded" />
          <div className="h-16 bg-white/5 rounded" />
          <div className="h-16 bg-white/5 rounded" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Wrench className="w-10 h-10 text-primary mx-auto mb-4 opacity-60" />
          <h3 className="text-lg font-semibold text-foreground mb-2">All clear</h3>
          <p className="text-sm text-foreground-muted max-w-md mx-auto">
            No open maintenance requests across your properties.
          </p>
        </div>
      ) : (
        <div className="glass-card p-6">
          <div className="space-y-4">
            {items.map((r) => {
              const color = maintStatusColor(r.status);
              return (
                <div
                  key={r.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-4"
                  data-testid="maintenance-row"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {r.category ?? "General maintenance"}
                    </p>
                    <p className="text-xs text-foreground-secondary line-clamp-2">
                      {r.description}
                    </p>
                    <p className="text-[10px] text-foreground-muted mt-1">
                      Urgency: {r.urgency} · Opened {formatDate(r.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                      style={{
                        background: `${color}20`,
                        color,
                        border: `1px solid ${color}30`,
                      }}
                    >
                      {r.status.replace("_", " ")}
                    </span>
                    {r.status !== "resolved" && r.status !== "closed" && (
                      <div className="flex gap-1">
                        {r.status === "open" && (
                          <button
                            onClick={() => updateStatus(r.id, "in_progress")}
                            disabled={mutatingId === r.id}
                            className="text-xs px-2 py-1 rounded-md bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 disabled:opacity-50"
                          >
                            Start
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(r.id, "resolved")}
                          disabled={mutatingId === r.id}
                          className="text-xs px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"
                        >
                          {mutatingId === r.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Resolve"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── Reports ─────────────────────────────

function ReportsTab({ financials }: { financials: OwnerFinancials | null }) {
  const revenueData = (financials?.revenue_series ?? []).map((p) => ({
    month: formatMonthLabel(p.month),
    revenue: p.revenue,
  }));
  const hasData = revenueData.some((p) => p.revenue > 0);

  return (
    <div className="space-y-6" data-testid="reports-tab">
      <h2
        className="text-2xl font-bold text-foreground"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Reports & Analytics
      </h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-foreground mb-5">Monthly Revenue (last 12 mo)</h3>
          {!financials ? (
            <div className="h-[200px] bg-white/5 rounded animate-pulse" />
          ) : hasData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 10 }}
                  tickFormatter={(v: number) => `$${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    color: "#F9FAFB",
                  }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="h-[200px] flex items-center justify-center text-sm text-foreground-muted">
              No revenue recorded yet.
            </p>
          )}
        </div>
        <div className="glass-card p-6">
          <h3 className="font-semibold text-foreground mb-5">Expense Breakdown</h3>
          <div className="h-[160px] flex items-center justify-center text-sm text-foreground-muted text-center px-6">
            Expense tracking is coming soon. Connect a payout account in Settings to
            let ThePropertyFolio auto-import expenses.
          </div>
        </div>
      </div>
      {financials && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Year-to-Date Summary</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-white/5">
              <p className="text-xs text-foreground-muted mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(financials.ytd_revenue)}
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5">
              <p className="text-xs text-foreground-muted mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-foreground-muted">
                {formatCurrency(financials.ytd_expenses)}
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5">
              <p className="text-xs text-foreground-muted mb-1">Net Profit</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(financials.ytd_net_income)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── Messages & Settings ─────────────────────────────

function MessagesTab() {
  return (
    <div className="space-y-6">
      <h2
        className="text-2xl font-bold text-foreground"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Messages
      </h2>
      <div className="glass-card p-12 text-center">
        <MessageSquare className="w-12 h-12 text-foreground-muted mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-foreground mb-2">No New Messages</h3>
        <p className="text-foreground-secondary max-w-sm mx-auto">
          When tenants or the management team message you, they will appear here.
        </p>
      </div>
    </div>
  );
}

function SettingsTab({ profile }: { profile: OwnerProfile | null }) {
  return (
    <div className="space-y-6" data-testid="settings-tab">
      <h2
        className="text-2xl font-bold text-foreground"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Owner Settings
      </h2>
      <div className="glass-card p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-foreground mb-4">Profile Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-foreground-muted uppercase block mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="input-glass w-full"
                value={profile?.full_name ?? ""}
                readOnly
                placeholder={profile ? "" : "Loading…"}
                data-testid="settings-full-name"
              />
            </div>
            <div>
              <label className="text-xs text-foreground-muted uppercase block mb-1">
                Email
              </label>
              <input
                type="email"
                className="input-glass w-full"
                value={profile?.email ?? ""}
                readOnly
                placeholder={profile ? "" : "Loading…"}
                data-testid="settings-email"
              />
            </div>
          </div>
          <p className="text-xs text-foreground-muted mt-3">
            Profile editing is coming soon. Contact support to change these.
          </p>
        </div>
        <div className="pt-6 border-t border-white/5">
          <h3 className="font-semibold text-foreground mb-4">Two-Factor Authentication</h3>
          <p className="text-sm text-foreground-secondary mb-4">
            {profile?.totp_enabled
              ? "TOTP 2FA is enabled on your account."
              : "Two-factor authentication is not yet enabled."}
          </p>
        </div>
        <div className="pt-6 border-t border-white/5">
          <h3 className="font-semibold text-foreground mb-4">Payout Settings</h3>
          <p className="text-sm text-foreground-secondary mb-4">
            Connect a bank account to receive rent payouts. Stripe Connect onboarding
            rolls out with the payments milestone — we'll email you when it's live.
          </p>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────── Page ─────────────────────────────

export default function OwnerDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [kpis, setKpis] = useState<OwnerPortfolio | null>(null);
  const [financials, setFinancials] = useState<OwnerFinancials | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [prof, port, fin] = await Promise.all([
          getOwnerProfile(),
          getOwnerPortfolio(),
          getOwnerFinancials(12),
        ]);
        if (cancelled) return;
        setProfile(prof);
        setKpis(port);
        setFinancials(fin);
      } catch (err) {
        if (!cancelled) {
          toast.error(
            (err as Error).message ||
              "We couldn't load your dashboard data. Please retry in a moment.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "properties":
        return <PropertiesTab />;
      case "applications":
        return <ApplicationsTab />;
      case "financials":
        return <FinancialsTab financials={financials} />;
      case "maintenance":
        return <MaintenanceTab />;
      case "reports":
        return <ReportsTab financials={financials} />;
      case "messages":
        return <MessagesTab />;
      case "settings":
        return <SettingsTab profile={profile} />;
      default:
        return <OverviewTab kpis={kpis} financials={financials} loading={loading} />;
    }
  };

  return (
    <div className="min-h-screen pt-16 flex">
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 z-30 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          background: "rgba(10,15,30,0.97)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="p-4 space-y-1">
          <div className="px-4 py-3 mb-4">
            <p className="text-xs text-foreground-muted uppercase tracking-wider">
              Owner Portal
            </p>
            {profile && (
              <p className="text-sm font-medium text-foreground truncate">
                {profile.full_name ?? profile.email}
              </p>
            )}
          </div>
          {SIDEBAR_ITEMS.map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                setSidebarOpen(false);
              }}
              className={`sidebar-item w-full ${activeTab === id ? "active" : ""}`}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{label}</span>
            </button>
          ))}
        </div>
        <div
          className="p-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <Link
            href="/owners/dashboard/properties/new"
            className="btn-primary w-full justify-center py-2.5 text-sm"
          >
            <PlusCircle className="w-4 h-4" />Add Property
          </Link>
        </div>
      </aside>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <main className="flex-1 lg:ml-64 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg glass-card"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold">Owner Dashboard</span>
          <button className="p-2 rounded-lg glass-card" aria-label="Notifications">
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
