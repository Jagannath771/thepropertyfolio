import Link from "next/link";
import { Search, ShieldCheck, Wrench, Smartphone } from "lucide-react";

export default function TenantsPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative px-4 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1920&q=80"
            alt="Modern living room"
            className="w-full h-full object-cover opacity-20"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(10,15,30,0.8), var(--background))",
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground mb-6" style={{ fontFamily: "var(--font-playfair)" }}>
            Elevate Your Living Experience
          </h1>
          <p className="text-lg sm:text-xl leading-8 text-foreground-secondary mb-10 max-w-2xl mx-auto">
            Discover premium rental properties with ThePropertyFolio. Enjoy seamless digital leasing, 24/7 maintenance support, and a dedicated tenant portal.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/availability" className="btn-primary w-full sm:w-auto px-8 py-3.5 text-base">
              Browse Available Homes
            </Link>
            <Link href="/tenants/login" className="btn-secondary w-full sm:w-auto px-8 py-3.5 text-base">
              Access Tenant Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
              Why Rent With Us?
            </h2>
            <p className="text-foreground-secondary">
              We redefine property management by putting our residents first.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Curated Properties",
                desc: "Every home in our portfolio is thoroughly inspected and maintained to high standards.",
                icon: Search,
              },
              {
                title: "Online Portal",
                desc: "Pay rent, sign leases, and manage your account easily from your smartphone.",
                icon: Smartphone,
              },
              {
                title: "24/7 Maintenance",
                desc: "Submit requests online and get prompt service, including round-the-clock emergency support.",
                icon: Wrench,
              },
              {
                title: "Secure Living",
                desc: "Enjoy peace of mind with vetted communities and secure property access systems.",
                icon: ShieldCheck,
              },
            ].map((feature, i) => (
              <div key={i} className="glass-card p-8 text-center hover:-translate-y-1 transition-transform duration-300">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-foreground-secondary text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="max-w-4xl mx-auto text-center relative z-10 glass-card p-12">
          <h2 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
            Ready to find your next home?
          </h2>
          <p className="text-foreground-secondary mb-8">
            Join hundreds of satisfied residents who trust ThePropertyFolio.
          </p>
          <Link href="/availability" className="btn-primary px-8 py-3">
            View Current Listings
          </Link>
        </div>
      </section>
    </div>
  );
}
