import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Users, MapPin, Phone, Send, AlertCircle } from "lucide-react";
import { Job, Mukadam } from "@/types/job";

interface MukadamAssignmentDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MukadamAssignmentDialog({ job, open, onOpenChange }: MukadamAssignmentDialogProps) {
  const [selectedMukadams, setSelectedMukadams] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: mukadamResponse = {}, isLoading } = useQuery({
    queryKey: ["mukadams"],
    queryFn: async () => {
      const response = await fetch("https://workcrop.onrender.com//api/mukadams/");
      if (!response.ok) throw new Error("Failed to fetch mukadams");
      const data = await response.json();
      console.log("🔍 Mukadams API Response:", data);
      return data;
    },
    enabled: open,
  });

const mukadams = Array.isArray(mukadamResponse?.results)
  ? mukadamResponse.results
  : Array.isArray(mukadamResponse)
  ? mukadamResponse
  : [];

  console.log("👥 Mukadams array:", mukadams);

  const assignJobMutation = useMutation({
    mutationFn: async (mukadamIds: string[]) => {
      if (!job) throw new Error("No job selected");
      
      const response = await fetch(`https://workcrop.onrender.com//api/jobs/${job.id}/assign_to_mukadams/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mukadam_ids: mukadamIds,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to assign job");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Job assigned to ${selectedMukadams.length} mukadams successfully!`);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setSelectedMukadams([]);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to assign job: " + error.message);
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
    if (selectedMukadams.length === mukadams.length) {
      setSelectedMukadams([]);
    } else {
      setSelectedMukadams(mukadams.map(m => m.id));
    }
  };

  const handleAssign = () => {
    if (selectedMukadams.length === 0) {
      toast.error("Please select at least one mukadam");
      return;
    }
    assignJobMutation.mutate(selectedMukadams);
  };

  if (!job) return null;

  const totalLabourers = mukadams
    .filter(m => selectedMukadams.includes(m.id))
    .reduce((sum, m) => sum + (m.number_of_labourers || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Assign Job to Mukadams</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] pr-4">
          <div className="space-y-6">
            {/* Job Summary */}
            <Card className="bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Farmer:</span>
                    <p className="font-semibold">{job.farmer?.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Activity:</span>
                    <p className="font-semibold">{job.activity?.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Farm Size:</span>
                    <p className="font-semibold">{job.farm_size_acres} acres</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <p className="font-semibold">
                      {new Date(job.requested_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-sm">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="ml-2 font-medium">{job.location}</span>
                </div>
                {job.notes && (
                  <div className="mt-3 text-sm">
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="mt-1 text-xs bg-white dark:bg-gray-800 p-2 rounded">
                      {job.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Select Mukadams to Notify</h3>
                <p className="text-sm text-muted-foreground">
                  Choose mukadams who should receive this job for bidding
                </p>
              </div>
              <div className="text-right space-y-1">
                <Button variant="outline" onClick={handleSelectAll} size="sm">
                  {selectedMukadams.length === mukadams.length ? "Deselect All" : "Select All"}
                </Button>
                <div className="text-sm text-muted-foreground">
                  {selectedMukadams.length} selected • {totalLabourers} total labourers
                </div>
              </div>
            </div>

            {/* Mukadam List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mukadams.map((mukadam) => {
                console.log("🎯 Individual mukadam:", mukadam);
                
                const isSelected = selectedMukadams.includes(mukadam.id);
                
                return (
                  <Card 
                    key={mukadam.id}
                    className={`cursor-pointer transition-all border-2 ${
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                    onClick={() => handleMukadamToggle(mukadam.id)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header with checkbox and name */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Checkbox 
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-base leading-tight">
                                {mukadam.name || "No Name"}
                              </h4>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <Users className="h-3 w-3 flex-shrink-0" />
                                <span>{mukadam.number_of_labourers || 0} labourers</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Status badge */}
                          <Badge 
                            className={`ml-2 ${
                              mukadam.is_active 
                                ? "bg-green-500 hover:bg-green-600" 
                                : "bg-red-500 hover:bg-red-600"
                            } text-white`}
                          >
                            {mukadam.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        {/* Contact details */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{mukadam.location || "No location"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{mukadam.phone || "No phone"}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Show message if no mukadams */}
            {mukadams.length === 0 && !isLoading && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No mukadams available</p>
                  <p className="text-sm text-muted-foreground">Add mukadams to assign jobs</p>
                </CardContent>
              </Card>
            )}

            {/* Warning for farmer price */}
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold text-orange-700 dark:text-orange-400">
                      Job Details Shared (Price Hidden)
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-300">
                      Mukadams will receive job details but NOT the farmer's offered price of ₹{job.farmer_price_per_acre}/acre. 
                      They will submit their own bids which you can compare and select from.
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
                onClick={handleAssign}
                disabled={selectedMukadams.length === 0 || assignJobMutation.isPending}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {assignJobMutation.isPending 
                  ? "Sending..." 
                  : `Send to ${selectedMukadams.length} Mukadams`
                }
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}