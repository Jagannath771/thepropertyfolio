"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FileText, CreditCard, Wrench, FolderOpen, MessageSquare, Settings,
  Home, DollarSign, AlertTriangle, CheckCircle, Clock, ChevronRight, Bell, Menu, X, Loader2
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: FileText, label: "My Application", id: "application" },
  { icon: CreditCard, label: "Payments", id: "payments" },
  { icon: Wrench, label: "Maintenance", id: "maintenance" },
  { icon: FolderOpen, label: "Documents", id: "documents" },
  { icon: MessageSquare, label: "Messages", id: "messages", badge: 2 },
  { icon: Settings, label: "Settings", id: "settings" },
];

function OverviewTab({ profile, loading }: { profile: any, loading: boolean }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-playfair)" }}>
        {loading ? <Loader2 className="w-6 h-6 animate-spin inline mr-2" /> : `Welcome back, ${profile?.full_name?.split(" ")[0] || "there"}!`}
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Home, label: "Current Lease", value: "Expires Dec 31, 2025", color: "#6366F1", bg: "rgba(99,102,241,0.1)" },
          { icon: DollarSign, label: "Next Payment", value: "$2,400 due Jun 1", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
          { icon: Wrench, label: "Maintenance", value: "1 request open", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="glass-card p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-xs text-foreground-muted mb-1">{label}</p>
            <p className="text-sm font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Pay Rent", icon: CreditCard, color: "#6366F1" },
            { label: "Submit Maintenance", icon: Wrench, color: "#F59E0B" },
            { label: "View Lease", icon: FileText, color: "#10B981" },
            { label: "Send Message", icon: MessageSquare, color: "#8B5CF6" },
          ].map(({ label, icon: Icon, color }) => (
            <button key={label} className="flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-foreground-secondary hover:bg-white/5 transition-all text-left">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              {label}
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { icon: CheckCircle, text: "Rent payment of $2,400 confirmed", time: "May 1, 2025", color: "#10B981" },
            { icon: Clock, text: "Maintenance request #1042 — In Progress", time: "Apr 28, 2025", color: "#F59E0B" },
            { icon: FileText, text: "Lease renewal offer received", time: "Apr 15, 2025", color: "#6366F1" },
          ].map(({ icon: Icon, text, time, color }, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{text}</p>
                <p className="text-xs text-foreground-muted">{time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApplicationTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-playfair)" }}>My Application</h2>
      <div className="glass-card p-12 text-center">
        <FileText className="w-12 h-12 text-foreground-muted mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Active Application</h3>
        <p className="text-foreground-secondary max-w-sm mx-auto">You haven&apos;t submitted any rental applications yet. View available properties to start one.</p>
        <Link href="/availability" className="btn-primary mt-6 inline-flex">Browse Properties</Link>
      </div>
    </div>
  );
}

function PaymentsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-playfair)" }}>Payments & Billing</h2>
        <button className="btn-primary py-2 px-4 text-sm font-semibold">Make a Payment</button>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">Current Balance</p>
          <p className="text-3xl font-bold text-foreground">$0.00</p>
          <p className="text-xs text-success mt-2 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> All caught up!</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">Last Payment</p>
          <p className="text-3xl font-bold text-foreground">$2,400.00</p>
          <p className="text-xs text-foreground-muted mt-2">Paid on May 1, 2025</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Payment History</h3>
        <div className="space-y-3">
          {[
            { date: "May 1, 2025", amount: "$2,400.00", type: "Rent", status: "Paid" },
            { date: "Apr 1, 2025", amount: "$2,400.00", type: "Rent", status: "Paid" },
            { date: "Mar 1, 2025", amount: "$2,400.00", type: "Rent", status: "Paid" },
          ].map((p, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div>
                <p className="text-sm font-medium text-foreground">{p.type}</p>
                <p className="text-xs text-foreground-muted">{p.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">{p.amount}</p>
                <p className="text-xs text-success">{p.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MaintenanceTab() {
  const [form, setForm] = useState({ category: "", description: "", urgency: "medium" });
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-playfair)" }}>Maintenance Requests</h2>

      {/* Submit Form */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-5">Submit New Request</h3>
        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-foreground-secondary block mb-2">Category</label>
              <select className="input-glass w-full" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required>
                <option value="">Select category...</option>
                {["Plumbing", "Electrical", "HVAC", "Appliances", "Structural", "Pest Control", "Other"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-foreground-secondary block mb-2">Urgency</label>
              <select className="input-glass w-full" value={form.urgency} onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}>
                <option value="low">Low — Not urgent</option>
                <option value="medium">Medium — Needs attention</option>
                <option value="high">High — Urgent</option>
                <option value="emergency">Emergency — Immediate</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-foreground-secondary block mb-2">Description</label>
            <textarea className="input-glass w-full min-h-[100px] resize-none" placeholder="Describe the issue in detail..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
          </div>
          {submitted ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
              <CheckCircle className="w-4 h-4" /> Request submitted! We&apos;ll be in touch within 24-48 hours.
            </div>
          ) : (
            <button type="submit" className="btn-primary py-2.5">Submit Request</button>
          )}
        </form>
      </div>

      {/* Request History */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Request History</h3>
        {[
          { id: "#1042", category: "Plumbing", desc: "Leaking faucet in bathroom", status: "in_progress", date: "Apr 28, 2025" },
          { id: "#1031", category: "Electrical", desc: "Outlet not working in kitchen", status: "resolved", date: "Apr 10, 2025" },
        ].map(({ id, category, desc, status, date }) => (
          <div key={id} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div>
              <div className="text-sm font-medium text-foreground">{id} — {category}</div>
              <div className="text-xs text-foreground-muted">{desc} · {date}</div>
            </div>
            <span className={status === "resolved" ? "badge-available" : "badge-coming-soon"}>
              {status === "resolved" ? "Resolved" : "In Progress"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-playfair)" }}>Documents</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { name: "Residential Lease Agreement.pdf", size: "1.2 MB", date: "Jan 1, 2025" },
          { name: "Move-in Inspection Report.pdf", size: "4.5 MB", date: "Jan 5, 2025" },
          { name: "Renters Insurance Policy.pdf", size: "850 KB", date: "Feb 12, 2025" },
        ].map((doc, i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
              <p className="text-xs text-foreground-muted">{doc.size} · {doc.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagesTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-playfair)" }}>Messages</h2>
        <button className="btn-primary py-2 px-4 text-sm font-semibold">New Message</button>
      </div>
      <div className="glass-card overflow-hidden">
        {[
          { sender: "Property Manager", subject: "Lease Renewal Options", preview: "Hi Jane, your lease is coming up for renewal in a few months...", time: "2h ago", unread: true },
          { sender: "Maintenance Team", subject: "Request #1042 Updated", preview: "We have scheduled a plumber to visit tomorrow at 10 AM...", time: "Yesterday", unread: false },
        ].map((m, i) => (
          <div key={i} className={`p-4 border-b last:border-0 hover:bg-white/5 transition-colors cursor-pointer flex gap-4 ${m.unread ? "bg-primary/5" : ""}`} style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${m.unread ? "bg-primary" : "bg-transparent"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-foreground">{m.sender}</p>
                <p className="text-xs text-foreground-muted">{m.time}</p>
              </div>
              <p className="text-sm font-medium text-foreground-secondary mb-1">{m.subject}</p>
              <p className="text-xs text-foreground-muted truncate">{m.preview}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-playfair)" }}>Settings</h2>
      <div className="glass-card p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-foreground mb-4">Notification Preferences</h3>
          <div className="space-y-3">
            {["Email Notifications", "SMS Notifications", "Marketing Emails", "Maintenance Updates"].map((pref) => (
              <label key={pref} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-foreground-secondary">{pref}</span>
                <input type="checkbox" defaultChecked className="accent-primary" />
              </label>
            ))}
          </div>
        </div>
        <div className="pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h3 className="font-semibold text-foreground mb-4">Security</h3>
          <button className="text-sm text-primary hover:underline">Change Password</button>
          <br />
          <button className="text-sm text-error hover:underline mt-2">Delete Account</button>
        </div>
      </div>
    </div>
  );
}

export default function TenantDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tenants/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (resp.ok) {
          const data = await resp.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "application": return <ApplicationTab />;
      case "payments": return <PaymentsTab />;
      case "maintenance": return <MaintenanceTab />;
      case "documents": return <DocumentsTab />;
      case "messages": return <MessagesTab />;
      case "settings": return <SettingsTab />;
      default: return <OverviewTab profile={profile} loading={loading} />;
    }
  };

  return (
    <div className="min-h-screen pt-16 flex">
      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 bottom-0 w-64 z-30 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "rgba(10,15,30,0.97)", borderRight: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        <div className="p-4 space-y-1">
          <div className="px-4 py-3 mb-4">
            <p className="text-xs text-foreground-muted uppercase tracking-wider">Tenant Portal</p>
          </div>
          {SIDEBAR_ITEMS.map(({ icon: Icon, label, id, badge }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
              className={`sidebar-item w-full ${activeTab === id ? "active" : ""}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge && (
                <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold text-white" style={{ background: "#6366F1" }}>{badge}</span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-6 lg:p-8">
        {/* Mobile header */}
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg glass-card"><Menu className="w-5 h-5" /></button>
          <span className="font-semibold text-foreground">Dashboard</span>
          <button className="p-2 rounded-lg glass-card"><Bell className="w-5 h-5" /></button>
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

