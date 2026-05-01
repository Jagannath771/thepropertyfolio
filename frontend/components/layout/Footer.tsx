"use client";

import Link from "next/link";
import { Building2, Mail, Phone, MapPin, Twitter, Linkedin, Instagram, Facebook } from "lucide-react";

const FOOTER_LINKS = {
  Properties: [
    { label: "Browse Listings", href: "/availability" },
    { label: "Featured Homes", href: "/availability?featured=true" },
    { label: "Commercial Space", href: "/availability?type=commercial" },
    { label: "Coming Soon", href: "/availability?status=coming_soon" },
  ],
  Tenants: [
    { label: "Tenant Portal", href: "/tenants" },
    { label: "Apply Online", href: "/tenants/register" },
    { label: "Pay Rent", href: "/tenants/dashboard" },
    { label: "Maintenance", href: "/tenants/dashboard" },
  ],
  Owners: [
    { label: "Owner Portal", href: "/owners" },
    { label: "List a Property", href: "/owners/register" },
    { label: "Owner Dashboard", href: "/owners/dashboard" },
    { label: "Financial Reports", href: "/owners/dashboard" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

const SOCIALS = [
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
];

export default function Footer() {
  return (
    <footer
      className="relative mt-20 border-t"
      style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8, 12, 24, 0.98)" }}
    >
      {/* Top gradient line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center group-hover:shadow-glow transition-shadow">
                <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                The<span className="gradient-text">Property</span>Folio
              </span>
            </Link>
            <p className="text-sm text-foreground-muted leading-relaxed mb-6">
              Modern property management for the next generation of tenants and owners. 
              Transparent, efficient, and always available.
            </p>
            <div className="space-y-3">
              <a href="tel:+15551234567" className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-primary transition-colors group">
                <Phone className="w-4 h-4 group-hover:text-primary" />
                +1 (555) 123-4567
              </a>
              <a href="mailto:contact@thepropertyfolio.com" className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-primary transition-colors group">
                <Mail className="w-4 h-4 group-hover:text-primary" />
                contact@thepropertyfolio.com
              </a>
              <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                123 Property Lane, Suite 400<br />
                <span className="ml-6">San Francisco, CA 94102</span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">{category}</h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-foreground-muted hover:text-primary transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div
          className="mt-12 p-6 rounded-2xl"
          style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-semibold text-foreground mb-1">Stay in the loop</h4>
              <p className="text-sm text-foreground-muted">Get new property listings and market insights delivered weekly.</p>
            </div>
            <form className="flex w-full md:w-auto gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="input-glass flex-1 md:w-64"
                aria-label="Newsletter email"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs text-foreground-muted">
            © {new Date().getFullYear()} ThePropertyFolio, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="p-2 rounded-lg text-foreground-muted hover:text-primary hover:bg-primary/10 transition-all duration-200"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
