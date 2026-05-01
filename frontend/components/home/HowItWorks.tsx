"use client";

import { motion } from "framer-motion";
import { ClipboardList, Search, Home, ArrowRight } from "lucide-react";

const OWNER_STEPS = [
  { icon: ClipboardList, title: "List Your Property", desc: "Add your property details, photos, and set your rent in minutes." },
  { icon: Search, title: "Screen Tenants", desc: "We run background, credit, and rental history checks automatically." },
  { icon: Home, title: "Collect & Earn", desc: "Automated rent collection, statements, and direct deposits." },
];

const TENANT_STEPS = [
  { icon: Search, title: "Browse Listings", desc: "Search by location, price, size, and amenities with smart filters." },
  { icon: ClipboardList, title: "Apply Online", desc: "Submit your application, documents, and e-signature — no paperwork." },
  { icon: Home, title: "Move In", desc: "Get approved, sign your lease digitally, and get your keys." },
];

export default function HowItWorks() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">How It Works</p>
        <h2 className="section-title">Simple for Everyone</h2>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-12">
        {[
          { title: "For Property Owners", steps: OWNER_STEPS, color: "#6366F1" },
          { title: "For Tenants", steps: TENANT_STEPS, color: "#10B981" },
        ].map(({ title, steps, color }) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8"
          >
            <h3 className="text-xl font-bold mb-8" style={{ color }}>{title}</h3>
            <div className="space-y-6">
              {steps.map(({ icon: Icon, title: stepTitle, desc }, i) => (
                <div key={stepTitle} className="flex gap-4">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: color, boxShadow: `0 0 20px ${color}40` }}
                    >
                      {i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px h-8 mt-2" style={{ background: `${color}30` }} />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" style={{ color }} />
                      <h4 className="font-semibold text-foreground">{stepTitle}</h4>
                    </div>
                    <p className="text-sm text-foreground-secondary">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
