"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  CheckCircle,
  Calendar,
  Shield,
  Loader2,
} from "lucide-react";

import type { Property } from "@/lib/types";
import { getAccessToken } from "@/lib/auth-client";
import { submitApplication } from "@/lib/applications";
import { ApiError } from "@/lib/api";

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 675'><rect width='1200' height='675' fill='%23111827'/><text x='50%' y='50%' fill='%236B7280' font-family='sans-serif' font-size='24' text-anchor='middle' dominant-baseline='middle'>No photo yet</text></svg>";

function StatusBadge({ status }: { status: string }) {
  if (status === "available")
    return (
      <span className="badge-available inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold">
        <span className="w-2 h-2 rounded-full bg-success" />
        Available Now
      </span>
    );
  if (status === "coming_soon")
    return (
      <span className="badge-coming-soon inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold">
        Coming Soon
      </span>
    );
  return (
    <span className="badge-leased inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold">
      Leased
    </span>
  );
}

function formatAvailableDate(iso: string | null): string {
  if (!iso) return "Available immediately";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PropertyDetailClient({ property }: { property: Property }) {
  const router = useRouter();
  const heroImage = property.images[0] ?? FALLBACK_IMAGE;
  const secondImage = property.images[1];
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    if (applying) return;
    // Not signed in -> send to login, remembering where to return.  We
    // deliberately route to /tenants/login (not /tenants/register) so
    // existing tenants don't get sent to a signup screen.
    if (!getAccessToken()) {
      const next = encodeURIComponent(`/availability/${property.id}`);
      router.push(`/tenants/login?next=${next}&apply=1`);
      return;
    }
    setApplying(true);
    try {
      await submitApplication({ property_id: property.id });
      toast.success("Application submitted", {
        description: "We'll notify you as soon as the owner reviews it.",
      });
      router.push("/tenants/dashboard");
    } catch (err) {
      const e = err as ApiError | Error;
      const status = (e as ApiError).status;
      if (status === 401 || status === 403) {
        // Token expired, wrong role, or unverified email.  Bounce to login
        // so they can re-auth and try again.
        const next = encodeURIComponent(`/availability/${property.id}`);
        router.push(`/tenants/login?next=${next}&apply=1`);
        return;
      }
      if (status === 409) {
        toast.info("You already applied for this property.", {
          description: "Check your dashboard for the current status.",
          action: {
            label: "View",
            onClick: () => router.push("/tenants/dashboard"),
          },
        });
        return;
      }
      toast.error(e.message || "Could not submit application.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 rounded-2xl overflow-hidden h-72 md:h-96">
          <div className="md:col-span-2 relative overflow-hidden">
            <img src={heroImage} alt={property.title} className="w-full h-full object-cover" />
          </div>
          {secondImage && (
            <div className="hidden md:block relative overflow-hidden">
              <img src={secondImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <StatusBadge status={property.status} />
                  <h1
                    className="text-3xl font-bold text-foreground mt-3 mb-2"
                    style={{ fontFamily: "var(--font-playfair)" }}
                    data-testid="property-title"
                  >
                    {property.title}
                  </h1>
                  <p className="flex items-center gap-1.5 text-foreground-secondary">
                    <MapPin className="w-4 h-4" /> {property.address}
                    {property.city && `, ${property.city}`}
                    {property.state && `, ${property.state}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  {
                    icon: Bed,
                    label: "Bedrooms",
                    value:
                      property.bedrooms === 0
                        ? "Studio"
                        : property.bedrooms
                          ? `${property.bedrooms} Beds`
                          : "—",
                  },
                  {
                    icon: Bath,
                    label: "Bathrooms",
                    value: property.bathrooms ? `${property.bathrooms} Baths` : "—",
                  },
                  {
                    icon: Square,
                    label: "Area",
                    value: property.square_feet
                      ? `${property.square_feet.toLocaleString()} ft²`
                      : "—",
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="glass-card p-4 text-center">
                    <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-xs text-foreground-muted mb-1">{label}</p>
                    <p className="text-sm font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {property.description && (
              <div className="glass-card p-6">
                <h2 className="font-semibold text-foreground mb-3">About This Property</h2>
                <p className="text-foreground-secondary leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            )}

            {property.amenities.length > 0 && (
              <div className="glass-card p-6">
                <h2 className="font-semibold text-foreground mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 text-sm text-foreground-secondary"
                    >
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 sticky top-24"
            >
              <div className="mb-4">
                <p className="text-3xl font-bold text-foreground">
                  {property.monthly_rent
                    ? `$${property.monthly_rent.toLocaleString()}`
                    : "Contact for pricing"}
                  {property.monthly_rent && (
                    <span className="text-base font-normal text-foreground-muted">/mo</span>
                  )}
                </p>
                {property.deposit && (
                  <p className="text-sm text-foreground-muted mt-1">
                    Deposit: ${property.deposit.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center gap-2 text-foreground-secondary">
                  <Calendar className="w-4 h-4 text-primary" />
                  {formatAvailableDate(property.available_date)}
                </div>
                {property.property_type && (
                  <div className="flex items-center gap-2 text-foreground-secondary">
                    <Shield className="w-4 h-4 text-primary" />
                    {property.property_type.charAt(0).toUpperCase() +
                      property.property_type.slice(1)}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleApply}
                disabled={applying || property.status === "leased"}
                className="btn-primary w-full justify-center py-3 mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="apply-now"
              >
                {applying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                  </>
                ) : property.status === "leased" ? (
                  "Currently Leased"
                ) : (
                  "Apply Now"
                )}
              </button>
              <button className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium text-foreground-secondary hover:bg-white/5 transition-colors border border-white/10">
                <Heart className="w-4 h-4" /> Save Property
              </button>

              <p className="text-xs text-foreground-muted text-center mt-4">
                Managed by ThePropertyFolio · No hidden fees
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
