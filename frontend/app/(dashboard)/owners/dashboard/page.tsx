"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  LayoutDashboard, Building2, FileText, BarChart3, Wrench, MessageSquare, Settings,
  TrendingUp, Users, DollarSign, AlertTriangle, ChevronRight, PlusCircle, Menu, Bell, Loader2,
  Pencil, Archive, Home as HomeIcon, ImageOff
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

import { authHeader } from "@/lib/auth-client";
import { archiveProperty, listOwnerProperties } from "@/lib/owner-properties";
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

const REVENUE_DATA = [
  { month: "Jan", revenue: 18400 }, { month: "Feb", revenue: 19200 }, { month: "Mar", revenue: 21000 },
  { month: "Apr", revenue: 19800 }, { month: "May", revenue: 22500 }, { month: "Jun", revenue: 24000 },
];
const EXPENSE_DATA = [
  { name: "Maintenance", value: 3200, color: "#F59E0B" },
  { name: "Management", value: 2400, color: "#6366F1" },
  { name: "Insurance", value: 1800, color: "#10B981" },
  { name: "Utilities", value: 900, color: "#8B5CF6" },
];

function OverviewTab({ kpis, loading }: { kpis: any, loading: boolean }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Portfolio Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Units", value: loading ? "..." : kpis?.total_units || "0", icon: Building2, color: "#6366F1", change: "+2 this year" },
          { label: "Occupancy Rate", value: loading ? "..." : `${kpis?.occupancy_rate || "0"}%`, icon: TrendingUp, color: "#10B981", change: "+3.4% vs last mo" },
          { label: "Monthly Revenue", value: loading ? "..." : `$${(kpis?.monthly_revenue || 0).toLocaleString()}`, icon: DollarSign, color: "#F59E0B", change: "+6.7% vs last mo" },
          { label: "Open Tickets", value: loading ? "..." : kpis?.open_maintenance_tickets || "0", icon: Wrench, color: "#EF4444", change: "Current maintenance" },
        ].map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="glass-card p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}20` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-xs text-foreground-muted mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
            <p className="text-xs text-foreground-muted">{change}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-5">Monthly Revenue (2025)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={REVENUE_DATA}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#F9FAFB" }}
              formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
            />
            <Bar dataKey="revenue" fill="#6366F1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

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
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No properties yet
          </h3>
          <p className="text-sm text-foreground-muted mb-6 max-w-md mx-auto">
            Add your first listing and it will appear on the public availability
            page within seconds.
          </p>
          <Link
            href="/owners/dashboard/properties/new"
            className="btn-primary inline-flex"
          >
            <PlusCircle className="w-4 h-4" /> List your first property
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="owner-properties-grid">
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
                  {p.property_type ? p.property_type.charAt(0).toUpperCase() + p.property_type.slice(1) : "Listing"}
                  {p.city ? ` · ${p.city}${p.state ? `, ${p.state}` : ""}` : ""}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-xs text-foreground-secondary">Monthly rent</span>
                  <span className="text-sm font-bold text-primary">
                    {p.monthly_rent ? `$${p.monthly_rent.toLocaleString()}` : "—"}
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

