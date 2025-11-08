import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, isSameDay, isWithinInterval } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, MapPin, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamAvailabilityDialogProps {
  team: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamAvailabilityDialog({ team, open, onOpenChange }: TeamAvailabilityDialogProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const queryClient = useQueryClient();

  // Fetch availability periods
  const { data: availabilityPeriods = [] } = useQuery({
    queryKey: ["team-availability", team?.id],
    queryFn: async () => {
      if (!team?.id) return [];
      const { data, error } = await supabase
        .from("team_availability")
        .select("*")
        .eq("labour_team_id", team.id)
        .order("start_date");

      if (error) throw error;
      return data || [];
    },
    enabled: !!team?.id && open,
  });

  // Fetch allocated jobs for this team
  const { data: allocatedJobs = [] } = useQuery({
    queryKey: ["team-jobs", team?.id],
    queryFn: async () => {
      if (!team?.id) return [];
      const { data, error } = await supabase
        .from("bookings_with_details")
        .select("*")
        .eq("labour_team_id", team.id)
        .in("status", ["allocated", "in_progress"])
        .order("requested_date");

      if (error) throw error;
      return data || [];
    },
    enabled: !!team?.id && open,
  });

  const handleAddPeriod = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (startDate > endDate) {
      toast.error("End date must be after start date");
      return;
    }

    const { error } = await supabase.from("team_availability").insert({
      labour_team_id: team.id,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
    });

    if (error) {
      toast.error("Failed to add availability period");
      return;
    }

    toast.success("Availability period added");
    queryClient.invalidateQueries({ queryKey: ["team-availability", team.id] });
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleDeletePeriod = async (periodId: string) => {
    const { error } = await supabase
      .from("team_availability")
      .delete()
      .eq("id", periodId);

    if (error) {
      toast.error("Failed to delete availability period");
      return;
    }

    toast.success("Availability period deleted");
    queryClient.invalidateQueries({ queryKey: ["team-availability", team.id] });
  };

  // Check if a date is within any availability period
  const isDateAvailable = (date: Date) => {
    return availabilityPeriods.some((period: any) =>
      isWithinInterval(date, {
        start: new Date(period.start_date),
        end: new Date(period.end_date),
      })
    );
  };

  // Get jobs for a specific date
  const getJobsForDate = (date: Date) => {
    return allocatedJobs.filter((job: any) =>
      isSameDay(new Date(job.requested_date), date)
    );
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Team Availability - {team.mukkadam_name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="space-y-6 pr-4">
            {/* Team Info */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Mukkadam:</span>{" "}
                    <span className="font-medium">{team.mukkadam_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Labourers:</span>{" "}
                    <span className="font-medium">{team.number_of_labourers}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>{" "}
                    <span className="font-medium">{team.location || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Add Availability */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Availability Period
                </h4>

                <Card>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Start Date</label>
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        className="rounded-md border"
                        disabled={(date) => date < new Date()}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">End Date</label>
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        className="rounded-md border"
                        disabled={(date) => date < (startDate || new Date())}
                      />
                    </div>

                    <Button onClick={handleAddPeriod} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Period
                    </Button>
                  </CardContent>
                </Card>

                {/* Current Availability Periods */}
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Availability Periods ({availabilityPeriods.length})
                  </h4>
                  <div className="space-y-2">
                    {availabilityPeriods.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No availability periods set
                      </p>
                    ) : (
                      availabilityPeriods.map((period: any) => (
                        <Card key={period.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">
                                  {format(new Date(period.start_date), "MMM d, yyyy")} -{" "}
                                  {format(new Date(period.end_date), "MMM d, yyyy")}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {Math.ceil(
                                    (new Date(period.end_date).getTime() -
                                      new Date(period.start_date).getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )}{" "}
                                  days
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePeriod(period.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Allocated Jobs */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Allocated Jobs ({allocatedJobs.length})
                </h4>

                {allocatedJobs.length === 0 ? (
                  <Card>
                    <CardContent className="pt-4 text-center py-8 text-muted-foreground">
                      No jobs currently allocated
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {allocatedJobs.map((job: any) => (
                      <Card key={job.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-semibold">{job.activity_name}</h5>
                                <p className="text-sm text-muted-foreground">
                                  {job.farmer_name}
                                </p>
                              </div>
                              <Badge
                                className={cn(
                                  job.status === "allocated"
                                    ? "bg-purple-500"
                                    : "bg-orange-500",
                                  "text-white"
                                )}
                              >
                                {job.status === "allocated" ? "Allocated" : "In Progress"}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {format(new Date(job.requested_date), "MMM d, yyyy")}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.area_acres} acres
                              </div>
                            </div>

                            {job.farmer_village && (
                              <div className="text-xs text-muted-foreground">
                                📍 {job.farmer_village}
                              </div>
                            )}

                            {!isDateAvailable(new Date(job.requested_date)) && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                ⚠️ Outside availability period
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}