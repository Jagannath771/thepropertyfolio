"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Bed, Bath, Square, MapPin, Heart, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  monthly_rent: number;
  status: string;
  images: string[];
  amenities: string[];
}

// Placeholder properties for demonstration (replaced by API data in production)
const PLACEHOLDER_PROPERTIES: Property[] = [
  {
    id: "1",
    title: "Modern Downtown Penthouse",
    address: "400 Market St",
    city: "San Francisco, CA",
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1850,
    monthly_rent: 4200,
    status: "available",
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80"],
    amenities: ["Pool", "Gym", "Parking"],
  },
  {
    id: "2",
    title: "Luxury Hillside Villa",
    address: "1820 Laurel Canyon Blvd",
    city: "Los Angeles, CA",
    bedrooms: 4,
    bathrooms: 3,
    square_feet: 2600,
    monthly_rent: 7500,
    status: "available",
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80"],
    amenities: ["Pool", "Garden", "Parking"],
  },
  {
    id: "3",
    title: "SoHo Loft Apartment",
    address: "88 Prince Street",
    city: "New York, NY",
    bedrooms: 2,
    bathrooms: 2,
    square_feet: 1200,
    monthly_rent: 5800,
    status: "coming_soon",
    images: ["https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=600&q=80"],
    amenities: ["Concierge", "Rooftop", "Gym"],
  },
  {
    id: "4",
    title: "Beachfront Condo",
    address: "2300 Ocean Drive",
    city: "Miami, FL",
    bedrooms: 2,
    bathrooms: 2,
    square_feet: 1100,
    monthly_rent: 3900,
    status: "available",
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80"],
    amenities: ["Beach Access", "Pool", "Parking"],
  },
  {
    id: "5",
    title: "Historic Brownstone",
    address: "45 Beacon St",
    city: "Boston, MA",
    bedrooms: 3,
    bathrooms: 2.5,
    square_feet: 2100,
    monthly_rent: 4600,
    status: "available",
    images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=600&q=80"],
    amenities: ["Garden", "Parking", "Storage"],
  },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "available") return <span className="badge-available"><span className="w-1.5 h-1.5 rounded-full bg-success" />Available</span>;
  if (status === "coming_soon") return <span className="badge-coming-soon">Coming Soon</span>;
  return <span className="badge-leased">Leased</span>;
}

function PropertyCard({ property }: { property: Property }) {
  const [saved, setSaved] = useState(false);
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card overflow-hidden flex-shrink-0 w-72 sm:w-80 cursor-pointer group"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 left-3">
          <StatusBadge status={property.status} />
        </div>
        <button
          onClick={(e) => { e.preventDefault(); setSaved(!saved); }}
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
            ${property.monthly_rent.toLocaleString()}
            <span className="text-sm font-normal text-white/70">/mo</span>
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 truncate">{property.title}</h3>
        <div className="flex items-center gap-1 text-sm text-foreground-muted mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {property.city}
        </div>
        <div className="flex items-center gap-4 text-xs text-foreground-secondary mb-4">
          <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{property.bedrooms} Beds</span>
          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms} Baths</span>
          <span className="flex items-center gap-1"><Square className="w-3.5 h-3.5" />{property.square_feet.toLocaleString()} ft²</span>
        </div>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {property.amenities.slice(0, 3).map((a) => (
            <span key={a} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(99,102,241,0.1)", color: "#A5B4FC", border: "1px solid rgba(99,102,241,0.2)" }}>{a}</span>
          ))}
        </div>
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

export default function FeaturedProperties() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
    }
  };

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-2">Featured</p>
            <h2 className="section-title">
              Hand-Picked <span className="gradient-text">Listings</span>
            </h2>
          </motion.div>
          <div className="hidden sm:flex items-center gap-3">
            <button onClick={() => scroll("left")} className="p-2.5 rounded-xl glass-card hover:border-primary/30 transition-all" aria-label="Scroll left">
              <ChevronLeft className="w-5 h-5 text-foreground-secondary" />
            </button>
            <button onClick={() => scroll("right")} className="p-2.5 rounded-xl glass-card hover:border-primary/30 transition-all" aria-label="Scroll right">
              <ChevronRight className="w-5 h-5 text-foreground-secondary" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
        >
          {PLACEHOLDER_PROPERTIES.map((p, i) => (
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
