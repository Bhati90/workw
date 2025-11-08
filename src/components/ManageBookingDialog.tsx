import { useState } from "react";
// RIGHT ✅
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Calendar, 
  User, 
  MapPin, 
  IndianRupee,
  Phone,
  Users,
  CheckCircle2,
  Clock,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ManageBookingDialogProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole?: string; // 'founder', 'operations_head', 'team_member'
}

export function ManageBookingDialog({ booking, open, onOpenChange, userRole = 'founder' }: ManageBookingDialogProps) {
  const queryClient = useQueryClient();

  if (!booking) return null;

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

  const handleMarkInProgress = async () => {
    const { error } = await supabase
      .from("job_assignments")
      .update({
        status: "in_progress",
        actual_start: new Date().toISOString(),
      })
      .eq("id", booking.job_assignment_id);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    await supabase
      .from("bookings")
      .update({ status: "in_progress" })
      .eq("id", booking.id);

    toast.success("Job marked as in progress");
    queryClient.invalidateQueries();
    onOpenChange(false);
  };

  const handleMarkCompleted = async () => {
    const { error } = await supabase
      .from("job_assignments")
      .update({
        status: "completed",
        actual_end: new Date().toISOString(),
      })
      .eq("id", booking.job_assignment_id);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", booking.id);

    toast.success("Job marked as completed");
    queryClient.invalidateQueries();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between p-4 bg-secondary/30 rounded-lg">
            <div>
              <h3 className="text-xl font-bold">{booking.farmer_name}</h3>
              <p className="text-sm text-muted-foreground">{booking.farmer_village}</p>
            </div>
            <Badge className={cn(getStatusColor(booking.status), "text-white")}>
              {booking.status}
            </Badge>
          </div>

          {/* Main Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Activity</div>
                <div className="font-semibold">{booking.activity_name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Date</div>
                <div className="font-semibold flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(booking.requested_date), "MMMM d, yyyy")}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Area</div>
                <div className="font-semibold flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {booking.area_acres} acres
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Quoted Price</div>
                <div className="font-semibold flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {booking.quoted_price?.toLocaleString("en-IN") || "N/A"}
                </div>
              </div>
              {booking.farmer_contact && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Contact</div>
                  <div className="font-semibold flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {booking.farmer_contact}
                  </div>
                </div>
              )}
              {booking.advance_amount > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Advance Paid</div>
                  <div className="font-semibold text-green-600">
                    ₹{booking.advance_amount.toLocaleString("en-IN")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Team Assignment */}
          {(booking.team_member_name || booking.mukkadam_name) && (
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Assignment
              </h4>
              
              {booking.team_member_name && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Handled By (Our Team)</div>
                  <div className="font-semibold">{booking.team_member_name}</div>
                </div>
              )}

              {booking.mukkadam_name && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                  <div className="text-xs text-muted-foreground mb-1">Mukadam & Labour Team</div>
                  <div className="font-semibold text-green-700 dark:text-green-400">
                    {booking.mukkadam_name}
                  </div>
                  <div className="text-sm mt-1">
                    {booking.number_of_labourers} labourers
                  </div>
                  {booking.mukkadam_contact && (
                    <div className="text-sm mt-1 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {booking.mukkadam_contact}
                    </div>
                  )}
                  {booking.approved_at && (
                    <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Approved by {booking.approved_by_name} on{" "}
                      {format(new Date(booking.approved_at), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Call Notes */}
          {booking.call_notes && (
            <div className="border-t pt-4">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4" />
                Call Notes
              </h4>
              <p className="text-sm bg-secondary/30 p-3 rounded-lg">
                {booking.call_notes}
              </p>
            </div>
          )}

          {/* Actions */}
          {booking.status === 'allocated' && (
            <div className="border-t pt-4">
              <Button onClick={handleMarkInProgress} className="w-full">
                <Clock className="h-4 w-4 mr-2" />
                Mark as In Progress
              </Button>
            </div>
          )}

          {booking.status === 'in_progress' && (
            <div className="border-t pt-4">
              <Button onClick={handleMarkCompleted} className="w-full bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Completed
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}