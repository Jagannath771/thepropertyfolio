"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronDown, Play } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80"
          alt="Luxury property aerial view"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,15,30,0.75) 0%, rgba(10,15,30,0.55) 50%, rgba(10,15,30,0.95) 100%)",
          }}
        />
      </div>

      {/* Animated gradient blobs */}
      <div
        className="gradient-blob w-96 h-96"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)",
          top: "15%",
          left: "5%",
          animationDelay: "0s",
        }}
      />
      <div
        className="gradient-blob w-80 h-80"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)",
          top: "20%",
          right: "8%",
          animationDelay: "3s",
        }}
      />
      <div
        className="gradient-blob w-64 h-64"
        style={{
          background: "radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)",
          bottom: "20%",
          left: "15%",
          animationDelay: "5s",
        }}
      />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern z-[1] opacity-30" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
          style={{
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.3)",
            color: "#A5B4FC",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Trusted by 500+ Property Owners Nationwide
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-tight"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Your Portfolio.{" "}
          <br className="hidden sm:block" />
          Your Properties.{" "}
          <br className="hidden sm:block" />
          <span className="gradient-text">Perfected.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg sm:text-xl text-foreground-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Premium property management for tenants and owners. Browse hundreds of
          curated listings, apply online, and manage everything from one elegant dashboard.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/availability" className="btn-primary px-8 py-4 text-base">
            Find a Home
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/owners/register" className="btn-outline px-8 py-4 text-base">
            List Your Property
          </Link>
        </motion.div>

        {/* Stats preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-8 mt-14"
        >
          {[
            { value: "500+", label: "Properties" },
            { value: "98%", label: "Satisfaction" },
            { value: "15+", label: "Years" },
            { value: "24/7", label: "Support" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div
                className="text-2xl font-bold gradient-text"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {value}
              </div>
              <div className="text-xs text-foreground-muted uppercase tracking-wider mt-0.5">
                {label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-foreground-muted uppercase tracking-widest">Scroll</span>
        <ChevronDown className="w-5 h-5 text-primary animate-scroll-indicator" />
      </motion.div>
    </section>
  );
}
