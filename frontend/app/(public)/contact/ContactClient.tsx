"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle } from "lucide-react";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const INQUIRY_TYPES = ["General Inquiry", "Property Listing", "Rental Application", "Maintenance", "Billing", "Other"];

export default function ContactClient() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", user_type: "Tenant", message: "", inquiry_type: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const resp = await fetch(`${apiUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp.ok) throw new Error("Submission failed. Please try again.");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <div className="relative py-20 text-center">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1920&q=80" alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,15,30,0.85), rgba(10,15,30,0.97))" }} />
        </div>
        <div className="relative">
          <h1 className="section-title mb-4">Get In <span className="gradient-text">Touch</span></h1>
          <p className="text-foreground-secondary max-w-xl mx-auto">Our team is ready to help with any questions about properties, applications, or your account.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid lg:grid-cols-5 gap-10">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="glass-card p-8">
              {success ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">Message Sent!</h3>
                  <p className="text-foreground-secondary">We&apos;ll get back to you within 1 business day. Check your email for a confirmation.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground-secondary block mb-2">Full Name *</label>
                      <input type="text" className="input-glass w-full" placeholder="Jane Doe" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground-secondary block mb-2">Email *</label>
                      <input type="email" className="input-glass w-full" placeholder="you@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground-secondary block mb-2">Phone</label>
                      <input type="tel" className="input-glass w-full" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground-secondary block mb-2">I Am</label>
                      <select className="input-glass w-full" value={form.user_type} onChange={(e) => setForm((f) => ({ ...f, user_type: e.target.value }))}>
                        {["Tenant", "Property Owner", "Just Browsing"].map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Inquiry type pills */}
                  <div>
                    <label className="text-sm font-medium text-foreground-secondary block mb-3">Inquiry Type</label>
                    <div className="flex flex-wrap gap-2">
                      {INQUIRY_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, inquiry_type: type }))}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                          style={{
                            background: form.inquiry_type === type ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${form.inquiry_type === type ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                            color: form.inquiry_type === type ? "#A5B4FC" : "#9CA3AF",
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground-secondary block mb-2">Message *</label>
                    <textarea className="input-glass w-full min-h-[140px] resize-none" placeholder="Tell us how we can help..." value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
                      <AlertCircle className="w-4 h-4" />{error}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="btn-primary py-3 px-8">
                    {loading ? "Sending..." : "Send Message"}
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-5">Contact Information</h3>
              <div className="space-y-4">
                {[
                  { icon: Phone, label: "Phone", value: "+1 (555) 123-4567", href: "tel:+15551234567" },
                  { icon: Mail, label: "Email", value: "contact@thepropertyfolio.com", href: "mailto:contact@thepropertyfolio.com" },
                  { icon: MapPin, label: "Office", value: "123 Property Lane, Suite 400\nSan Francisco, CA 94102" },
                  { icon: Clock, label: "Hours", value: "Mon–Fri: 9am–6pm PST\n24/7 Emergency Line for Tenants" },
                ].map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.1)" }}>
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-foreground-muted mb-0.5">{label}</p>
                      {href ? (
                        <a href={href} className="text-sm text-foreground hover:text-primary transition-colors">{value}</a>
                      ) : (
                        <p className="text-sm text-foreground whitespace-pre-line">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="glass-card overflow-hidden h-64 relative" style={{ background: "rgba(99,102,241,0.05)" }}>
              {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
                <Map
                  mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                  initialViewState={{
                    longitude: -122.4194,
                    latitude: 37.7749,
                    zoom: 12
                  }}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="mapbox://styles/mapbox/dark-v11"
                >
                  <Marker longitude={-122.4194} latitude={37.7749} color="#6366F1" />
                </Map>
              ) : (
                <div className="flex items-center justify-center h-full text-center p-4">
                  <div>
                    <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-foreground-muted">Map embed requires Mapbox token</p>
                    <p className="text-xs text-foreground-muted">Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