function ApplicationsTab() {
  const apps = [
    { id: "APP-001", tenant: "Sarah Mitchell", property: "400 Market St #4B", status: "pending", date: "May 3, 2025" },
    { id: "APP-002", tenant: "James Chen", property: "1820 Laurel Canyon", status: "under_review", date: "Apr 30, 2025" },
    { id: "APP-003", tenant: "Maria Garcia", property: "400 Market St #2A", status: "approved", date: "Apr 25, 2025" },
  ];
  const statusColor: Record<string, string> = { pending: "#9CA3AF", under_review: "#F59E0B", approved: "#10B981", denied: "#EF4444" };
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Tenant Applications</h2>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["ID", "Tenant", "Property", "Status", "Date", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apps.map(({ id, tenant, property, status, date }) => (
              <tr key={id} className="border-b hover:bg-white/2 transition-colors border-white/5">
                <td className="px-4 py-3 text-sm font-mono text-primary">{id}</td>
                <td className="px-4 py-3 text-sm text-foreground">{tenant}</td>
                <td className="px-4 py-3 text-sm text-foreground-secondary">{property}</td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize" style={{ background: `${statusColor[status]}20`, color: statusColor[status], border: `1px solid ${statusColor[status]}30` }}>
                    {status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-foreground-muted">{date}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="text-xs px-3 py-1 rounded-lg text-primary hover:bg-primary/10">Review</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



function FinancialsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-playfair)" }}>Financials</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-foreground-muted uppercase mb-1">Gross Income</p>
          <p className="text-2xl font-bold text-success">$22,500</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-foreground-muted uppercase mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-error">$8,300</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-foreground-muted uppercase mb-1">Net Income</p>
          <p className="text-2xl font-bold text-primary">$14,200</p>
        </div>
      </div>
      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {[
            { desc: "Rent Payment - 400 Market St #4B", amount: "+$2,400", date: "May 1", type: "income" },
            { desc: "Management Fee - May 2025", amount: "-$1,200", date: "May 1", type: "expense" },
            { desc: "Plumbing Repair - Laurel Canyon", amount: "-$450", date: "Apr 28", type: "expense" },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-white/5">
              <div>
                <p className="text-sm font-medium text-foreground">{t.desc}</p>
                <p className="text-xs text-foreground-muted">{t.date}</p>
              </div>
              <p className={`text-sm font-bold ${t.type === "income" ? "text-success" : "text-foreground"}`}>{t.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MaintenanceTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-playfair)" }}>Maintenance Overview</h2>
      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Open Requests</h3>
        <div className="space-y-4">
          {[
            { property: "400 Market St #4B", issue: "Leaking faucet in bathroom", priority: "Medium", status: "In Progress", date: "Apr 28" },
            { property: "1820 Laurel Canyon", issue: "Dishwasher not draining", priority: "Low", status: "Scheduled", date: "May 2" },
          ].map((r, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">{r.property}</p>
                <p className="text-xs text-foreground-secondary">{r.issue}</p>
                <p className="text-[10px] text-foreground-muted mt-1">Priority: {r.priority} · Opened {r.date}</p>
              </div>
              <span className="badge-coming-soon">{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-playfair)" }}>Reports & Analytics</h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-foreground mb-5">Monthly Revenue (2025)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={REVENUE_DATA}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 10 }} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#F9FAFB" }} />
              <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-6">
          <h3 className="font-semibold text-foreground mb-5">Expense Breakdown</h3>
          <div className="flex items-center gap-6">
            <PieChart width={160} height={160}>
              <Pie data={EXPENSE_DATA} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                {EXPENSE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
            <div className="space-y-2">
              {EXPENSE_DATA.map(({ name, value, color }) => (
                <div key={name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-foreground-secondary">{name}</span>
                  <span className="ml-auto text-foreground font-medium">${value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Year-to-Date Summary</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-xs text-foreground-muted mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-success">$124,900</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-xs text-foreground-muted mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-error">$46,200</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-xs text-foreground-muted mb-1">Net Profit</p>
            <p className="text-2xl font-bold text-primary">$78,700</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessagesTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-playfair)" }}>Messages</h2>
      <div className="glass-card p-12 text-center">
        <MessageSquare className="w-12 h-12 text-foreground-muted mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-foreground mb-2">No New Messages</h3>
        <p className="text-foreground-secondary max-w-sm mx-auto">When tenants or the management team message you, they will appear here.</p>
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-playfair)" }}>Owner Settings</h2>
      <div className="glass-card p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-foreground mb-4">Profile Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-foreground-muted uppercase block mb-1">Full Name</label>
              <input type="text" className="input-glass w-full" defaultValue="Jagannath Sai" />
            </div>
            <div>
              <label className="text-xs text-foreground-muted uppercase block mb-1">Email</label>
              <input type="email" className="input-glass w-full" defaultValue="owner@example.com" />
            </div>
          </div>
        </div>
        <div className="pt-6 border-t border-white/5">
          <h3 className="font-semibold text-foreground mb-4">Payout Settings</h3>
          <p className="text-sm text-foreground-secondary mb-4">Your funds are being deposited into your account ending in **4242.</p>
          <button className="text-sm text-primary hover:underline">Manage Payout Methods</button>
        </div>
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = { Authorization: `Bearer ${token}` };
        
        const [profResp, kpiResp] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/owners/me`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/owners/portfolio`, { headers })
        ]);

        if (profResp.ok) setProfile(await profResp.json());
        if (kpiResp.ok) setKpis(await kpiResp.json());
      } catch (err) {
        console.error("Failed to fetch owner data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "properties": return <PropertiesTab />;
      case "applications": return <ApplicationsTab />;
      case "financials": return <FinancialsTab />;
      case "maintenance": return <MaintenanceTab />;
      case "reports": return <ReportsTab />;
      case "messages": return <MessagesTab />;
      case "settings": return <SettingsTab />;
      default: return <OverviewTab kpis={kpis} loading={loading} />;
    }
  };

  return (
    <div className="min-h-screen pt-16 flex">
      <aside className={`fixed top-16 left-0 bottom-0 w-64 z-30 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "rgba(10,15,30,0.97)", borderRight: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        <div className="p-4 space-y-1">
          <div className="px-4 py-3 mb-4">
            <p className="text-xs text-foreground-muted uppercase tracking-wider">Owner Portal</p>
            {profile && <p className="text-sm font-medium text-foreground truncate">{profile.full_name}</p>}
          </div>
          {SIDEBAR_ITEMS.map(({ icon: Icon, label, id }) => (
            <button key={id} onClick={() => { setActiveTab(id); setSidebarOpen(false); }} className={`sidebar-item w-full ${activeTab === id ? "active" : ""}`}>
              <Icon className="w-4 h-4" /><span className="flex-1 text-left">{label}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Link
            href="/owners/dashboard/properties/new"
            className="btn-primary w-full justify-center py-2.5 text-sm"
          >
            <PlusCircle className="w-4 h-4" />Add Property
          </Link>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <main className="flex-1 lg:ml-64 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg glass-card"><Menu className="w-5 h-5" /></button>
          <span className="font-semibold">Owner Dashboard</span>
          <button className="p-2 rounded-lg glass-card"><Bell className="w-5 h-5" /></button>
        </div>
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {renderTab()}
        </motion.div>
      </main>
    </div>
  );
}

