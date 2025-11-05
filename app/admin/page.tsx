"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
  });

  const [properties, setProperties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingPropertyId, setRejectingPropertyId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    checkAccess();
    fetchDashboardData();
  }, []);

  const checkAccess = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth");
      return;
    }

    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!userRole) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "This page is only for administrators.",
      });
      router.push("/");
    }
  };

  const fetchDashboardData = async () => {
    const { data: propertiesData } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    setProperties(propertiesData || []);

    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    setUsers(usersData || []);

    const { data: purchasesData } = await supabase
      .from("contact_purchases")
      .select("*, properties(title), profiles(full_name)")
      .order("created_at", { ascending: false });

    setPurchases(purchasesData || []);

    const totalRevenue =
      purchasesData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const pendingApprovals =
      propertiesData?.filter((p) => p.status === "pending_approval").length || 0;

    setStats({
      totalProperties: propertiesData?.length || 0,
      totalUsers: usersData?.length || 0,
      totalRevenue,
      pendingVerifications: pendingApprovals,
    });
  };

  const handleApproveProperty = async (id: string) => {
    const { error } = await supabase
      .from("properties")
      .update({ status: "available", verified: true })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error approving property",
        description: error.message,
      });
    } else {
      toast({
        title: "Property approved",
        description: "Property is now visible to users",
      });
      fetchDashboardData();
    }
  };

  const handleRejectPropertyClick = (id: string) => {
    setRejectingPropertyId(id);
    setRejectionReason("");
    setShowRejectDialog(true);
  };

  const handleRejectProperty = async () => {
    if (!rejectionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Rejection reason required",
        description: "Please provide a reason for rejection",
      });
      return;
    }

    const { error } = await supabase
      .from("properties")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
      })
      .eq("id", rejectingPropertyId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error rejecting property",
        description: error.message,
      });
    } else {
      toast({
        title: "Property rejected",
        description: "The landlord has been notified",
      });
      setShowRejectDialog(false);
      setRejectionReason("");
      setRejectingPropertyId("");
      fetchDashboardData();
    }
  };

  const handleVerifyProperty = async (id: string, verified: boolean) => {
    const { error } = await supabase
      .from("properties")
      .update({ verified })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating property",
        description: error.message,
      });
    } else {
      toast({
        title: verified ? "Property verified" : "Verification removed",
      });
      fetchDashboardData();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage the platform
          </p>
        </div>

        {stats.pendingVerifications > 0 && (
          <Card className="mb-8 border-warning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <TrendingUp className="h-5 w-5" />
                Properties Pending Approval ({stats.pendingVerifications})
              </CardTitle>
              <CardDescription>
                Review and approve these property submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties
                    .filter((p) => p.status === "pending_approval")
                    .map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">
                          {property.title}
                        </TableCell>
                        <TableCell>{property.location}</TableCell>
                        <TableCell>
                          KSh {property.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveProperty(property.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleRejectPropertyClick(property.id)
                              }
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Total Properties",
              icon: Building2,
              value: stats.totalProperties,
            },
            { title: "Total Users", icon: Users, value: stats.totalUsers },
            {
              title: "Total Revenue",
              icon: DollarSign,
              value: `KSh ${stats.totalRevenue.toLocaleString()}`,
            },
            {
              title: "Pending Approvals",
              icon: TrendingUp,
              value: stats.pendingVerifications,
            },
          ].map((stat, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Properties Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Property Listings</CardTitle>
            <CardDescription>
              Verify and manage all property listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>{property.title}</TableCell>
                    <TableCell>{property.location}</TableCell>
                    <TableCell>
                      KSh {property.price.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {property.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {property.verified ? (
                        <Badge className="bg-success">
                          <CheckCircle className="mr-1 h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {property.status === "pending_approval" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveProperty(property.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleRejectPropertyClick(property.id)
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : property.verified ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleVerifyProperty(property.id, false)
                          }
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Unverify
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerifyProperty(property.id, true)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Verify
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Purchases Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Contact Purchases</CardTitle>
            <CardDescription>
              Track user purchases for contact access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.slice(0, 10).map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      {purchase.profiles?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {purchase.properties?.title || "Unknown"}
                    </TableCell>
                    <TableCell>
                      KSh {Number(purchase.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(purchase.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Property</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this property. The landlord
              will see this message.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              rows={4}
              placeholder="e.g., Images are not clear, property details are incomplete..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectProperty}>
              Reject Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
