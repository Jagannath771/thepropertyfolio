import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import StatsBar from "@/components/home/StatsBar";
import ServicesGrid from "@/components/home/ServicesGrid";
import TestimonialsCarousel from "@/components/home/TestimonialsCarousel";
import HowItWorks from "@/components/home/HowItWorks";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import CTABanner from "@/components/home/CTABanner";

export const metadata: Metadata = {
  title: "ThePropertyFolio | Modern Property Management",
  description:
    "Premium property management platform for tenants and property owners. Find your next home or grow your portfolio with AI-powered tools.",
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://thepropertyfolio.com/#organization",
      name: "ThePropertyFolio",
      url: "https://thepropertyfolio.com",
      logo: "https://thepropertyfolio.com/logo.png",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+1-555-123-4567",
        contactType: "customer support",
        availableLanguage: "English",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://thepropertyfolio.com/#website",
      url: "https://thepropertyfolio.com",
      name: "ThePropertyFolio",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://thepropertyfolio.com/availability?search={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <StatsBar />
      <ServicesGrid />
      <HowItWorks />
      <FeaturedProperties />
      <TestimonialsCarousel />
      <CTABanner />
    </>
  );
}
