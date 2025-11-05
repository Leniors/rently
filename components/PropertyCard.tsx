"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Square, CheckCircle } from "lucide-react";

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    description: string;
    property_type: string;
    status: string;
    price: number;
    location: string;
    bedrooms?: number;
    bathrooms?: number;
    area_sqft?: number;
    images: string[];
    verified: boolean;
  };
}

export function PropertyCard({ property }: PropertyCardProps) {
  const imageUrl =
    property.images?.[0] ||
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994";

  return (
    <Link href={`/property/${property.id}`} className="block">
      <Card className="overflow-hidden transition-all hover:shadow-medium hover:-translate-y-1 duration-300">
        <div className="relative h-64 overflow-hidden">
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />

          {property.verified && (
            <Badge className="absolute top-4 right-4 bg-success text-success-foreground">
              <CheckCircle className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          )}

          <Badge
            className={`absolute top-4 left-4 ${
              property.property_type === "rent"
                ? "bg-primary"
                : "bg-secondary"
            }`}
          >
            For {property.property_type === "rent" ? "Rent" : "Sale"}
          </Badge>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold line-clamp-1">
              {property.title}
            </h3>
            <p className="text-xl font-bold text-primary whitespace-nowrap ml-2">
              KSh {property.price.toLocaleString()}
              {property.property_type === "rent" && "/mo"}
            </p>
          </div>

          <div className="flex items-center text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm line-clamp-1">{property.location}</span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {property.description}
          </p>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-4 text-sm text-muted-foreground">
          {property.bedrooms && (
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              {property.bedrooms} Beds
            </div>
          )}

          {property.bathrooms && (
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              {property.bathrooms} Baths
            </div>
          )}

          {property.area_sqft && (
            <div className="flex items-center">
              <Square className="h-4 w-4 mr-1" />
              {property.area_sqft} sqft
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
