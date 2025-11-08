import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, User, MapPin, IndianRupee, Phone, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  farmer_name: string;
  farmer_color: string;
  farmer_contact: string | null;
  farmer_village: string | null;
  activity_name: string;
  area_acres: number;
  requested_date: string;
  status: string;
  quoted_price: number | null;
  call_notes: string | null;
  mukkadam_name: string | null;
  job_status: string | null;
}

interface UpcomingBookingsProps {
  bookings: Booking[];
}

const getStatusConfig = (status: string) => {
  const configs = {
    pending: { color: "bg-yellow-500", icon: Clock, label: "Pending" },
    assigned: { color: "bg-blue-500", icon: AlertCircle, label: "Assigned" },
    allocated: { color: "bg-purple-500", icon: CheckCircle2, label: "Allocated" },
    in_progress: { color: "bg-orange-500", icon: Clock, label: "In Progress" },
    completed: { color: "bg-green-500", icon: CheckCircle2, label: "Completed" },
    invoiced: { color: "bg-teal-500", icon: CheckCircle2, label: "Invoiced" },
    reviewed: { color: "bg-emerald-500", icon: CheckCircle2, label: "Reviewed" },
    cancelled: { color: "bg-red-500", icon: AlertCircle, label: "Cancelled" },
  };
  return configs[status as keyof typeof configs] || configs.pending;
};

export function UpcomingBookings({ bookings }: UpcomingBookingsProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  return (
    <>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming bookings</p>
            ) : (
              bookings.map((booking) => {
                const statusConfig = getStatusConfig(booking.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <button
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="mt-1">
                      <div 
                        className="h-2 w-2 rounded-full" 
                        style={{ backgroundColor: booking.farmer_color }}
                      />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {booking.activity_name}
                        </h4>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs shrink-0", statusConfig.color, "text-white border-transparent")}
                        >
                          <StatusIcon className="h-2.5 w-2.5 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(booking.requested_date), "MMM d, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {booking.farmer_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.area_acres} acres
                        </div>
                      </div>
                      {booking.mukkadam_name && (
                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          {booking.mukkadam_name}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full shrink-0" 
                    style={{ backgroundColor: selectedBooking.farmer_color }}
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{selectedBooking.farmer_name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedBooking.farmer_village}</p>
                  </div>
                </div>
                <Badge className={cn(getStatusConfig(selectedBooking.status).color, "text-white")}>
                  {getStatusConfig(selectedBooking.status).label}
                </Badge>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Activity</p>
                  <p className="font-medium">{selectedBooking.activity_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Area</p>
                  <p className="font-medium">{selectedBooking.area_acres} acres</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Date</p>
                  <p className="font-medium">{format(new Date(selectedBooking.requested_date), "MMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quoted Price</p>
                  <p className="font-medium flex items-center">
                    <IndianRupee className="h-3 w-3" />
                    {selectedBooking.quoted_price?.toLocaleString('en-IN') || 'N/A'}
                  </p>
                </div>
                {selectedBooking.farmer_contact && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedBooking.farmer_contact}
                    </p>
                  </div>
                )}
                {selectedBooking.mukkadam_name && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Allocated To</p>
                    <div className="flex items-center gap-2 mt-1 bg-green-50 dark:bg-green-950/20 p-2 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="font-medium text-green-700 dark:text-green-400">
                        {selectedBooking.mukkadam_name}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Call Notes */}
              {selectedBooking.call_notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Call Notes</p>
                  <p className="text-sm bg-secondary/30 p-3 rounded-lg leading-relaxed">
                    {selectedBooking.call_notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1">
                  View History
                </Button>
                <Button className="flex-1">
                  Manage Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}