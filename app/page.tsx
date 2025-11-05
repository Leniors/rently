"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { PropertyCard } from "@/components/PropertyCard";
import { Search, Home, Shield, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-home.jpg";
import { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);

  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

  const fetchFeaturedProperties = async () => {
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "available")
      .limit(6);

    setFeaturedProperties(data || []);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt="Hero background"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-accent/80" />
        </div>

        <div className="container relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
            Find Your Perfect Home
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Discover thousands of properties for rent and sale across Kenya
          </p>
          <Link href="/properties">
            <Button size="lg" className="bg-secondary hover:bg-secondary/90">
              <Search className="mr-2 h-5 w-5" />
              Start Searching
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Home className="h-8 w-8 text-white" />}
              title="Wide Selection"
              text="Browse thousands of verified properties across all major cities"
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-white" />}
              title="Verified Listings"
              text="All properties are verified to ensure authenticity and quality"
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8 text-white" />}
              title="Easy Process"
              text="Simple payment system to connect directly with property owners"
            />
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Featured Properties</h2>
            <p className="text-muted-foreground text-lg">
              Explore our handpicked selection of premium properties
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property) => {
              const cardProperty = {
                id: property.id,
                title: property.title,
                description: property.description,
                property_type: property.property_type,
                status: property.status,
                price: property.price,
                location: property.location,
                bedrooms: property.bedrooms ?? undefined,
                bathrooms: property.bathrooms ?? undefined,
                area_sqft: property.area_sqft ?? undefined,
                images: property.images ?? [],
                verified: property.verified ?? false,
              };
              return <PropertyCard key={property.id} property={cardProperty} />;
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/properties">
              <Button size="lg" variant="outline">
                View All Properties
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Are You a Property Owner?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            List your property today and reach thousands of potential tenants
            and buyers
          </p>
          <Link href="/auth">
            <Button size="lg" variant="secondary">
              Get Started
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

// ✅ Extracted for cleaner code
function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="text-center p-6">
      <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}
