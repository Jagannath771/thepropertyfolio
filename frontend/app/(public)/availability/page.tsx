import type { Metadata } from "next";
import AvailabilityClient from "./AvailabilityClient";

export const metadata: Metadata = {
  title: "Available Rental Properties | ThePropertyFolio",
  description:
    "Browse available homes, apartments, and commercial spaces. Filter by location, price, beds, baths, and amenities. Find your perfect rental today.",
  alternates: { canonical: "/availability" },
  openGraph: {
    title: "Available Rental Properties | ThePropertyFolio",
    description: "Browse available homes, apartments, and commercial spaces.",
    images: ["/og-availability.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Available Rental Properties — ThePropertyFolio",
  description: "Browse our curated selection of available rental properties",
  url: "https://thepropertyfolio.com/availability",
};

export default function AvailabilityPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AvailabilityClient />
    </>
  );
}
