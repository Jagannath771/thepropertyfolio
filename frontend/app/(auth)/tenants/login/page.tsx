"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from "lucide-react";

/**
 * Whitelist what `?next=` paths we'll trust as a post-login redirect.  We
 * never want an attacker to be able to bounce a freshly-authenticated user
 * to an off-site URL or to a protected page they're not entitled to.
 */
function safeNextPath(raw: string | null): string {
  if (!raw) return "/tenants/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/tenants/dashboard";
  const allowedPrefixes = ["/availability", "/tenants/dashboard"];
  if (!allowedPrefixes.some((p) => raw === p || raw.startsWith(`${p}/`) || raw.startsWith(`${p}?`))) {
    return "/tenants/dashboard";
  }
  return raw;
}

export default function TenantLoginPage() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const fromApply = searchParams.get("apply") === "1";
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Login failed");
      // Store tokens and redirect
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      document.cookie = `access_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
      window.location.href = nextPath;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1920&q=80" alt="" className="w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,15,30,0.9), rgba(10,15,30,0.98))" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
              <LogIn className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-playfair)" }}>Tenant Sign In</h1>
            <p className="text-sm text-foreground-muted mt-2">
              {fromApply
                ? "Sign in to finish applying — we'll take you back to the listing."
                : "Access your portal, pay rent, and more"}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground-secondary block mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input
                  type="email"
                  className="input-glass w-full pl-10"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground-secondary">Password</label>
                <Link href="/tenants/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input
                  type={showPass ? "text" : "password"}
                  className="input-glass w-full pl-10 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-foreground-muted">
            Don&apos;t have an account?{" "}
            <Link
              href={
                nextPath !== "/tenants/dashboard"
                  ? `/tenants/register?next=${encodeURIComponent(nextPath)}${fromApply ? "&apply=1" : ""}`
                  : "/tenants/register"
              }
              className="text-primary hover:underline font-medium"
            >
              Create one free
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/owners/login" className="text-xs text-foreground-muted hover:text-foreground">Are you a property owner? Sign in here →</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
