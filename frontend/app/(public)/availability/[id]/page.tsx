"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Bed, Bath, Square, Heart, CheckCircle, Calendar, Shield } from "lucide-react";

// Same mock data as availability page
const MOCK_PROPERTIES = [
  { id: "1", title: "Modern Downtown Penthouse", address: "400 Market St", city: "San Francisco, CA", bedrooms: 3, bathrooms: 2, square_feet: 1850, monthly_rent: 4200, deposit: 6300, status: "available", available_date: "June 1, 2025", images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"], amenities: ["Pool", "Gym", "Parking", "Concierge", "Rooftop", "Pet Friendly"], property_type: "apartment", description: "Experience elevated city living in this stunning penthouse apartment. Floor-to-ceiling windows offer breathtaking views of the San Francisco skyline. The chef's kitchen features premium appliances, quartz countertops, and a large island perfect for entertaining. The primary suite boasts a spa-like bathroom with soaking tub and walk-in closet." },
  { id: "2", title: "Luxury Hillside Villa", address: "1820 Laurel Canyon Blvd", city: "Los Angeles, CA", bedrooms: 4, bathrooms: 3, square_feet: 2600, monthly_rent: 7500, deposit: 11250, status: "available", available_date: "May 15, 2025", images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"], amenities: ["Pool", "Garden", "Parking", "Fireplace", "Smart Home"], property_type: "house", description: "Nestled in the iconic Laurel Canyon, this luxury villa offers unparalleled privacy and sophisticated living. The open-plan living and dining area flows seamlessly onto a sprawling terrace with an infinity pool overlooking the canyon. Perfect for families or those who love to entertain." },
  { id: "3", title: "SoHo Loft Apartment", address: "88 Prince Street", city: "New York, NY", bedrooms: 2, bathrooms: 2, square_feet: 1200, monthly_rent: 5800, deposit: 8700, status: "coming_soon", available_date: "July 1, 2025", images: ["https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=80"], amenities: ["Concierge", "Rooftop", "Gym", "Bike Storage"], property_type: "apartment", description: "A true New York loft in the heart of SoHo with exposed brick walls, soaring 14-ft ceilings, and original cast-iron columns. This historic building has been thoughtfully renovated to combine its iconic industrial character with contemporary luxury." },
  { id: "4", title: "Beachfront Condo", address: "2300 Ocean Drive", city: "Miami, FL", bedrooms: 2, bathrooms: 2, square_feet: 1100, monthly_rent: 3900, deposit: 5850, status: "available", available_date: "June 1, 2025", images: ["https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80"], amenities: ["Beach Access", "Pool", "Parking", "Gym"], property_type: "condo", description: "Wake up to stunning ocean views from this beautifully appointed beachfront condo on Miami's famous Ocean Drive. Steps from the sand, this modern unit features an open floor plan, gourmet kitchen, and a large balcony perfect for watching sunsets." },
  { id: "5", title: "Historic Brownstone", address: "45 Beacon St", city: "Boston, MA", bedrooms: 3, bathrooms: 2.5, square_feet: 2100, monthly_rent: 4600, deposit: 6900, status: "available", available_date: "May 1, 2025", images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80"], amenities: ["Garden", "Parking", "Storage", "Fireplace"], property_type: "house", description: "A rare opportunity to live in one of Boston's finest historic brownstones on prestigious Beacon Street. Original period details including ornate mantlepieces and hardwood floors throughout, lovingly paired with modern kitchen and bath upgrades." },
  { id: "6", title: "Midtown Studio Luxury", address: "350 5th Ave", city: "New York, NY", bedrooms: 1, bathrooms: 1, square_feet: 650, monthly_rent: 3200, deposit: 4800, status: "available", available_date: "June 15, 2025", images: ["https://images.unsplash.com/photo-1536376074432-ad7174e1c7c2?auto=format&fit=crop&w=1200&q=80"], amenities: ["Gym", "Concierge", "Furnished", "Doorman"], property_type: "apartment", description: "Sophisticated Midtown studio with panoramic city views and premium finishes. Fully furnished with custom Italian millwork, built-in storage solutions, and a state-of-the-art kitchen. Steps from world-class dining, shopping, and transport." },
  { id: "7", title: "Industrial Tech Office Space", address: "123 Innovation Way", city: "Austin, TX", bedrooms: 0, bathrooms: 2, square_feet: 4500, monthly_rent: 12500, deposit: 18750, status: "available", available_date: "May 1, 2025", images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"], amenities: ["Fibre Optic", "Parking", "Open Plan", "Conference Rooms", "Kitchen"], property_type: "commercial", description: "Premium open-plan office space in Austin's innovation district. This modern industrial space features exposed concrete, high ceilings, and abundant natural light. Ready for immediate occupancy with flexible lease terms." },
  { id: "8", title: "Riverside Townhome", address: "55 Water St", city: "Austin, TX", bedrooms: 3, bathrooms: 3, square_feet: 1800, monthly_rent: 3800, deposit: 5700, status: "available", available_date: "June 1, 2025", images: ["/images/riverside_townhome.png"], amenities: ["Pool", "Deck", "Parking", "Dog Park"], property_type: "townhome", description: "Beautiful multi-level townhome right on the riverbank. This modern home features an open floor plan on the main level, three spacious bedrooms upstairs, and a private rooftop deck with stunning river views." },
  { id: "9", title: "Minimalist Forest House", address: "890 Pine Road", city: "Seattle, WA", bedrooms: 2, bathrooms: 1, square_feet: 950, monthly_rent: 2800, deposit: 4200, status: "available", available_date: "May 15, 2025", images: ["/images/forest_house.png"], amenities: ["View", "Fireplace", "Garden", "EV Charging"], property_type: "house", description: "A serene Pacific Northwest retreat surrounded by towering firs. This architect-designed home maximizes natural light with floor-to-ceiling windows and blurs the line between indoor and outdoor living with multiple patios and a wraparound deck." },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "available") return (
    <span className="badge-available inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold">
      <span className="w-2 h-2 rounded-full bg-success" />Available Now
    </span>
  );
  if (status === "coming_soon") return (
    <span className="badge-coming-soon inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold">
      Coming Soon
    </span>
  );
  return <span className="badge-leased inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold">Leased</span>;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const property = MOCK_PROPERTIES.find((p) => p.id === params.id);

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Property Not Found</h1>
          <p className="text-foreground-secondary mb-8">This property may no longer be available.</p>
          <Link href="/availability" className="btn-primary justify-center">Browse All Properties</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-24">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 rounded-2xl overflow-hidden h-72 md:h-96">
          <div className="md:col-span-2 relative overflow-hidden">
            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
          </div>
          {property.images[1] && (
            <div className="hidden md:block relative overflow-hidden">
              <img src={property.images[1]} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <StatusBadge status={property.status} />
                  <h1 className="text-3xl font-bold text-foreground mt-3 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>{property.title}</h1>
                  <p className="flex items-center gap-1.5 text-foreground-secondary">
                    <MapPin className="w-4 h-4" /> {property.address}, {property.city}
                  </p>
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { icon: Bed, label: "Bedrooms", value: property.bedrooms === 0 ? "Studio" : `${property.bedrooms} Beds` },
                  { icon: Bath, label: "Bathrooms", value: `${property.bathrooms} Baths` },
                  { icon: Square, label: "Area", value: `${property.square_feet.toLocaleString()} ft²` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="glass-card p-4 text-center">
                    <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-xs text-foreground-muted mb-1">{label}</p>
                    <p className="text-sm font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="glass-card p-6">
              <h2 className="font-semibold text-foreground mb-3">About This Property</h2>
              <p className="text-foreground-secondary leading-relaxed">{property.description}</p>
            </div>

            {/* Amenities */}
            <div className="glass-card p-6">
              <h2 className="font-semibold text-foreground mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm text-foreground-secondary">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 sticky top-24">
              <div className="mb-4">
                <p className="text-3xl font-bold text-foreground">
                  ${property.monthly_rent.toLocaleString()}
                  <span className="text-base font-normal text-foreground-muted">/mo</span>
                </p>
                <p className="text-sm text-foreground-muted mt-1">Deposit: ${property.deposit.toLocaleString()}</p>
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center gap-2 text-foreground-secondary">
                  <Calendar className="w-4 h-4 text-primary" />
                  Available: {property.available_date}
                </div>
                <div className="flex items-center gap-2 text-foreground-secondary">
                  <Shield className="w-4 h-4 text-primary" />
                  {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)}
                </div>
              </div>

              <Link href="/tenants/register" className="btn-primary w-full justify-center py-3 mb-3">
                Apply Now
              </Link>
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
