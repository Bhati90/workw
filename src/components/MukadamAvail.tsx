import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AvailabilityPeriod {
  id: string;
  start_date: string;
  end_date: string;
  notes: string;
  has_job_in_period: boolean;
  created_at: string;
}

interface MukadamAvailabilityDialogProps {
  mukadam: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MukadamAvailabilityDialog({ 
  mukadam, 
  open, 
  onOpenChange 
}: MukadamAvailabilityDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  
  const queryClient = useQueryClient();

  // Fetch availability periods
  const { data: availability, isLoading } = useQuery({
    queryKey: ["mukadam-availability", mukadam?.id],
    queryFn: async () => {
      if (!mukadam?.id) return null;
      const response = await fetch(
        `http://127.0.0.1:8000/api/mukadams/${mukadam.id}/availability_periods/`
      );
      if (!response.ok) throw new Error("Failed to fetch availability");
      return response.json();
    },
    enabled: open && !!mukadam?.id,
  });

  // Add availability mutation
  const addAvailabilityMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        `http://127.0.0.1:8000/api/mukadams/${mukadam.id}/add_availability/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add availability");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success("Availability period added successfully!");
      queryClient.invalidateQueries({ queryKey: ["mukadam-availability"] });
      queryClient.invalidateQueries({ queryKey: ["mukadams-list"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-availability"] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Delete availability mutation
  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (periodId: string) => {
      const response = await fetch(
        `http://127.0.0.1:8000/api/mukadams/${mukadam.id}/availability_periods/${periodId}/`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete availability");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Availability period deleted!");
      queryClient.invalidateQueries({ queryKey: ["mukadam-availability"] });
      queryClient.invalidateQueries({ queryKey: ["mukadams-list"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-availability"] });
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  const resetForm = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setNotes("");
  };

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    addAvailabilityMutation.mutate({
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      notes: notes,
    });
  };

  if (!mukadam) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Manage Availability - {mukadam.mukkadam_name}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {mukadam.number_of_labourers} workers • {mukadam.location}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Add Availability */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card className={cn(
              "border-2",
              availability?.is_currently_available 
                ? "border-green-500 bg-green-50 dark:bg-green-950/20" 
                : "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
            )}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {availability?.is_currently_available ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-orange-600" />
                  )}
                  <div>
                    <p className="font-semibold text-lg">
                      {availability?.is_currently_available 
                        ? "Available Today" 
                        : "Not Available Today"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {availability?.availability_periods?.length || 0} availability periods set
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Availability Form */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Availability Period
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      className="rounded-md border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      className="rounded-md border"
                      disabled={(date) => !startDate || date < startDate}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Available for all types of work, Prefer morning shifts, etc."
                      rows={3}
                    />
                  </div>

                  {startDate && endDate && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        📅 Setting availability from {format(startDate, "MMM d, yyyy")} to {format(endDate, "MMM d, yyyy")}
                      </p>
                      {notes && (
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          {notes}
                        </p>
                      )}
                    </div>
                  )}

                  <Button 
                    onClick={handleSubmit}
                    disabled={!startDate || !endDate || addAvailabilityMutation.isPending}
                    className="w-full"
                  >
                    {addAvailabilityMutation.isPending ? "Adding..." : "Add Availability Period"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Existing Periods */}
          <div className="space-y-6">
            {/* Availability Periods List */}
            {isLoading ? (
              <div className="text-center py-12">Loading availability...</div>
            ) : availability?.availability_periods && availability.availability_periods.length > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Current Availability Periods</h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {availability.availability_periods.map((period: AvailabilityPeriod) => (
                      <div 
                        key={period.id}
                        className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-green-900 dark:text-green-100">
                              {format(new Date(period.start_date), "MMM d, yyyy")} 
                              {" → "} 
                              {format(new Date(period.end_date), "MMM d, yyyy")}
                            </p>
                            {period.notes && (
                              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                {period.notes}
                              </p>
                            )}
                            {period.has_job_in_period && (
                              <Badge variant="outline" className="mt-2 text-xs bg-orange-100 text-orange-700 border-orange-300">
                                Has jobs in this period
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Delete this availability period?")) {
                                deleteAvailabilityMutation.mutate(period.id);
                              }
                            }}
                            disabled={deleteAvailabilityMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No availability periods set</p>
                  <p className="text-sm text-muted-foreground">
                    Add availability periods to show when this team is available for work
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Jobs */}
            {availability?.upcoming_jobs && availability.upcoming_jobs.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Upcoming Jobs</h3>
                  <div className="space-y-2">
                    {availability.upcoming_jobs.map((job: any, idx: number) => (
                      <div 
                        key={idx}
                        className="p-3 bg-secondary/20 rounded text-sm"
                      >
                        <p className="font-medium">{format(new Date(job.date), "MMM d, yyyy")}</p>
                        <p className="text-muted-foreground">{job.farmer} - {job.activity}</p>
                        <Badge variant="outline" className="mt-1 text-xs">{job.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}