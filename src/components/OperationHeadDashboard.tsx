import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyTeamMemberAssigned, notifyAllocationApproved } from "@/lib/notifications";
import { notifyFarmerAllocation, notifyMukadamJob } from "@/lib/whatsapp";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  UserPlus,
  ThumbsUp,
  Calendar,
  MapPin,
  IndianRupee
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function OperationsHeadDashboard() {
  const [assigningBooking, setAssigningBooking] = useState<any>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [approvingBooking, setApprovingBooking] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch pending bookings (need assignment)
  const { data: pendingBookings = [] } = useQuery({
    queryKey: ["pending-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings_with_details")
        .select("*")
        .eq("status", "pending")
        .is("assigned_team_member", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch bookings awaiting approval
  const { data: awaitingApproval = [] } = useQuery({
    queryKey: ["awaiting-approval"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings_with_details")
        .select("*")
        .eq("status", "assigned")
        .not("job_assignment_id", "is", null)
        .is("approved_at", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "team_member")
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch active assignments (for overview)
  const { data: activeAssignments = [] } = useQuery({
    queryKey: ["active-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings_with_details")
        .select("*")
        .in("status", ["assigned", "allocated", "in_progress"])
        .not("assigned_team_member", "is", null)
        .order("requested_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const handleAssignTeamMember = async () => {
    if (!assigningBooking || !selectedTeamMember) {
    toast.error("Please select a team member");
    return;
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      assigned_team_member: selectedTeamMember,
      status: "assigned",
    })
    .eq("id", assigningBooking.id);

  if (error) {
    toast.error("Failed to assign team member");
    return;
  }

  // CREATE NOTIFICATION
  await notifyTeamMemberAssigned(
    assigningBooking.id,
    selectedTeamMember,
    assigningBooking.farmer_name,
    assigningBooking.activity_name
  );

  toast.success("Team member assigned successfully");
    queryClient.invalidateQueries({ queryKey: ["pending-bookings"] });
    queryClient.invalidateQueries({ queryKey: ["active-assignments"] });
    setAssigningBooking(null);
    setSelectedTeamMember("");
    setAssignmentNotes("");
  };

  const handleApproveAllocation = async () => {
    if (!approvingBooking) return;

  const currentUserId = "ops-head-id"; // TODO: Get from auth

  const { error: jobError } = await supabase
    .from("job_assignments")
    .update({
      approved_by: currentUserId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", approvingBooking.job_assignment_id);

  if (jobError) {
    toast.error("Failed to approve allocation");
    return;
  }

  const { error: bookingError } = await supabase
    .from("bookings")
    .update({ status: "allocated" })
    .eq("id", approvingBooking.id);

  if (bookingError) {
    toast.error("Failed to update booking status");
    return;
  }

  // NOTIFY TEAM MEMBER
  await notifyAllocationApproved(
    approvingBooking.id,
    approvingBooking.assigned_team_member,
    approvingBooking.farmer_name,
    approvingBooking.mukkadam_name
  );

  // SEND WHATSAPP TO FARMER
  if (approvingBooking.farmer_contact) {
    await notifyFarmerAllocation({
      bookingId: approvingBooking.id,
      farmerPhone: approvingBooking.farmer_contact,
      farmerName: approvingBooking.farmer_name,
      activityName: approvingBooking.activity_name,
      mukadamName: approvingBooking.mukkadam_name,
      mukadamPhone: approvingBooking.mukkadam_contact || "Contact via FarmOps",
      workDate: format(new Date(approvingBooking.requested_date), "MMMM d, yyyy"),
      labourCount: approvingBooking.number_of_labourers,
    });
  }

  // SEND WHATSAPP TO MUKADAM
  if (approvingBooking.mukkadam_contact) {
    await notifyMukadamJob({
      bookingId: approvingBooking.id,
      mukadamPhone: approvingBooking.mukkadam_contact,
      mukadamName: approvingBooking.mukkadam_name,
      farmerName: approvingBooking.farmer_name,
      farmerPhone: approvingBooking.farmer_contact || "Contact via FarmOps",
      farmerLocation: approvingBooking.farmer_village || "Check with farmer",
      activityName: approvingBooking.activity_name,
      acres: approvingBooking.area_acres,
      workDate: format(new Date(approvingBooking.requested_date), "MMMM d, yyyy"),
    });
  }

  toast.success("Allocation approved! Notifications sent via WhatsApp");
    queryClient.invalidateQueries({ queryKey: ["awaiting-approval"] });
    queryClient.invalidateQueries({ queryKey: ["active-assignments"] });
    setApprovingBooking(null);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      assigned: "bg-blue-500",
      allocated: "bg-purple-500",
      in_progress: "bg-orange-500",
      completed: "bg-green-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Operations Dashboard</h1>
        <p className="text-muted-foreground">Manage bookings and team assignments</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Assignment</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingBookings.length}</div>
            <p className="text-xs text-muted-foreground">Waiting for team member</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Approval</CardTitle>
            <ThumbsUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{awaitingApproval.length}</div>
            <p className="text-xs text-muted-foreground">Mukadam allocated, needs approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{activeAssignments.length}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">Available coordinators</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Pending Assignments ({pendingBookings.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending assignments
                </p>
              ) : (
                pendingBookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{booking.farmer_name}</h4>
                            <p className="text-sm text-muted-foreground">{booking.activity_name}</p>
                          </div>
                          <Badge className={cn(getStatusColor(booking.status), "text-white")}>
                            New
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
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

                        {booking.call_notes && (
                          <p className="text-xs bg-secondary/30 p-2 rounded">
                            📝 {booking.call_notes.substring(0, 100)}
                            {booking.call_notes.length > 100 && "..."}
                          </p>
                        )}

                        <Button
                          onClick={() => setAssigningBooking(booking)}
                          size="sm"
                          className="w-full"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign Team Member
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Awaiting Approval */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5" />
                Awaiting Approval ({awaitingApproval.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {awaitingApproval.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending approvals
                </p>
              ) : (
                awaitingApproval.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow border-blue-200">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{booking.farmer_name}</h4>
                            <p className="text-sm text-muted-foreground">{booking.activity_name}</p>
                          </div>
                          <Badge className="bg-blue-500 text-white">
                            Ready
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(booking.requested_date), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.area_acres} acres
                          </div>
                        </div>

                        <div className="bg-secondary/30 p-2 rounded space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Handled by:</span>
                            <span className="font-medium">{booking.team_member_name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Mukadam:</span>
                            <span className="font-medium text-green-600">{booking.mukkadam_name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Labourers:</span>
                            <span className="font-medium">{booking.number_of_labourers}</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => setApprovingBooking(booking)}
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve & Notify Farmer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Assignments Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Assignments ({activeAssignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activeAssignments.slice(0, 10).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{booking.farmer_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {booking.activity_name} • {format(new Date(booking.requested_date), "MMM d")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {booking.team_member_name}
                  </Badge>
                  {booking.mukkadam_name && (
                    <Badge className="bg-green-500 text-white text-xs">
                      {booking.mukkadam_name}
                    </Badge>
                  )}
                  <Badge className={cn(getStatusColor(booking.status), "text-white text-xs")}>
                    {booking.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assign Team Member Dialog */}
      <Dialog open={!!assigningBooking} onOpenChange={(open) => !open && setAssigningBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Team Member</DialogTitle>
          </DialogHeader>
          {assigningBooking && (
            <div className="space-y-4">
              <div className="p-3 bg-secondary/30 rounded-lg space-y-1">
                <div className="font-semibold">{assigningBooking.farmer_name}</div>
                <div className="text-sm text-muted-foreground">
                  {assigningBooking.activity_name} • {assigningBooking.area_acres} acres
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(assigningBooking.requested_date), "MMMM d, yyyy")}
                </div>
              </div>

              {assigningBooking.call_notes && (
                <div className="space-y-2">
                  <Label>Call Notes</Label>
                  <div className="text-sm bg-secondary/30 p-3 rounded">
                    {assigningBooking.call_notes}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Select Team Member *</Label>
                <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assignment Notes (Optional)</Label>
                <Textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Special instructions, priorities, etc."
                  rows={3}
                />
              </div>

              <Button onClick={handleAssignTeamMember} className="w-full">
                Assign Team Member
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Allocation Dialog */}
      <Dialog open={!!approvingBooking} onOpenChange={(open) => !open && setApprovingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Mukadam Allocation</DialogTitle>
          </DialogHeader>
          {approvingBooking && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 space-y-3">
                <div className="font-semibold text-lg">{approvingBooking.farmer_name}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Activity:</span>{" "}
                    <span className="font-medium">{approvingBooking.activity_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Area:</span>{" "}
                    <span className="font-medium">{approvingBooking.area_acres} acres</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>{" "}
                    <span className="font-medium">
                      {format(new Date(approvingBooking.requested_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price:</span>{" "}
                    <span className="font-medium">
                      ₹{approvingBooking.quoted_price?.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
                <div className="font-semibold text-sm">Allocation Details</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Team Member:</span>{" "}
                    <span className="font-medium">{approvingBooking.team_member_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mukadam:</span>{" "}
                    <span className="font-medium text-green-600">{approvingBooking.mukkadam_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Labourers:</span>{" "}
                    <span className="font-medium">{approvingBooking.number_of_labourers}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>{" "}
                    <span className="font-medium">{approvingBooking.mukkadam_location || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  ✓ Upon approval, farmer will receive WhatsApp notification with:
                </p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 mt-2 ml-4 space-y-1">
                  <li>• Mukadam name and contact</li>
                  <li>• Work date and time</li>
                  <li>• Team size and details</li>
                </ul>
              </div>

              <Button onClick={handleApproveAllocation} className="w-full bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve & Notify Farmer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}