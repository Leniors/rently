"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Next.js navigation
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Building2, X, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function LandlordDashboard() {
  const router = useRouter(); // ✅ replaces useNavigate
  const { toast } = useToast();
  const [properties, setProperties] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    property_type: "rent",
    price: "",
    location: "",
    bedrooms: "",
    bathrooms: "",
    area_sqft: "",
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  useEffect(() => {
    checkAccess();
    fetchProperties();
  }, []);

  // ✅ Ensure Supabase + navigation works client-side
  const checkAccess = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "landlord") {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "This page is only for landlords.",
      });
      router.push("/");
    }
  };

  const fetchProperties = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("landlord_id", session.user.id)
      .order("created_at", { ascending: false });

    setProperties(data || []);
  };

  const uploadImages = async (propertyId: string, userId: string) => {
    if (selectedImages.length === 0) return [];
    setUploadingImages(true);

    const uploadedUrls: string[] = [];
    for (const image of selectedImages) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${userId}/${propertyId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(fileName, image);

      if (!uploadError) {
        const { data } = supabase.storage
          .from("property-images")
          .getPublicUrl(fileName);
        uploadedUrls.push(data.publicUrl);
      }
    }

    setUploadingImages(false);
    return uploadedUrls;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files));
    }
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const payload = {
      landlord_id: session.user.id,
      title: formData.title,
      description: formData.description,
      property_type: formData.property_type,
      price: parseFloat(formData.price),
      location: formData.location,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
      area_sqft: formData.area_sqft ? parseInt(formData.area_sqft) : null,
      status: "pending_approval",
    };

    const { data: property, error } = await supabase
      .from("properties")
      .insert(payload as any)
      .select()
      .single();

    if (property && selectedImages.length > 0) {
      const imageUrls = await uploadImages(property.id, session.user.id);
      await supabase
        .from("properties")
        .update({ images: imageUrls })
        .eq("id", property.id);
    }

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error adding property",
        description: error.message,
      });
    } else {
      toast({
        title: "Property submitted for review!",
        description: "Your property will be visible once approved.",
      });
      setShowAddDialog(false);
      setFormData({
        title: "",
        description: "",
        property_type: "rent",
        price: "",
        location: "",
        bedrooms: "",
        bathrooms: "",
        area_sqft: "",
      });
      setSelectedImages([]);
      fetchProperties();
    }
  };

  // (keep your handleEdit, handleUpdate, handleDelete, handleStatusChange same as before)
  const handleEdit = (property: any) => {
    setEditingProperty(property);
    setFormData({
      title: property.title,
      description: property.description,
      property_type: property.property_type,
      price: property.price.toString(),
      location: property.location,
      bedrooms: property.bedrooms?.toString() || "",
      bathrooms: property.bathrooms?.toString() || "",
      area_sqft: property.area_sqft?.toString() || "",
    });
    setExistingImages(property.images || []);
    setSelectedImages([]);
    setShowEditDialog(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    let allImages = [...existingImages];

    if (selectedImages.length > 0) {
      const newImageUrls = await uploadImages(
        editingProperty.id,
        session.user.id
      );
      allImages = [...allImages, ...newImageUrls];
    }

    const updateData: any = {
      title: formData.title,
      description: formData.description,
      property_type: formData.property_type as any,
      price: parseFloat(formData.price),
      location: formData.location,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
      area_sqft: formData.area_sqft ? parseInt(formData.area_sqft) : undefined,
      images: allImages,
    };

    // If property was rejected, resubmit for approval
    if (editingProperty.status === "rejected") {
      updateData.status = "pending_approval";
      updateData.rejection_reason = null;
    }

    const { error } = await supabase
      .from("properties")
      .update(updateData)
      .eq("id", editingProperty.id);

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating property",
        description: error.message,
      });
    } else {
      toast({
        title:
          editingProperty.status === "rejected"
            ? "Property resubmitted for review!"
            : "Property updated successfully!",
        description:
          editingProperty.status === "rejected"
            ? "Your property will be reviewed by admin again."
            : undefined,
      });
      setShowEditDialog(false);
      setEditingProperty(null);
      setFormData({
        title: "",
        description: "",
        property_type: "rent",
        price: "",
        location: "",
        bedrooms: "",
        bathrooms: "",
        area_sqft: "",
      });
      setSelectedImages([]);
      setExistingImages([]);
      fetchProperties();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    const { error } = await supabase.from("properties").delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting property",
        description: error.message,
      });
    } else {
      toast({
        title: "Property deleted",
      });
      fetchProperties();
    }
  };

  const handleStatusChange = async (
    propertyId: string,
    newStatus: "available" | "rented" | "sold"
  ) => {
    const { error } = await supabase
      .from("properties")
      .update({ status: newStatus })
      .eq("id", propertyId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: error.message,
      });
    } else {
      toast({
        title: "Status updated",
        description: `Property marked as ${newStatus}`,
      });
      fetchProperties();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Properties</h1>
            <p className="text-muted-foreground">
              Manage your property listings
            </p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Property</DialogTitle>
                <DialogDescription>
                  Fill in the details for your property listing
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Property Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="property_type">Property Type</Label>
                      <Select
                        value={formData.property_type}
                        onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rent">For Rent</SelectItem>
                          <SelectItem value="sale">For Sale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="price">
                        Price (KSh){formData.property_type === "rent" && " / month"}
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Westlands, Nairobi"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="area_sqft">Area (sqft)</Label>
                      <Input
                        id="area_sqft"
                        type="number"
                        value={formData.area_sqft}
                        onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="images">Property Images</Label>
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                    />
                    {selectedImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={URL.createObjectURL(image)} 
                              alt={`Preview ${index}`}
                              className="h-20 w-20 object-cover rounded"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => removeSelectedImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || uploadingImages}>
                    {loading || uploadingImages ? "Submitting..." : "Submit for Review"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Property Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Property</DialogTitle>
                <DialogDescription>
                  Update your property listing details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdate}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Property Title</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-property_type">Property Type</Label>
                      <Select
                        value={formData.property_type}
                        onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rent">For Rent</SelectItem>
                          <SelectItem value="sale">For Sale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-price">
                        Price (KSh){formData.property_type === "rent" && " / month"}
                      </Label>
                      <Input
                        id="edit-price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-location">Location</Label>
                    <Input
                      id="edit-location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Westlands, Nairobi"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-bedrooms">Bedrooms</Label>
                      <Input
                        id="edit-bedrooms"
                        type="number"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-bathrooms">Bathrooms</Label>
                      <Input
                        id="edit-bathrooms"
                        type="number"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-area_sqft">Area (sqft)</Label>
                      <Input
                        id="edit-area_sqft"
                        type="number"
                        value={formData.area_sqft}
                        onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Current Images</Label>
                    {existingImages.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {existingImages.map((url, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={url} 
                              alt={`Property ${index}`}
                              className="h-20 w-20 object-cover rounded"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => removeExistingImage(url)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-images">Add More Images</Label>
                    <Input
                      id="edit-images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                    />
                    {selectedImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={URL.createObjectURL(image)} 
                              alt={`New ${index}`}
                              className="h-20 w-20 object-cover rounded"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => removeSelectedImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || uploadingImages}>
                    {loading || uploadingImages ? "Updating..." : "Update Property"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{properties.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {properties.filter(p => p.status === 'pending_approval').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {properties.filter(p => p.status === 'available' || p.status === 'rented' || p.status === 'sold').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Listings</CardTitle>
            <CardDescription>
              Manage and track your property listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No properties yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first property listing
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                 <TableBody>
                  {properties.map((property) => (
                    <>
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">{property.title}</TableCell>
                        <TableCell>{property.location}</TableCell>
                        <TableCell className="capitalize">{property.property_type}</TableCell>
                        <TableCell>KSh {property.price.toLocaleString()}</TableCell>
                        <TableCell>
                          {(property.status === 'available' || property.status === 'rented' || property.status === 'sold') ? (
                            <Select
                              value={property.status}
                              onValueChange={(value) => handleStatusChange(property.id, value as 'available' | 'rented' | 'sold')}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="rented">Rented</SelectItem>
                                <SelectItem value="sold">Sold</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge 
                              variant={property.status === 'rejected' ? 'destructive' : 'outline'}
                              className="capitalize"
                            >
                              {property.status === 'pending_approval' ? 'Pending' : property.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(property)}
                              title={property.status === 'rejected' ? 'Edit and resubmit' : 'Edit property'}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(property.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {property.status === 'rejected' && property.rejection_reason && (
                        <TableRow key={`${property.id}-rejection`}>
                          <TableCell colSpan={6} className="bg-destructive/5">
                            <Alert variant="destructive" className="border-destructive/50">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Property Rejected</AlertTitle>
                              <AlertDescription>
                                <strong>Reason:</strong> {property.rejection_reason}
                                <br />
                                <span className="text-sm">Please edit the property and resubmit for approval.</span>
                              </AlertDescription>
                            </Alert>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
