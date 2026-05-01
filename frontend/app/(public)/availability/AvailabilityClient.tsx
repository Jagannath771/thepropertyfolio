"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, SlidersHorizontal, Grid3X3, List, MapPin, Bed, Bath, Square, Heart, ArrowRight, X } from "lucide-react";

const PROPERTY_TYPES = ["All", "House", "Apartment", "Condo", "Commercial", "Townhome"];
const AMENITIES = ["Pet Friendly", "Parking", "Pool", "Gym", "Washer/Dryer", "Furnished", "Rooftop", "Concierge"];

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

// Mock data for demonstration
const MOCK_PROPERTIES = [
  { id: "1", title: "Modern Downtown Penthouse", address: "400 Market St", city: "San Francisco, CA", bedrooms: 3, bathrooms: 2, square_feet: 1850, monthly_rent: 4200, status: "available", images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80"], amenities: ["Pool", "Gym", "Parking"], property_type: "apartment" },
  { id: "2", title: "Luxury Hillside Villa", address: "1820 Laurel Canyon Blvd", city: "Los Angeles, CA", bedrooms: 4, bathrooms: 3, square_feet: 2600, monthly_rent: 7500, status: "available", images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80"], amenities: ["Pool", "Garden", "Parking"], property_type: "house" },
  { id: "3", title: "SoHo Loft Apartment", address: "88 Prince Street", city: "New York, NY", bedrooms: 2, bathrooms: 2, square_feet: 1200, monthly_rent: 5800, status: "coming_soon", images: ["https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=600&q=80"], amenities: ["Concierge", "Rooftop", "Gym"], property_type: "apartment" },
  { id: "4", title: "Beachfront Condo", address: "2300 Ocean Drive", city: "Miami, FL", bedrooms: 2, bathrooms: 2, square_feet: 1100, monthly_rent: 3900, status: "available", images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80"], amenities: ["Beach Access", "Pool", "Parking"], property_type: "condo" },
  { id: "5", title: "Historic Brownstone", address: "45 Beacon St", city: "Boston, MA", bedrooms: 3, bathrooms: 2.5, square_feet: 2100, monthly_rent: 4600, status: "available", images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=600&q=80"], amenities: ["Garden", "Parking", "Storage"], property_type: "house" },
  { id: "6", title: "Midtown Studio Luxury", address: "350 5th Ave", city: "New York, NY", bedrooms: 1, bathrooms: 1, square_feet: 650, monthly_rent: 3200, status: "available", images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80"], amenities: ["Gym", "Concierge", "Furnished"], property_type: "apartment" },
  { id: "7", title: "Industrial Tech Office Space", address: "123 Innovation Way", city: "Austin, TX", bedrooms: 0, bathrooms: 2, square_feet: 4500, monthly_rent: 12500, status: "available", images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80"], amenities: ["Fibre Optic", "Parking", "Open Plan"], property_type: "commercial" },
  { id: "8", title: "Riverside Townhome", address: "55 Water St", city: "Austin, TX", bedrooms: 3, bathrooms: 3, square_feet: 1800, monthly_rent: 3800, status: "available", images: ["/images/riverside_townhome.png"], amenities: ["Pool", "Deck", "Parking"], property_type: "townhome" },
  { id: "9", title: "Minimalist Forest House", address: "890 Pine Road", city: "Seattle, WA", bedrooms: 2, bathrooms: 1, square_feet: 950, monthly_rent: 2800, status: "available", images: ["/images/forest_house.png"], amenities: ["View", "Fireplace", "Garden"], property_type: "house" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "available") return <span className="badge-available"><span className="w-1.5 h-1.5 rounded-full bg-success" />Available</span>;
  if (status === "coming_soon") return <span className="badge-coming-soon">Coming Soon</span>;
  return <span className="badge-leased">Leased</span>;
}

function PropertyGridCard({ p }: { p: typeof MOCK_PROPERTIES[0] }) {
  const [saved, setSaved] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3 }}
      className="glass-card overflow-hidden group"
    >
      <div className="relative h-52 overflow-hidden">
        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 left-3"><StatusBadge status={p.status} /></div>
        <button
          onClick={() => setSaved(!saved)}
          className="absolute top-3 right-3 p-2 rounded-lg"
          style={{ background: "rgba(10,15,30,0.7)", backdropFilter: "blur(8px)" }}
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-red-400 text-red-400" : "text-white"}`} />
        </button>
        <div className="absolute bottom-3 left-3 text-white font-bold text-xl">
          ${p.monthly_rent.toLocaleString()}<span className="text-sm font-normal text-white/70">/mo</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 truncate">{p.title}</h3>
        <p className="text-sm text-foreground-muted flex items-center gap-1 mb-3"><MapPin className="w-3.5 h-3.5" />{p.city}</p>
        <div className="flex gap-4 text-xs text-foreground-secondary mb-3">
          <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{p.bedrooms}bd</span>
          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{p.bathrooms}ba</span>
          <span className="flex items-center gap-1"><Square className="w-3.5 h-3.5" />{p.square_feet.toLocaleString()} ft²</span>
        </div>
        <Link href={`/availability/${p.id}`} className="btn-primary w-full justify-center py-2.5 text-sm">
          View Details <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function AvailabilityClient() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = MOCK_PROPERTIES.filter((p) => {
    if (filters.type !== "All" && p.property_type !== filters.type.toLowerCase()) return false;
    if (filters.search && !p.title.toLowerCase().includes(filters.search.toLowerCase()) && !p.city.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (p.monthly_rent < filters.minRent || p.monthly_rent > filters.maxRent) return false;
    if (filters.bedrooms && p.bedrooms < filters.bedrooms) return false;
    if (filters.amenities.length > 0 && !filters.amenities.every((a) => p.amenities.includes(a))) return false;
    return true;
  }).sort((a, b) => {
    if (filters.sortBy === "price_asc") return a.monthly_rent - b.monthly_rent;
    if (filters.sortBy === "price_desc") return b.monthly_rent - a.monthly_rent;
    // "newest" — sort by id descending (highest id = newest)
    return Number(b.id) - Number(a.id);
  });

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <div className="relative py-20 text-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1920&q=80" alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,15,30,0.8), rgba(10,15,30,0.95))" }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-4">
          <h1 className="section-title mb-4">Find Your <span className="gradient-text">Perfect Home</span></h1>
          <p className="text-foreground-secondary mb-8">Browse {MOCK_PROPERTIES.length}+ curated properties across top cities nationwide.</p>
          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search by city, neighborhood, or property name..."
              className="input-glass w-full pl-11 pr-4 py-4 text-sm"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Filter Bar */}
        <div className="glass-card p-4 mb-8 sticky top-20 z-30">
          <div className="flex flex-wrap items-center gap-3">
            {/* Property Type */}
            <div className="flex gap-1.5 flex-wrap">
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilters((f) => ({ ...f, type: t }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.type === t ? "bg-primary text-white" : "text-foreground-secondary hover:bg-white/5"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            {/* Bedroom filter */}
            <div className="flex gap-1">
              {[null, 1, 2, 3, 4].map((b) => (
                <button
                  key={b ?? "any"}
                  onClick={() => setFilters((f) => ({ ...f, bedrooms: b }))}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.bedrooms === b ? "bg-primary/20 text-primary border border-primary/30" : "text-foreground-muted hover:bg-white/5"}`}
                >
                  {b === null ? "Any" : `${b}+`} bd
                </button>
              ))}
            </div>
            {/* View toggle */}
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
              <button onClick={() => setView("grid")} className={`p-1.5 rounded-md transition-all ${view === "grid" ? "bg-primary/20 text-primary" : "text-foreground-muted"}`}><Grid3X3 className="w-4 h-4" /></button>
              <button onClick={() => setView("list")} className={`p-1.5 rounded-md transition-all ${view === "list" ? "bg-primary/20 text-primary" : "text-foreground-muted"}`}><List className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-foreground-secondary">
            <span className="text-foreground font-semibold">{filtered.length}</span> properties found
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

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-foreground-muted text-lg mb-4">No properties match your filters.</p>
            <button onClick={() => setFilters(DEFAULT_FILTERS)} className="btn-outline px-6">Reset Filters</button>
          </div>
        ) : (
          <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filtered.map((p) => <PropertyGridCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
