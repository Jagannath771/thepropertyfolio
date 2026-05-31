import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProperty } from "@/lib/properties";
import PropertyDetailClient from "./PropertyDetailClient";

interface Props {
  params: { id: string };
}

// Revalidate in the background every 30s so price/status changes propagate
// without blocking user-facing renders.
export const revalidate = 30;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let property = null;
  try {
    property = await getProperty(params.id);
  } catch {
    // Network errors bubble to the page-level render, not metadata.
  }

  if (!property) {
    return {
      title: "Property Not Found",
      description: "This property may no longer be available.",
    };
  }

  const location = [property.city, property.state].filter(Boolean).join(", ");
  const description = property.description
    ? property.description.slice(0, 160)
    : `${property.bedrooms ?? 0}-bed ${property.property_type ?? "rental"} in ${location}.`;

  return {
    title: property.title,
    description,
    alternates: { canonical: `/availability/${property.id}` },
    openGraph: {
      title: property.title,
      description,
      images: property.images.slice(0, 1),
      type: "website",
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const property = await getProperty(params.id);
  if (!property) notFound();
  return <PropertyDetailClient property={property} />;
}
