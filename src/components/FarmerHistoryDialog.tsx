import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  Calendar, 
  MapPin, 
  IndianRupee, 
  Star, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FarmerHistoryDialogProps {
  farmerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FarmerHistoryDialog({ farmerId, open, onOpenChange }: FarmerHistoryDialogProps) {
  // Fetch farmer summary
  const { data: farmerSummary } = useQuery({
    queryKey: ["farmer-history", farmerId],
    queryFn: async () => {
      if (!farmerId) return null;
      const { data, error } = await supabase
        .from("farmer_history")
        .select("*")
        .eq("farmer_id", farmerId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!farmerId && open,
  });

  // Fetch all bookings for this farmer
  const { data: bookings = [] } = useQuery({
    queryKey: ["farmer-bookings", farmerId],
    queryFn: async () => {
      if (!farmerId) return [];
      const { data, error } = await supabase
        .from("bookings_with_details")
        .select("*")
        .eq("farmer_id", farmerId)
        .order("requested_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!farmerId && open,
  });

  // Fetch all reviews for this farmer
  const { data: reviews = [] } = useQuery({
    queryKey: ["farmer-reviews", farmerId],
    queryFn: async () => {
      if (!farmerId) return [];
      const { data, error } = await supabase
        .from("farmer_reviews")
        .select(`
          *,
          job_assignments!inner(
            booking_id,
            bookings!inner(
              activity_type_id,
              requested_date,
              activity_types(name)
            )
          )
        `)
        .eq("farmer_id", farmerId)
        .order("review_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!farmerId && open,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      assigned: "bg-blue-500",
      allocated: "bg-purple-500",
      in_progress: "bg-orange-500",
      completed: "bg-green-500",
      invoiced: "bg-teal-500",
      reviewed: "bg-emerald-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (!farmerSummary) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Farmer History</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="space-y-6 pr-4">
            {/* Farmer Summary Card */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">{farmerSummary.farmer_name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {farmerSummary.village && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {farmerSummary.village}
                        </div>
                      )}
                      {farmerSummary.contact && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {farmerSummary.contact}
                        </div>
                      )}
                    </div>
                  </div>
                  {farmerSummary.average_rating && (
                    <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/20 px-3 py-2 rounded-lg">
                      <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                      <span className="text-xl font-bold">{farmerSummary.average_rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">
                        ({farmerSummary.total_reviews} reviews)
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-secondary/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">Total Jobs</span>
                    </div>
                    <div className="text-2xl font-bold">{farmerSummary.total_bookings || 0}</div>
                  </div>

                  <div className="bg-secondary/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs">Completed</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {farmerSummary.completed_jobs || 0}
                    </div>
                  </div>

                  <div className="bg-secondary/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <IndianRupee className="h-4 w-4" />
                      <span className="text-xs">Total Revenue</span>
                    </div>
                    <div className="text-2xl font-bold">
                      ₹{((farmerSummary.total_revenue || 0) / 1000).toFixed(0)}K
                    </div>
                  </div>

                  <div className="bg-secondary/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">Customer Since</span>
                    </div>
                    <div className="text-lg font-bold">
                      {farmerSummary.customer_since
                        ? format(new Date(farmerSummary.customer_since), "MMM yyyy")
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {farmerSummary.last_booking_date && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    Last booking: {format(new Date(farmerSummary.last_booking_date), "MMMM d, yyyy")}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews Section */}
            {reviews.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Reviews ({reviews.length})
                </h4>
                <div className="space-y-3">
                  {reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-4 w-4",
                                    i < review.rating
                                      ? "fill-yellow-500 text-yellow-500"
                                      : "text-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="font-semibold">{review.rating}/5</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.review_date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{review.review_text}</p>
                        <div className="text-xs text-muted-foreground">
                          Job: {review.job_assignments?.bookings?.activity_types?.name || "N/A"} •{" "}
                          {format(
                            new Date(review.job_assignments?.bookings?.requested_date),
                            "MMM d, yyyy"
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Booking History */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Booking History ({bookings.length})
              </h4>
              <div className="space-y-3">
                {bookings.map((booking: any) => (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-semibold">{booking.activity_name}</h5>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(booking.requested_date), "MMM d, yyyy")}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {booking.area_acres} acres
                            </div>
                            {booking.quoted_price && (
                              <div className="flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                ₹{booking.quoted_price.toLocaleString("en-IN")}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className={cn(getStatusColor(booking.status), "text-white")}>
                          {booking.status}
                        </Badge>
                      </div>

                      {booking.mukkadam_name && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Team: {booking.mukkadam_name}
                        </div>
                      )}

                      {booking.call_notes && (
                        <div className="mt-2 text-xs bg-secondary/30 p-2 rounded">
                          📝 {booking.call_notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}