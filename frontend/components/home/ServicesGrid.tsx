"use client";

import { motion } from "framer-motion";
import {
  Building2, Users, Wrench, BarChart3, FileText, LayoutDashboard,
} from "lucide-react";

const SERVICES = [
  {
    icon: Building2,
    title: "Property Listings",
    description: "Browse and manage residential and commercial properties with our powerful search tools.",
    color: "rgba(99,102,241,0.15)",
    border: "rgba(99,102,241,0.3)",
    iconColor: "#6366F1",
  },
  {
    icon: Users,
    title: "Tenant Screening",
    description: "Comprehensive background checks, credit reports, and rental history verification.",
    color: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
    iconColor: "#10B981",
  },
  {
    icon: Wrench,
    title: "Maintenance",
    description: "24/7 maintenance request system with real-time status tracking and contractor management.",
    color: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
    iconColor: "#F59E0B",
  },
  {
    icon: BarChart3,
    title: "Financial Reporting",
    description: "Automated rent collection, expense tracking, and detailed financial statements.",
    color: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
    iconColor: "#EF4444",
  },
  {
    icon: FileText,
    title: "Lease Management",
    description: "Digital lease signing, renewal automation, and document storage in one place.",
    color: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.25)",
    iconColor: "#8B5CF6",
  },
  {
    icon: LayoutDashboard,
    title: "Owner Dashboard",
    description: "Real-time portfolio insights, occupancy rates, and revenue analytics at a glance.",
    color: "rgba(20,184,166,0.1)",
    border: "rgba(20,184,166,0.25)",
    iconColor: "#14B8A6",
  },
];

export default function ServicesGrid() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">What We Offer</p>
        <h2 className="section-title mb-4">
          Everything You Need,{" "}
          <span className="gradient-text">In One Place</span>
        </h2>
        <p className="text-foreground-secondary max-w-2xl mx-auto">
          From listing your first property to managing a 100-unit portfolio — 
          ThePropertyFolio has every tool built in.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map(({ icon: Icon, title, description, color, border, iconColor }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="glass-card p-6 cursor-default transition-all duration-300 group"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, rgba(17,24,39,0.7) 100%)`,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
              style={{ background: color, border: `1px solid ${border}` }}
            >
              <Icon className="w-6 h-6" style={{ color: iconColor }} strokeWidth={1.8} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-foreground-secondary leading-relaxed">{description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
