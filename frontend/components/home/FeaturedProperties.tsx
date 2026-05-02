"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Heart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { listProperties } from "@/lib/properties";
import type { Property } from "@/lib/types";

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23111827'/><text x='50%' y='50%' fill='%236B7280' font-family='sans-serif' font-size='18' text-anchor='middle' dominant-baseline='middle'>No photo yet</text></svg>";

function StatusBadge({ status }: { status: string }) {
  if (status === "available")
    return (
      <span className="badge-available">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        Available
      </span>
    );
  if (status === "coming_soon") return <span className="badge-coming-soon">Coming Soon</span>;
  return <span className="badge-leased">Leased</span>;
}

function PropertyCard({ property }: { property: Property }) {
  const [saved, setSaved] = useState(false);
  const image = property.images[0] ?? FALLBACK_IMAGE;
  const location = [property.city, property.state].filter(Boolean).join(", ") || property.address;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card overflow-hidden flex-shrink-0 w-72 sm:w-80 cursor-pointer group"
      data-testid="featured-property-card"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 left-3">
          <StatusBadge status={property.status} />
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            setSaved(!saved);
          }}
          className="absolute top-3 right-3 p-2 rounded-lg transition-all duration-200"
          style={{ background: "rgba(10,15,30,0.7)", backdropFilter: "blur(8px)" }}
          aria-label="Save property"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${saved ? "fill-red-400 text-red-400" : "text-white"}`}
          />
        </button>
        <div className="absolute bottom-3 left-3">
          <span className="text-white font-bold text-xl">
            {property.monthly_rent
              ? `$${property.monthly_rent.toLocaleString()}`
              : "Contact"}
            {property.monthly_rent && (
              <span className="text-sm font-normal text-white/70">/mo</span>
            )}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 truncate">{property.title}</h3>
        <div className="flex items-center gap-1 text-sm text-foreground-muted mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {location}
        </div>
        <div className="flex items-center gap-4 text-xs text-foreground-secondary mb-4">
          <span className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            {property.bedrooms ?? 0} Beds
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            {property.bathrooms ?? 0} Baths
          </span>
          <span className="flex items-center gap-1">
            <Square className="w-3.5 h-3.5" />
            {property.square_feet ? `${property.square_feet.toLocaleString()} ft²` : "—"}
          </span>
        </div>
        {property.amenities.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {property.amenities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: "rgba(99,102,241,0.1)",
                  color: "#A5B4FC",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
                {a}
              </span>
            ))}
          </div>
        )}
        <Link
          href={`/availability/${property.id}`}
          className="btn-primary w-full justify-center py-2.5 text-sm"
        >
          View Details
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="glass-card overflow-hidden flex-shrink-0 w-72 sm:w-80 animate-pulse"
      aria-hidden
    >
      <div className="h-48 bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 bg-white/5 rounded" />
        <div className="h-3 w-1/2 bg-white/5 rounded" />
        <div className="h-3 w-2/3 bg-white/5 rounded" />
        <div className="h-9 w-full bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

export default function FeaturedProperties() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listProperties({ featured_only: true, page_size: 6 }, 60)
      .then((res) => {
        if (cancelled) return;
        // If there are no featured listings yet, fall back to the 6 newest
        // available ones so the section never renders empty on a live site.
        if (res.items.length === 0) {
          return listProperties({ page_size: 6 }, 60).then((fallback) => {
            if (!cancelled) setItems(fallback.items);
          });
        }
        setItems(res.items);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "Unexpected error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
    }
  };

  // Silently hide the section if the live data lookup failed — this is a
  // marketing surface, not a critical path. The availability page and SEO
  // remain intact.
  if (!loading && !error && items.length === 0) return null;
  if (error && !loading) return null;

  return (
    <section className="py-24" data-testid="featured-properties">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-2">
              Featured
            </p>
            <h2 className="section-title">
              Hand-Picked <span className="gradient-text">Listings</span>
            </h2>
          </motion.div>
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              className="p-2.5 rounded-xl glass-card hover:border-primary/30 transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-foreground-secondary" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2.5 rounded-xl glass-card hover:border-primary/30 transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-foreground-secondary" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex gap-6 overflow-x-auto scrollbar-hide pb-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : items.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <PropertyCard property={p} />
                </motion.div>
              ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/availability" className="btn-outline px-8 py-3">
            Browse All Properties
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
