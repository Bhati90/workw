import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddBookingDialog } from "@/components/AddBookingDialog";
import { ManageBookingDialog } from "@/components/ManageBookingDialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search, Calendar, User, MapPin, IndianRupee, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Bookings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings_with_details")
        .select("*")
        .order("requested_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.farmer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.activity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.farmer_village?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-500", label: "Pending" },
      assigned: { color: "bg-blue-500", label: "Assigned" },
      allocated: { color: "bg-purple-500", label: "Allocated" },
      in_progress: { color: "bg-orange-500", label: "In Progress" },
      completed: { color: "bg-green-500", label: "Completed" },
      invoiced: { color: "bg-teal-500", label: "Invoiced" },
      reviewed: { color: "bg-emerald-500", label: "Reviewed" },
      cancelled: { color: "bg-red-500", label: "Cancelled" },
    };
    return configs[status] || configs.pending;
  };

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    assigned: bookings.filter((b) => b.status === "assigned").length,
    allocated: bookings.filter((b) => b.status === "allocated").length,
    in_progress: bookings.filter((b) => b.status === "in_progress").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Bookings</h1>
            <p className="text-muted-foreground">Manage and track all customer bookings</p>
          </div>
          <AddBookingDialog />
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by farmer, activity, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                  <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
                  <SelectItem value="assigned">Assigned ({statusCounts.assigned})</SelectItem>
                  <SelectItem value="allocated">Allocated ({statusCounts.allocated})</SelectItem>
                  <SelectItem value="in_progress">In Progress ({statusCounts.in_progress})</SelectItem>
                  <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading bookings...
              </CardContent>
            </Card>
          ) : filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No bookings found
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.status);
              return (
                <Card
                  key={booking.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className="w-1 h-16 rounded-full"
                          style={{ backgroundColor: booking.farmer_color }}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">{booking.activity_name}</h3>
                            <Badge className={cn(statusConfig.color, "text-white")}>
                              {statusConfig.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>{booking.farmer_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(booking.requested_date), "MMM d, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {booking.area_acres} acres
                                {booking.farmer_village && ` • ${booking.farmer_village}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <IndianRupee className="h-4 w-4" />
                              <span className="font-medium">
                                ₹{booking.quoted_price?.toLocaleString("en-IN") || "N/A"}
                              </span>
                            </div>
                          </div>

                          {booking.mukkadam_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Allocated to: {booking.mukkadam_name}
                              </Badge>
                            </div>
                          )}

                          {booking.call_notes && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              📝 {booking.call_notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Manage Dialog */}
      {selectedBooking && (
        <ManageBookingDialog
          booking={selectedBooking}
          open={!!selectedBooking}
          onOpenChange={(open) => !open && setSelectedBooking(null)}
        />
      )}
    </Layout>
  );
}