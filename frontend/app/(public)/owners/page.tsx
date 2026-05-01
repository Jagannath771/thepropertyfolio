import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Property Owners | ThePropertyFolio",
  description: "Maximize your investment with our premium property management services. We handle the heavy lifting so you don't have to.",
};

export default function OwnersLandingPage() {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-24 text-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1920&q=80" alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4">
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
            Maximize Your <span className="gradient-text">Investment</span>
          </h1>
          <p className="text-lg text-foreground-secondary mb-10 max-w-2xl mx-auto">
            Experience hands-off property management with full financial transparency, rigorous tenant screening, and 24/7 maintenance support.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/owners/register" className="btn-primary py-3 px-8 text-base w-full sm:w-auto justify-center">
              Partner with Us <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/owners/login" className="btn-outline py-3 px-8 text-base w-full sm:w-auto justify-center">
              Owner Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose ThePropertyFolio?</h2>
          <p className="text-foreground-secondary">We deliver peace of mind and optimized returns.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: ShieldCheck, title: "Rigorous Screening", desc: "Comprehensive background and credit checks ensure reliable tenants." },
            { icon: BarChart3, title: "Financial Reporting", desc: "Real-time access to statements, tax documents, and ROI metrics." },
            { icon: Home, title: "Proactive Maintenance", desc: "24/7 emergency response and routine inspections protect your asset." },
          ].map((feature, i) => (
            <div key={i} className="glass-card p-8 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-foreground-secondary">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
