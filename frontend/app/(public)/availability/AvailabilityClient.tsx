"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Grid3X3,
  List,
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  ArrowRight,
  AlertTriangle,
  Home as HomeIcon,
} from "lucide-react";

import { listProperties } from "@/lib/properties";
import type { Property } from "@/lib/types";

const PROPERTY_TYPES = ["All", "House", "Apartment", "Condo", "Commercial", "Townhome"];

interface Filters {
  type: string;
  search: string;
  minRent: number;
  maxRent: number;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: string[];
  sortBy: string;
}

const DEFAULT_FILTERS: Filters = {
  type: "All",
  search: "",
  minRent: 500,
  maxRent: 10000,
  bedrooms: null,
  bathrooms: null,
  amenities: [],
  sortBy: "newest",
};

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23111827'/><text x='50%' y='50%' fill='%236B7280' font-family='sans-serif' font-size='18' text-anchor='middle' dominant-baseline='middle'>No photo yet</text></svg>";

function firstImage(images: string[] | null | undefined): string {
  if (!images || images.length === 0) return FALLBACK_IMAGE;
  return images[0];
}

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

function PropertyGridCard({ p }: { p: Property }) {
  const [saved, setSaved] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3 }}
      className="glass-card overflow-hidden group"
      data-testid="property-card"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={firstImage(p.images)}
          alt={p.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 left-3">
          <StatusBadge status={p.status} />
        </div>
        <button
          onClick={() => setSaved(!saved)}
          className="absolute top-3 right-3 p-2 rounded-lg"
          style={{ background: "rgba(10,15,30,0.7)", backdropFilter: "blur(8px)" }}
          aria-label="Save property"
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-red-400 text-red-400" : "text-white"}`} />
        </button>
        <div className="absolute bottom-3 left-3 text-white font-bold text-xl">
          {p.monthly_rent ? `$${p.monthly_rent.toLocaleString()}` : "Contact for pricing"}
          {p.monthly_rent && (
            <span className="text-sm font-normal text-white/70">/mo</span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 truncate">{p.title}</h3>
        <p className="text-sm text-foreground-muted flex items-center gap-1 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          {[p.city, p.state].filter(Boolean).join(", ") || p.address}
        </p>
        <div className="flex gap-4 text-xs text-foreground-secondary mb-3">
          <span className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            {p.bedrooms ?? 0}bd
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            {p.bathrooms ?? 0}ba
          </span>
          <span className="flex items-center gap-1">
            <Square className="w-3.5 h-3.5" />
            {p.square_feet ? `${p.square_feet.toLocaleString()} ft²` : "—"}
          </span>
        </div>
        <Link
          href={`/availability/${p.id}`}
          className="btn-primary w-full justify-center py-2.5 text-sm"
        >
          View Details <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden animate-pulse" aria-hidden>
      <div className="h-52 bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-2/3 bg-white/5 rounded" />
        <div className="h-3 w-1/2 bg-white/5 rounded" />
        <div className="h-3 w-3/4 bg-white/5 rounded" />
        <div className="h-9 w-full bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="text-center py-20 glass-card" data-testid="availability-empty">
      <HomeIcon className="w-10 h-10 text-primary mx-auto mb-4" />
      <p className="text-foreground text-lg mb-2 font-semibold">
        {hasFilters ? "No properties match your filters." : "No properties available yet."}
      </p>
      <p className="text-foreground-muted text-sm mb-6 max-w-md mx-auto">
        {hasFilters
          ? "Try loosening your search — clear filters or broaden the rent range."
          : "New listings are added regularly. Are you a property owner? List yours in minutes."}
      </p>
      {hasFilters ? (
        <button onClick={onReset} className="btn-outline px-6">
          Reset Filters
        </button>
      ) : (
        <Link href="/owners/register" className="btn-primary px-6">
          List your property <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="text-center py-20 glass-card border border-danger/30"
      role="alert"
      data-testid="availability-error"
    >
      <AlertTriangle className="w-10 h-10 text-danger mx-auto mb-4" />
      <p className="text-foreground text-lg mb-2 font-semibold">Couldn't load listings</p>
      <p className="text-foreground-muted text-sm mb-6">{message}</p>
      <button onClick={onRetry} className="btn-primary px-6">
        Try again
      </button>
    </div>
  );
}

export default function AvailabilityClient() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [items, setItems] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input to avoid hammering the API.
  useEffect(() => {
    if (debouncedSearchRef.current) clearTimeout(debouncedSearchRef.current);
    debouncedSearchRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 300);
    return () => {
      if (debouncedSearchRef.current) clearTimeout(debouncedSearchRef.current);
    };
  }, [filters.search]);

  const queryParams = useMemo(
    () => ({
      property_type:
        filters.type !== "All" ? filters.type.toLowerCase() : undefined,
      search: debouncedSearch || undefined,
      min_rent: filters.minRent,
      max_rent: filters.maxRent,
      bedrooms: filters.bedrooms ?? undefined,
      amenities: filters.amenities.length ? filters.amenities : undefined,
      sort_by:
        filters.sortBy === "price_asc" || filters.sortBy === "price_desc"
          ? "monthly_rent"
          : "created_at",
      sort_order:
        filters.sortBy === "price_asc"
          ? ("asc" as const)
          : ("desc" as const),
      page_size: 24,
    }),
    [filters, debouncedSearch],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listProperties(queryParams, false)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || "Unexpected error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [queryParams, reloadKey]);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  const hasActiveFilters =
    filters.type !== "All" ||
    filters.search.trim() !== "" ||
    filters.minRent !== DEFAULT_FILTERS.minRent ||
    filters.maxRent !== DEFAULT_FILTERS.maxRent ||
    filters.bedrooms !== null ||
    filters.amenities.length > 0;

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <div className="relative py-20 text-center overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(10,15,30,0.95), rgba(30,41,95,0.92))",
            }}
          />
        </div>
        <div className="relative max-w-3xl mx-auto px-4">
          <h1 className="section-title mb-4">
            Find Your <span className="gradient-text">Perfect Home</span>
          </h1>
          <p className="text-foreground-secondary mb-8">
            {loading
              ? "Loading live inventory…"
              : total > 0
                ? `Browse ${total.toLocaleString()} curated ${total === 1 ? "property" : "properties"} across top cities.`
                : "New listings are added daily. Check back soon."}
          </p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search by city, neighborhood, or property name..."
              className="input-glass w-full pl-11 pr-4 py-4 text-sm"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Filter Bar */}
        <div className="glass-card p-4 mb-8 sticky top-20 z-30">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1.5 flex-wrap">
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilters((f) => ({ ...f, type: t }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filters.type === t
                      ? "bg-primary text-white"
                      : "text-foreground-secondary hover:bg-white/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex gap-1">
              {[null, 1, 2, 3, 4].map((b) => (
                <button
                  key={b ?? "any"}
                  onClick={() => setFilters((f) => ({ ...f, bedrooms: b }))}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filters.bedrooms === b
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-foreground-muted hover:bg-white/5"
                  }`}
                >
                  {b === null ? "Any" : `${b}+`} bd
                </button>
              ))}
            </div>
            <div
              className="flex gap-1 p-1 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <button
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-md transition-all ${
                  view === "grid" ? "bg-primary/20 text-primary" : "text-foreground-muted"
                }`}
                aria-label="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-1.5 rounded-md transition-all ${
                  view === "list" ? "bg-primary/20 text-primary" : "text-foreground-muted"
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-foreground-secondary">
            {loading ? (
              <span className="inline-block h-4 w-24 bg-white/5 rounded animate-pulse" />
            ) : (
              <>
                <span className="text-foreground font-semibold" data-testid="results-count">
                  {items.length}
                </span>{" "}
                of {total.toLocaleString()} properties
              </>
            )}
          </p>
          <select
            className="input-glass py-2 text-sm w-40"
            value={filters.sortBy}
            onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low→High</option>
            <option value="price_desc">Price: High→Low</option>
          </select>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : loading ? (
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} onReset={resetFilters} />
        ) : (
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {items.map((p) => (
              <PropertyGridCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
