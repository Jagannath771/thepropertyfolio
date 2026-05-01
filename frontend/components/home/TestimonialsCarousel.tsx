"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Sarah Mitchell",
    role: "Tenant — San Francisco, CA",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80",
    content:
      "ThePropertyFolio made finding and moving into my apartment seamless. The online application took minutes, and the maintenance portal is genuinely the best I've used in 8 years of renting.",
    rating: 5,
  },
  {
    name: "Marcus Thompson",
    role: "Property Owner — 12 Units",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
    content:
      "My occupancy rate jumped from 78% to 97% in 6 months after switching. The financial reporting alone saves me 4 hours a month. Worth every penny.",
    rating: 5,
  },
  {
    name: "Jennifer Chen",
    role: "Tenant — New York, NY",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80",
    content:
      "The AI assistant answered every question I had at 2am when I was apartment hunting. By morning I had a showing scheduled and an application submitted. Incredible experience.",
    rating: 5,
  },
  {
    name: "David Rodriguez",
    role: "Portfolio Owner — 45 Units",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80",
    content:
      "Managing 45 units used to feel like a second full-time job. ThePropertyFolio's dashboard gives me everything I need in 10 minutes a day. The team's support is also exceptional.",
    rating: 5,
  },
];

export default function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const next = () => setCurrent((c) => (c + 1) % TESTIMONIALS.length);

  return (
    <section className="py-24 overflow-hidden" style={{ background: "rgba(8,12,24,0.6)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="section-title">
            Trusted by Tenants &{" "}
            <span className="gradient-text">Owners Alike</span>
          </h2>
        </motion.div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="glass-card p-8 md:p-12 text-center"
            >
              <Quote
                className="w-10 h-10 mx-auto mb-6"
                style={{ color: "rgba(99,102,241,0.5)" }}
              />
              <p className="text-lg md:text-xl text-foreground-secondary leading-relaxed mb-8 italic">
                &ldquo;{TESTIMONIALS[current].content}&rdquo;
              </p>
              <div className="flex items-center justify-center gap-1 mb-6">
                {[...Array(TESTIMONIALS[current].rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <div className="flex items-center justify-center gap-3">
                <img
                  src={TESTIMONIALS[current].avatar}
                  alt={TESTIMONIALS[current].name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                />
                <div className="text-left">
                  <div className="font-semibold text-foreground text-sm">
                    {TESTIMONIALS[current].name}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    {TESTIMONIALS[current].role}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={prev} className="p-2 rounded-xl glass-card hover:border-primary/30 transition-all" aria-label="Previous">
              <ChevronLeft className="w-5 h-5 text-foreground-secondary" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-primary" : "w-2 bg-foreground-muted/40"}`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button onClick={next} className="p-2 rounded-xl glass-card hover:border-primary/30 transition-all" aria-label="Next">
              <ChevronRight className="w-5 h-5 text-foreground-secondary" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
