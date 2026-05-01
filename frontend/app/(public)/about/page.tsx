import type { Metadata } from "next";
import { Building2, ShieldCheck, HeartHandshake, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | ThePropertyFolio",
  description: "Learn about our mission to revolutionize property management with transparency, technology, and exceptional service.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 text-center mb-24">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 font-serif">
          Redefining Property <span className="text-primary">Management</span>
        </h1>
        <p className="text-lg text-foreground-secondary leading-relaxed">
          At ThePropertyFolio, we believe that renting and owning property should be a seamless, transparent, and rewarding experience. By combining cutting-edge technology with dedicated human support, we're building the future of real estate management.
        </p>
      </section>

      {/* Core Values */}
      <section className="max-w-7xl mx-auto px-4 mb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: ShieldCheck, title: "Unwavering Trust", desc: "Transparency and integrity in every transaction, report, and interaction." },
            { icon: Zap, title: "Modern Technology", desc: "Automated workflows and real-time data to optimize your investments." },
            { icon: HeartHandshake, title: "Community First", desc: "Fostering long-term relationships between owners and tenants." },
            { icon: Building2, title: "Premium Quality", desc: "Maintaining high standards for the properties we manage." },
          ].map((value, i) => (
            <div key={i} className="glass-card p-8 text-center hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <value.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{value.title}</h3>
              <p className="text-foreground-secondary">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="glass-card overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-12 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-foreground mb-6 font-serif">Our Story</h2>
              <div className="space-y-4 text-foreground-secondary leading-relaxed">
                <p>
                  Founded by a team of real estate investors and technologists who were frustrated by the outdated practices of traditional property management, ThePropertyFolio was born out of a desire for better.
                </p>
                <p>
                  We saw a fractured industry filled with hidden fees, poor communication, and deferred maintenance. We knew there had to be a way to provide owners with peace of mind while simultaneously offering tenants beautiful, well-maintained homes they actually love living in.
                </p>
                <p>
                  Today, we manage hundreds of premium properties across the country, constantly iterating on our platform to deliver the best possible experience for all of our users.
                </p>
              </div>
            </div>
            <div className="relative h-64 md:h-auto">
              <img 
                src="/images/story.png" 
                alt="Our team collaborating" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
