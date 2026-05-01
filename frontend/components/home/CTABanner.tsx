"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { useState } from "react";

export default function CTABanner() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 50%, rgba(245,158,11,0.1) 100%)",
            border: "1px solid rgba(99,102,241,0.25)",
          }}
        >
          {/* Decorative blobs */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", filter: "blur(40px)" }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)", filter: "blur(40px)" }}
          />

          <div className="relative z-10">
            <h2
              className="text-4xl md:text-5xl font-bold text-foreground mb-4"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Ready to find your{" "}
              <span className="gradient-text">next home?</span>
            </h2>
            <p className="text-foreground-secondary text-lg mb-10 max-w-xl mx-auto">
              Join thousands of tenants and owners who trust ThePropertyFolio for a seamless property experience.
            </p>

            {!submitted ? (
              <form
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) setSubmitted(true);
                }}
              >
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="input-glass w-full pl-10"
                    required
                  />
                </div>
                <button type="submit" className="btn-gold px-6 py-3 whitespace-nowrap">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 px-6 py-3 rounded-xl inline-flex items-center gap-2 font-semibold"
                style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}
              >
                ✓ You're on the list! We'll be in touch soon.
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/availability" className="btn-primary px-6 py-3">
                Browse Properties
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/contact" className="btn-outline px-6 py-3">
                Talk to Us
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
