import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us | ThePropertyFolio",
  description: "Get in touch with ThePropertyFolio team. We're here to help tenants find homes and owners manage their portfolios.",
  alternates: { canonical: "/contact" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "ThePropertyFolio",
  description: "Premium property management services for tenants and owners",
  url: "https://thepropertyfolio.com",
  telephone: "+1-555-123-4567",
  email: "contact@thepropertyfolio.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "123 Property Lane, Suite 400",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    postalCode: "94102",
    addressCountry: "US",
  },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"], opens: "09:00", closes: "18:00" },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContactClient />
    </>
  );
}
