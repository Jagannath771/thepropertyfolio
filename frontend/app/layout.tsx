import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatBubble from "@/components/chatbot/ChatBubble";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "ThePropertyFolio | Modern Property Management",
    template: "%s | ThePropertyFolio",
  },
  description:
    "ThePropertyFolio — premium property management for tenants and owners. Browse available rentals, apply online, manage your portfolio, and get AI-powered support 24/7.",
  keywords: [
    "property management",
    "rental properties",
    "apartment for rent",
    "tenant portal",
    "owner dashboard",
    "real estate",
    "ThePropertyFolio",
  ],
  authors: [{ name: "ThePropertyFolio Team" }],
  creator: "ThePropertyFolio",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "ThePropertyFolio",
    title: "ThePropertyFolio | Modern Property Management",
    description:
      "Premium property management platform for tenants and property owners. Find your next home or manage your portfolio with ease.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "ThePropertyFolio — Premium Property Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ThePropertyFolio | Modern Property Management",
    description: "Premium property management for tenants and owners.",
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body className="font-sans bg-background text-foreground antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <ChatBubble />
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#F9FAFB",
            },
          }}
        />
      </body>
    </html>
  );
}
