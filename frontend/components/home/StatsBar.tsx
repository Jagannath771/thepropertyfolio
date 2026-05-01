"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const STATS = [
  { value: 500, suffix: "+", label: "Properties Managed", description: "Across residential & commercial" },
  { value: 98, suffix: "%", label: "Tenant Satisfaction", description: "Average review score" },
  { value: 15, suffix: "+", label: "Years Experience", description: "In property management" },
  { value: 24, suffix: "/7", label: "Support Available", description: "Emergency line always on" },
];

function AnimatedCounter({ value, suffix, duration = 2000 }: { value: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setCount(start);
      if (start >= value) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function StatsBar() {
  return (
    <section className="relative py-16 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)",
          borderTop: "1px solid rgba(99,102,241,0.15)",
          borderBottom: "1px solid rgba(99,102,241,0.15)",
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(({ value, suffix, label, description }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div
                className="text-4xl lg:text-5xl font-bold mb-2 gradient-text"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                <AnimatedCounter value={value} suffix={suffix} />
              </div>
              <div className="text-sm font-semibold text-foreground mb-1">{label}</div>
              <div className="text-xs text-foreground-muted">{description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
