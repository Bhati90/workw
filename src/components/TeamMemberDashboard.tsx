import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Send,
  Calendar as CalendarIcon,
  MapPin,
  IndianRupee,
  Phone
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function TeamMemberDashboard() {
  const [allocatingBooking, setAllocatingBooking] = useState<any>(null);
  const [selectedMukadam, setSelectedMukadam] = useState("");
  const [estimatedStart, setEstimatedStart] = useState<Date | undefined>();
  const [allocationNotes, setAllocationNotes] = useState("");
  const queryClient = useQueryClient();

  // Mock current user - in production, get from auth
  const currentUserId = "team-member-id"; // TODO: Get from auth

  // Fetch MY assigned bookings (need to find mukadam)
  const { data: myAssignments = [] } = useQuery({
    queryKey: ["my-assignments", currentUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings_with_details").select("*")
        .eq("assigned_team_member", currentUserId)
        .eq("status", "assigned")
        .is("labour_team_id", null)
        .order("requested_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch MY pending approval (submitted to ops head)
  const { data: pendingApproval = [] } = useQuery({
    queryKey: ["my-pending-approval", currentUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings_with_details")
        .select("*")
        .eq("assigned_team_member", currentUserId)
        .eq("status", "assigned")
        .not("labour_team_id", "is", null)
        .is("approved_at", null)
        .order("requested_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch MY approved jobs (in progress)
  const { data: approvedJobs = [] } = useQuery({
    queryKey: ["my-approved-jobs", currentUserId],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings_with_details")
        .select("*")
        .eq("assigned_team_member", currentUserId)
        .in("status", ["allocated", "in_progress"])
        .order("requested_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all mukadams
  const { data: mukadams = [] } = useQuery({
    queryKey: ["mukadams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labour_teams")
        .select("*, team_activity_rates(*)")
        .order("mukkadam_name");
      if (error) throw error;
      return data || [];
    },
  });

  const handleAllocateMukadam = async () => {
    if (!allocatingBooking || !selectedMukadam) {
      toast.error("Please select a mukadam");
      return;
    }

    // Check if job assignment exists
    const { data: existingAssignment } = await supabase
      .from("job_assignments")
      .select("id")
      .eq("booking_id", allocatingBooking.id)
      .maybeSingle();

    if (existingAssignment) {
      // Update existing
      const { error } = await supabase
        .from("job_assignments")
        .update({
          team_member_id: currentUserId,
          labour_team_id: selectedMukadam,
          status: "allocated",
          estimated_start: estimatedStart ? estimatedStart.toISOString() : null,
          notes: allocationNotes || null,
        })
        .eq("id", existingAssignment.id);

      if (error) {
        toast.error("Failed to allocate mukadam");
        return;
      }
    } else {
      // Create new
      const { error } = await supabase
        .from("job_assignments")
        .insert({
          booking_id: allocatingBooking.id,
          team_member_id: currentUserId,
          labour_team_id: selectedMukadam,
          status: "allocated",
          estimated_start: estimatedStart ? estimatedStart.toISOString() : null,
          notes: allocationNotes || null,
        });

      if (error) {
        toast.error("Failed to allocate mukadam");
        return;
      }
    }

    // Booking stays in 'assigned' status until ops head approves
    toast.success("Mukadam allocated! Waiting for approval from Operations Head");
    queryClient.invalidateQueries({ queryKey: ["my-assignments"] });
    queryClient.invalidateQueries({ queryKey: ["my-pending-approval"] });
    setAllocatingBooking(null);
    setSelectedMukadam("");
    setEstimatedStart(undefined);
    setAllocationNotes("");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
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
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">Manage your assigned bookings</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Mukadam</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{myAssignments.length}</div>
            <p className="text-xs text-muted-foreground">Find mukadam & allocate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingApproval.length}</div>
            <p className="text-xs text-muted-foreground">Waiting for ops approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedJobs.length}</div>
            <p className="text-xs text-muted-foreground">Approved & in progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Need Mukadam Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Need Mukadam ({myAssignments.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myAssignments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending assignments
                </p>
              ) : (
                myAssignments.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow border-yellow-200">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{booking.farmer_name}</h4>
                            <p className="text-sm text-muted-foreground">{booking.activity_name}</p>
                          </div>
                          <Badge className="bg-yellow-500 text-white">
                            Action Needed
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(booking.requested_date), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.area_acres} acres
                          </div>
                          {booking.farmer_village && (
                            <div className="flex items-center gap-1">
                              📍 {booking.farmer_village}
                            </div>
                          )}
                        </div>

                        {booking.call_notes && (
                          <p className="text-xs bg-secondary/30 p-2 rounded">
                            📝 {booking.call_notes.substring(0, 80)}
                            {booking.call_notes.length > 80 && "..."}
                          </p>
                        )}

                        <Button
                          onClick={() => setAllocatingBooking(booking)}
                          size="sm"
                          className="w-full"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Find & Allocate Mukadam
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approval */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Approval ({pendingApproval.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApproval.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending approvals
                </p>
              ) : (
                pendingApproval.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow border-blue-200">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{booking.farmer_name}</h4>
                            <p className="text-sm text-muted-foreground">{booking.activity_name}</p>
                          </div>
                          <Badge className="bg-blue-500 text-white">
                            Submitted
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(booking.requested_date), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.area_acres} acres
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded text-xs space-y-1">
                          <div className="font-semibold text-green-700 dark:text-green-400">
                            ✓ Mukadam Allocated
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Team:</span>
                            <span className="font-medium">{booking.mukkadam_name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Labourers:</span>
                            <span className="font-medium">{booking.number_of_labourers}</span>
                          </div>
                          {booking.mukkadam_contact && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Contact:</span>
                              <span className="font-medium">{booking.mukkadam_contact}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <Clock className="h-3 w-3" />
                          Waiting for Operations Head approval
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            My Active Jobs ({approvedJobs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {approvedJobs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No active jobs
              </p>
            ) : (
              approvedJobs.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{booking.farmer_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {booking.activity_name} • {format(new Date(booking.requested_date), "MMM d")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500 text-white text-xs">
                      {booking.mukkadam_name}
                    </Badge>
                    <Badge className={cn(getStatusColor(booking.status), "text-white text-xs")}>
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Allocate Mukadam Dialog */}
      <Dialog open={!!allocatingBooking} onOpenChange={(open) => !open && setAllocatingBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Allocate Mukadam & Labour Team</DialogTitle>
          </DialogHeader>
          {allocatingBooking && (
            <div className="space-y-4">
              {/* Booking Details */}
              <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
                <div className="font-semibold text-lg">{allocatingBooking.farmer_name}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Activity:</span>{" "}
                    <span className="font-medium">{allocatingBooking.activity_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Area:</span>{" "}
                    <span className="font-medium">{allocatingBooking.area_acres} acres</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>{" "}
                    <span className="font-medium">
                      {format(new Date(allocatingBooking.requested_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>{" "}
                    <span className="font-medium">{allocatingBooking.farmer_village || "N/A"}</span>
                  </div>
                  {allocatingBooking.farmer_contact && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Contact:</span>{" "}
                      <span className="font-medium">{allocatingBooking.farmer_contact}</span>
                    </div>
                  )}
                </div>
              </div>

              {allocatingBooking.call_notes && (
                <div className="space-y-2">
                  <Label>Call Notes</Label>
                  <div className="text-sm bg-secondary/30 p-3 rounded">
                    {allocatingBooking.call_notes}
                  </div>
                </div>
              )}

              {/* Select Mukadam */}
              <div className="space-y-2">
                <Label>Select Mukadam *</Label>
                <Select value={selectedMukadam} onValueChange={setSelectedMukadam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose mukadam..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mukadams.map((mukadam) => {
                      const hasRate = mukadam.team_activity_rates?.some(
                        (rate: any) => rate.activity_type_id === allocatingBooking.activity_type_id
                      );
                      return (
                        <SelectItem key={mukadam.id} value={mukadam.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {mukadam.mukkadam_name} ({mukadam.number_of_labourers} labourers)
                            </span>
                            {hasRate && <span className="text-green-600 ml-2">✓ Has Rate</span>}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  ✓ indicates mukadam has rate set for this activity
                </p>
              </div>

              {/* Selected Mukadam Details */}
              {selectedMukadam && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                  {(() => {
                    const mukadam = mukadams.find(m => m.id === selectedMukadam);
                    return mukadam ? (
                      <div className="space-y-2 text-sm">
                        <div className="font-semibold text-green-700 dark:text-green-400">
                          Selected Team Details
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-muted-foreground">Labourers:</span>{" "}
                            <span className="font-medium">{mukadam.number_of_labourers}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Location:</span>{" "}
                            <span className="font-medium">{mukadam.location || "N/A"}</span>
                          </div>
                          {mukadam.contact && (
                            <div className="col-span-2 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span className="font-medium">{mukadam.contact}</span>
                            </div>
                          )}
                          {mukadam.transport_situation && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Transport:</span>{" "}
                              <span className="font-medium">{mukadam.transport_situation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Estimated Start Time */}
              <div className="space-y-2">
                <Label>Estimated Start Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !estimatedStart && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {estimatedStart ? format(estimatedStart, "PPP p") : <span>Pick a time</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={estimatedStart}
                      onSelect={setEstimatedStart}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={allocationNotes}
                  onChange={(e) => setAllocationNotes(e.target.value)}
                  placeholder="Special instructions, transport details, meeting points, etc."
                  rows={3}
                />
              </div>

              <Button onClick={handleAllocateMukadam} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}