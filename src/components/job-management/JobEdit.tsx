import { useState } from "react";
import React from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarIcon, 
  Users, 
  History as HistoryIcon,
  FileText,
  IndianRupee
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface JobEditDialogProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditHistory {
  id: string;
  field_changed: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  changed_at: string;
  reason?: string;
}

export function JobEditDialog({ job, open, onOpenChange }: JobEditDialogProps) {
  const [jobData, setJobData] = useState({
    farm_size_acres: job?.farm_size_acres || "",
    location: job?.location || "",
    requested_date: job?.requested_date ? new Date(job.requested_date) : undefined,
    requested_time: job?.requested_time || "07:00",
    farmer_price_per_acre: job?.farmer_price_per_acre || "",
    your_price_per_acre: job?.your_price_per_acre || "",
    workers_needed: job?.workers_needed || "",
    notes: job?.notes || ""
  });

  const [editReason, setEditReason] = useState("");
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);

  const queryClient = useQueryClient();

  // Fetch edit history
  const fetchEditHistory = async (jobId: string) => {
    const response = await fetch(`http://127.0.0.1:8000/api/jobs/${jobId}/edit_history/`);
    if (!response.ok) throw new Error("Failed to fetch history");
    const data = await response.json();
    setEditHistory(data);
  };

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`http://127.0.0.1:8000/api/jobs/${job.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          edit_reason: editReason
        }),
      });
      if (!response.ok) throw new Error("Failed to update job");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Job updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["simple-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onOpenChange(false);
      setEditReason("");
    },
    onError: (error) => {
      toast.error("Failed to update job: " + error.message);
    },
  });

  const handleSave = () => {
    if (!editReason) {
      toast.error("Please provide a reason for this edit");
      return;
    }

    const updates: any = {};
    
    if (jobData.farm_size_acres !== job.farm_size_acres) {
      updates.farm_size_acres = parseFloat(jobData.farm_size_acres);
    }
    if (jobData.location !== job.location) {
      updates.location = jobData.location;
    }
    if (jobData.requested_date) {
      const newDate = format(jobData.requested_date, "yyyy-MM-dd");
      if (newDate !== job.requested_date) {
        updates.requested_date = newDate;
      }
    }
    if (jobData.requested_time !== job.requested_time) {
      updates.requested_time = jobData.requested_time;
    }
    if (parseFloat(jobData.farmer_price_per_acre) !== job.farmer_price_per_acre) {
      updates.farmer_price_per_acre = parseFloat(jobData.farmer_price_per_acre);
    }
    if (jobData.your_price_per_acre && parseFloat(jobData.your_price_per_acre) !== job.your_price_per_acre) {
      updates.your_price_per_acre = parseFloat(jobData.your_price_per_acre);
    }
    if (parseInt(jobData.workers_needed) !== job.workers_needed) {
      updates.workers_needed = parseInt(jobData.workers_needed);
    }
    if (jobData.notes !== job.notes) {
      updates.notes = jobData.notes;
    }

    if (Object.keys(updates).length === 0) {
      toast.info("No changes to save");
      return;
    }

    updateJobMutation.mutate(updates);
  };

  // Load edit history when dialog opens
  React.useEffect(() => {
    if (open && job?.id) {
      fetchEditHistory(job.id);
      // Reset form with current job data
      setJobData({
        farm_size_acres: job.farm_size_acres || "",
        location: job.location || "",
        requested_date: job.requested_date ? new Date(job.requested_date) : undefined,
        requested_time: job.requested_time || "07:00",
        farmer_price_per_acre: job.farmer_price_per_acre || "",
        your_price_per_acre: job.your_price_per_acre || "",
        workers_needed: job.workers_needed || "",
        notes: job.notes || ""
      });
    }
  }, [open, job]);

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job - {job.farmer.name} ({job.activity.name})</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit Details</TabsTrigger>
            <TabsTrigger value="history">Edit History</TabsTrigger>
          </TabsList>

          {/* Edit Tab */}
          <TabsContent value="edit" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Farm Size (acres) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={jobData.farm_size_acres}
                  onChange={(e) => setJobData({ ...jobData, farm_size_acres: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Workers Needed *</Label>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={jobData.workers_needed}
                    onChange={(e) => setJobData({ ...jobData, workers_needed: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location *</Label>
              <Input
                value={jobData.location}
                onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Requested Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !jobData.requested_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {jobData.requested_date ? format(jobData.requested_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={jobData.requested_date}
                      onSelect={(date) => setJobData({ ...jobData, requested_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Requested Time</Label>
                <Input
                  type="time"
                  value={jobData.requested_time}
                  onChange={(e) => setJobData({ ...jobData, requested_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Farmer's Price (₹/acre) *</Label>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={jobData.farmer_price_per_acre}
                    onChange={(e) => setJobData({ ...jobData, farmer_price_per_acre: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your Price (₹/acre)</Label>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={jobData.your_price_per_acre}
                    onChange={(e) => setJobData({ ...jobData, your_price_per_acre: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={jobData.notes}
                onChange={(e) => setJobData({ ...jobData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Reason for Edit *</Label>
              <Textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Explain why you're making these changes..."
                rows={2}
              />
            </div>

            {/* Summary of Changes */}
            {jobData.farm_size_acres && jobData.farmer_price_per_acre && (
              <div className="p-4 bg-secondary/30 rounded space-y-2">
                <h4 className="font-semibold text-sm">Updated Job Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Farm Size:</span>
                    <p className="font-semibold">{jobData.farm_size_acres} acres</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Workers Required:</span>
                    <p className="font-semibold">{jobData.workers_needed} workers</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Job Value:</span>
                    <p className="font-semibold text-green-600">
                      ₹{(parseFloat(jobData.farm_size_acres) * parseFloat(jobData.farmer_price_per_acre)).toLocaleString()}
                    </p>
                  </div>
                  {jobData.your_price_per_acre && (
                    <div>
                      <span className="text-muted-foreground">Your Margin:</span>
                      <p className="font-semibold text-blue-600">
                        ₹{((parseFloat(jobData.farmer_price_per_acre) - parseFloat(jobData.your_price_per_acre)) * parseFloat(jobData.farm_size_acres)).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={updateJobMutation.isPending || !editReason}
                className="flex-1"
              >
                {updateJobMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {editHistory.map((entry) => (
                  <div key={entry.id} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{entry.field_changed}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="line-through">{entry.old_value}</span>
                            {" → "}
                            <span className="text-green-600">{entry.new_value}</span>
                          </p>
                          {entry.reason && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              "{entry.reason}"
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">
                          {format(new Date(entry.changed_at), "MMM d, h:mm a")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        By {entry.changed_by}
                      </p>
                    </div>
                  </div>
                ))}

                {editHistory.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No edit history available
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}