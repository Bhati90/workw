// Create ReAssignJobDialog.tsx
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Users, MapPin, Phone, Send, RefreshCw, AlertCircle } from "lucide-react";

interface Job {
  id: string;
  farmer: {
    name: string;
  };
  activity: {
    name: string;
  };
  farm_size_acres: number;
  farmer_price_per_acre: number;
}

interface ReAssignJobDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAssignments: string[]; // Array of mukadam IDs already assigned
}

export function ReAssignJobDialog({ job, open, onOpenChange, currentAssignments }: ReAssignJobDialogProps) {
  const [selectedMukadams, setSelectedMukadams] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  // Get all mukadams excluding already assigned ones
  const { data: availableMukadams = [] } = useQuery({
    queryKey: ["available-mukadams", currentAssignments],
    queryFn: async () => {
      const response = await fetch("https://workcrop.onrender.com/api/mukadams/?detailed=true");
      if (!response.ok) throw new Error("Failed to fetch mukadams");
      const data = await response.json();
      const allMukadams = data.results || data;
      
      // Filter out already assigned mukadams
      return allMukadams.filter(mukadam => 
        mukadam.is_active && !currentAssignments.includes(mukadam.id)
      );
    },
    enabled: open && currentAssignments.length > 0,
  });

  const reassignMutation = useMutation({
    mutationFn: async ({ mukadamIds, reason }: { mukadamIds: string[], reason: string }) => {
      if (!job) throw new Error("No job selected");
      
      const response = await fetch(`https://workcrop.onrender.com/api/jobs/${job.id}/reassign_to_mukadams/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mukadam_ids: mukadamIds,
          reason: reason,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to re-assign job");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const { new_assignments, skipped, summary } = data;
      
      if (summary.successfully_assigned > 0) {
        toast.success(
          `Re-assigned to ${summary.successfully_assigned} additional mukadams! ` +
          `${skipped.length > 0 ? `(${skipped.length} skipped)` : ''}`
        );
      } else {
        toast.warning("No new assignments created. All selected mukadams were already assigned.");
      }
      
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-bid-details"] });
      setSelectedMukadams([]);
      setReason("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to re-assign job: " + error.message);
    },
  });

  const handleMukadamToggle = (mukadamId: string) => {
    setSelectedMukadams(prev => 
      prev.includes(mukadamId) 
        ? prev.filter(id => id !== mukadamId)
        : [...prev, mukadamId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMukadams.length === availableMukadams.length) {
      setSelectedMukadams([]);
    } else {
      setSelectedMukadams(availableMukadams.map(m => m.id));
    }
  };

  const handleSubmit = () => {
    if (selectedMukadams.length === 0) {
      toast.error("Please select at least one mukadam");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for re-assignment");
      return;
    }

    reassignMutation.mutate({ 
      mukadamIds: selectedMukadams, 
      reason: reason.trim() 
    });
  };

  if (!job) return null;

  const totalLabourers = availableMukadams
    .filter(m => selectedMukadams.includes(m.id))
    .reduce((sum, m) => sum + m.number_of_labourers, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Re-assign Job to Additional Mukadams
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Expand your bidding pool by assigning this job to more mukadams
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Summary */}
          <Card className="bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Farmer:</span>
                  <p className="font-semibold">{job.farmer.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Activity:</span>
                  <p className="font-semibold">{job.activity.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Farm Size:</span>
                  <p className="font-semibold">{job.farm_size_acres} acres</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Budget:</span>
                  <p className="font-semibold">₹{job.farmer_price_per_acre}/acre</p>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <span className="text-muted-foreground">Already assigned to:</span>
                <span className="ml-2 font-medium">{currentAssignments.length} mukadams</span>
              </div>
            </CardContent>
          </Card>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Re-assignment *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Need more competitive pricing, require additional options, current bids unsatisfactory..."
              className="min-h-[60px]"
            />
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Select Additional Mukadams</h3>
              <p className="text-sm text-muted-foreground">
                Choose from mukadams not yet assigned to this job
              </p>
            </div>
            <div className="text-right space-y-1">
              <Button 
                variant="outline" 
                onClick={handleSelectAll} 
                size="sm"
                disabled={availableMukadams.length === 0}
              >
                {selectedMukadams.length === availableMukadams.length ? "Deselect All" : "Select All"}
              </Button>
              <div className="text-sm text-muted-foreground">
                {selectedMukadams.length} selected • {totalLabourers} total labourers
              </div>
            </div>
          </div>

          {/* Available Mukadams */}
          {availableMukadams.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="grid gap-3 md:grid-cols-2">
                {availableMukadams.map((mukadam) => {
                  const isSelected = selectedMukadams.includes(mukadam.id);
                  
                  return (
                    <Card 
                      key={mukadam.id}
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "hover:bg-secondary/30"
                      }`}
                      onClick={() => handleMukadamToggle(mukadam.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                checked={isSelected}
                                onChange={() => {}}
                              />
                              <div>
                                <h4 className="font-semibold">{mukadam.name}</h4>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  {mukadam.number_of_labourers} labourers
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-green-500">Available</Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {mukadam.location}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {mukadam.phone}
                            </div>
                          </div>

                          {/* Performance indicators */}
                          {mukadam.won_bids !== undefined && (
                            <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded">
                              Success Rate: {mukadam.won_bids || 0} wins / {mukadam.total_jobs || 0} jobs
                              {mukadam.avg_bid_price > 0 && (
                                <span className="ml-2">• Avg: ₹{mukadam.avg_bid_price}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No additional mukadams available</p>
                <p className="text-sm text-muted-foreground">
                  All active mukadams have already been assigned to this job
                </p>
              </CardContent>
            </Card>
          )}

          {/* Warning */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-blue-700 dark:text-blue-400">
                    Additional Bidding Round
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    New mukadams will be notified about this job opportunity. They'll have 48 hours to submit their bids.
                    Existing bids will remain active for comparison.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={selectedMukadams.length === 0 || !reason.trim() || reassignMutation.isPending}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {reassignMutation.isPending 
                ? "Re-assigning..." 
                : `Re-assign to ${selectedMukadams.length} Mukadams`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}