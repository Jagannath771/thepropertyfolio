"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special character", pass: /[!@#$%^&*]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["", "#EF4444", "#F59E0B", "#10B981", "#6366F1"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ background: i <= score ? colors[score] : "rgba(255,255,255,0.1)" }} />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[score] }}>{labels[score]}</p>
    </div>
  );
}

export default function OwnerRegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const [form, setForm] = useState({ 
    first_name: "", 
    last_name: "", 
    company_name: "", 
    email: "", 
    phone: "", 
    password: "" 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { setError("Please agree to the Terms of Service."); return; }
    setError("");
    setLoading(true);
    try {
      const full_name = `${form.first_name} ${form.last_name}`.trim();
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          full_name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: "owner",
          company_name: isBusiness ? form.company_name : undefined
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Registration failed");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-3">Welcome Aboard!</h2>
          <p className="text-foreground-secondary mb-6">We sent a verification link to <strong className="text-foreground">{form.email}</strong>. Please verify your email to start managing your properties.</p>
          <Link href="/owners/login" className="btn-primary justify-center">Go to Login</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80" alt="" className="w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl relative z-10">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight mb-6 hover:opacity-80 transition-opacity">
              <Building2 className="w-8 h-8 text-primary" />
              <span>TheProperty<span className="text-primary">Folio</span></span>
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2 font-serif">Partner with Us</h1>
            <p className="text-foreground-secondary">Manage your portfolio with elite precision and AI-driven insights.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Type Toggle */}
            <div className="flex items-center justify-center gap-4 p-4 rounded-xl mb-6" style={{ background: "rgba(255,255,255,0.02)" }}>
              <span className={`text-sm font-medium ${!isBusiness ? "text-foreground" : "text-foreground-muted"}`}>Individual</span>
              <button
                type="button"
                role="switch"
                aria-label="Business Account Toggle"
                aria-checked={isBusiness}
                onClick={() => setIsBusiness(!isBusiness)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isBusiness ? "bg-primary" : "bg-white/20"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBusiness ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className={`text-sm font-medium ${isBusiness ? "text-foreground" : "text-foreground-muted"}`}>Business</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground-secondary block mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                  <input type="text" className="input-glass w-full pl-10" placeholder="John" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground-secondary block mb-2">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                  <input type="text" className="input-glass w-full pl-10" placeholder="Doe" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} required />
                </div>
              </div>
            </div>

            {isBusiness && (
              <div>
                <label className="text-sm font-medium text-foreground-secondary block mb-2">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                  <input type="text" className="input-glass w-full pl-10" placeholder="Acme Properties LLC" value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} required />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground-secondary block mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input type="email" className="input-glass w-full pl-10" placeholder="owner@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground-secondary block mb-2">Phone (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input type="tel" className="input-glass w-full pl-10" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground-secondary block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input type={showPass ? "text" : "password"} className="input-glass w-full pl-10 pr-10" placeholder="Create a strong password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <label className="flex items-start gap-3 cursor-pointer py-2">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 accent-primary" />
              <span className="text-sm text-foreground-secondary">
                I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Partner with Us"}
            </button>
          </form>

          <p className="text-center text-sm text-foreground-muted mt-6">
            Already have an account?{" "}
            <Link href="/owners/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
