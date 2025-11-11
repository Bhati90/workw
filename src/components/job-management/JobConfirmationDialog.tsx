import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { api } from '@/lib/api';

interface JobConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledData?: {
    farmerName?: string;
    activity?: string;
    farmSize?: string;
    location?: string;
  };
}

export function JobConfirmationDialog({ 
  open, 
  onOpenChange, 
  prefilledData 
}: JobConfirmationDialogProps) {
  const [farmerName, setFarmerName] = useState(prefilledData?.farmerName || "");
  const [farmerPhone, setFarmerPhone] = useState("");
  const [farmerVillage, setFarmerVillage] = useState("");
  const [activityName, setActivityName] = useState(prefilledData?.activity || "");
  const [farmSize, setFarmSize] = useState(prefilledData?.farmSize || "");
  const [location, setLocation] = useState(prefilledData?.location || "");
  const [requestedDate, setRequestedDate] = useState<Date | undefined>();
  const [requestedTime, setRequestedTime] = useState("07:00");
  const [pricePerAcre, setPricePerAcre] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  // In JobConfirmationDialog.tsx, update the mutation:


const confirmJobMutation = useMutation({
  mutationFn: async (jobData: any) => {
    return api.confirmJob(jobData);  // Use the API client
  },
  onSuccess: () => {
    toast.success("Job confirmed successfully!");
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
    onOpenChange(false);
    resetForm();
  },
  onError: (error) => {
    console.error('API Error:', error);
    toast.error("Failed to confirm job: " + error.message);
  },
});

  const resetForm = () => {
    setFarmerName("");
    setFarmerPhone("");
    setFarmerVillage("");
    setActivityName("");
    setFarmSize("");
    setLocation("");
    setRequestedDate(undefined);
    setRequestedTime("07:00");
    setPricePerAcre("");
    setNotes("");
  };

  const handleSubmit = () => {
    if (!farmerName || !farmerPhone || !activityName || !farmSize || !requestedDate || !pricePerAcre) {
      toast.error("Please fill all required fields");
      return;
    }

    const jobData = {
      farmer_name: farmerName,
      farmer_phone: farmerPhone,
      farmer_village: farmerVillage,
      activity_name: activityName,
      farm_size_acres: parseFloat(farmSize),
      location: location,
      requested_date: format(requestedDate, "yyyy-MM-dd"),
      requested_time: requestedTime,
      farmer_price_per_acre: parseFloat(pricePerAcre),
      notes: notes,
    };

    confirmJobMutation.mutate(jobData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm New Job</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Farmer Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Farmer Name *</Label>
              <Input
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                placeholder="Enter farmer name"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                value={farmerPhone}
                onChange={(e) => setFarmerPhone(e.target.value)}
                placeholder="+91-XXXXXXXXXX"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Village *</Label>
            <Input
              value={farmerVillage}
              onChange={(e) => setFarmerVillage(e.target.value)}
              placeholder="Enter village name"
            />
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Activity Type *</Label>
              <Input
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="e.g., Pruning, Spray, Tying"
              />
            </div>
            <div className="space-y-2">
              <Label>Farm Size (acres) *</Label>
              <Input
                type="number"
                step="0.1"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location/Farm Address *</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter specific location or landmarks"
            />
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Requested Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !requestedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {requestedDate ? format(requestedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={requestedDate}
                    onSelect={setRequestedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Preferred Time</Label>
              <Input
                type="time"
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <Label>Farmer's Price Per Acre (₹) *</Label>
            <Input
              type="number"
              step="50"
              value={pricePerAcre}
              onChange={(e) => setPricePerAcre(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions, requirements, or notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={confirmJobMutation.isPending}
              className="flex-1"
            >
              {confirmJobMutation.isPending ? "Confirming..." : "Confirm Job"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}