"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Bed,
  Bath,
  Square,
  CheckCircle,
  Phone,
  Mail,
  User as User1,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const PropertyDetail = () => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params?.id as string;
  const [property, setProperty] = useState<Property | null>(null);
  const [landlord, setLandlord] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      checkAuth();
      fetchProperty();
    }
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  const fetchProperty = async () => {
    const { data: propertyData } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (propertyData) {
      setProperty(propertyData);

      // Fetch landlord info
      const { data: landlordData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", propertyData.landlord_id)
        .single();

      setLandlord(landlordData);

      // Check if user has purchased contact
      if (user) {
        const { data: purchaseData } = await supabase
          .from("contact_purchases")
          .select("*")
          .eq("property_id", id)
          .eq("user_id", user.id)
          .single();

        setHasPurchased(!!purchaseData);
      }
    }
  };

  const handleContactAccess = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to access contact information",
      });
      router.push("/auth");
      return;
    }
    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to proceed",
      });
      router.push("/auth");
      return;
    }

    setLoading(true);

    // Simulate payment logic
    const { error } = await supabase.from("contact_purchases").insert({
      user_id: user.id,
      property_id: id,
      amount: 200.0,
      payment_status: "completed",
    });

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Payment successful!",
        description: "You can now view the landlord's contact information",
      });
      setHasPurchased(true);
      setShowPaymentDialog(false);
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const propertyImages =
    Array.isArray(property.images) && property.images.length > 0
      ? property.images
      : ["https://images.unsplash.com/photo-1568605114967-8130f3a36994"];

  const mainImage = propertyImages[selectedImageIndex];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-6">
              <div className="relative h-96 rounded-lg overflow-hidden mb-4">
                <img
                  src={mainImage}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                {property.verified && (
                  <Badge className="absolute top-4 right-4 bg-success text-success-foreground">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>

              {/* Thumbnails */}
              {propertyImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {propertyImages.map((image: string, index: number): JSX.Element => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative h-20 rounded-lg overflow-hidden transition-all ${
                    selectedImageIndex === index
                      ? "ring-2 ring-primary ring-offset-2"
                      : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                    src={image}
                    alt={`${property.title} - ${index + 1}`}
                    className="w-full h-full object-cover"
                    />
                  </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Details */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{property.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">
                      KSh {property.price.toLocaleString()}
                    </p>
                    {property.property_type === "rent" && (
                      <p className="text-sm text-muted-foreground">per month</p>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Features */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {property.bedrooms && (
                    <div className="flex items-center gap-2">
                      <Bed className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Bedrooms
                        </p>
                        <p className="font-semibold">{property.bedrooms}</p>
                      </div>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-2">
                      <Bath className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Bathrooms
                        </p>
                        <p className="font-semibold">{property.bathrooms}</p>
                      </div>
                    </div>
                  )}
                  {property.area_sqft && (
                    <div className="flex items-center gap-2">
                      <Square className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Area</p>
                        <p className="font-semibold">
                          {property.area_sqft} sqft
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Description */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {property.description}
                  </p>
                </div>

                {/* Amenities */}
                {(property.amenities?.length ?? 0) > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h2 className="text-xl font-semibold mb-3">Amenities</h2>
                      <div className="grid grid-cols-2 gap-2">
                        {property.amenities?.map(
                          (amenity: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-success" />
                              <span>{amenity}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Contact Information
                </h3>

                {hasPurchased ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User1 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Landlord</p>
                        <p className="font-semibold">{landlord?.full_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-semibold">{landlord?.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold">{landlord?.email}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Pay KSh 200 to unlock landlord&apos;s contact information
                    </p>
                    <Button onClick={handleContactAccess} className="w-full">
                      Unlock Contact Info
                    </Button>
                  </div>
                )}

                <Separator className="my-6" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property Type</span>
                    <span className="font-medium capitalize">
                      {property.property_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className="capitalize">
                      {property.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Listed</span>
                    <span className="font-medium">
                      {new Date(property.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Contact Information</DialogTitle>
            <DialogDescription>
              Pay KSh 200 to access the landlord&apos;s phone and email address
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span>Access Fee</span>
                <span className="text-xl font-bold">KSh 200</span>
              </div>
              <p className="text-sm text-muted-foreground">
                One-time payment for this property
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={loading}>
              {loading ? "Processing..." : "Pay Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyDetail;
