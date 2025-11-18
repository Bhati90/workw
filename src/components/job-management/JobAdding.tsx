import { useState } from "react";
import { useMutation, useQueryClient,useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Users } from "lucide-react";  
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface Crop {
  id: string;
  name: string;
}

interface CropVariety {
  id: string;
  crop: string;
  name: string;
}

interface Activity {
  id: string;
  name: string;
  description: string;
  days_after_pruning: number;
}


interface JobAddingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledData?: {
    farmerName?: string;
    activity?: string;
    farmSize?: string;
    location?: string;
  };
}

export function JobAddingDialog({ 
  open, 
  onOpenChange, 
  prefilledData 
}: JobAddingDialogProps) {
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
  const [workersNeeded, setWorkersNeeded] = useState("5");
  

  const [selectedCrop, setSelectedCrop] = useState("");
const [selectedVariety, setSelectedVariety] = useState("");
const [selectedActivity, setSelectedActivity] = useState("");


  const queryClient = useQueryClient();

  const confirmJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await fetch("http://127.0.0.1:8000/api/jobs/confirm_job/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(JSON.stringify(error));
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success("Job confirmed successfully!");
      queryClient.invalidateQueries({ queryKey: ["simple-jobs"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('API Error:', error);
      toast.error("Failed to confirm job: " + error.message);
    },
  });



  // Fetch crops
const { data: crops = [] } = useQuery({
  queryKey: ["crops"],
  queryFn: async (): Promise<Crop[]> => {
    const response = await fetch("http://127.0.0.1:8000/api/crops/");
    if (!response.ok) throw new Error("Failed to fetch crops");
    const data = await response.json();
    return data.results || data;
  },
});

// Fetch varieties (filtered by selected crop)
const { data: varieties = [] } = useQuery({
  queryKey: ["varieties", selectedCrop],
  queryFn: async (): Promise<CropVariety[]> => {
    if (!selectedCrop) return [];
    const response = await fetch(`http://127.0.0.1:8000/api/crop-varieties/?crop=${selectedCrop}`);
    const data = await response.json();
    return data.results || data;
  },
  enabled: !!selectedCrop,
});

// Fetch activities (filtered by crop)
const { data: activities = [] } = useQuery({
  queryKey: ["activities", selectedCrop],
  queryFn: async (): Promise<Activity[]> => {
    let url = "http://127.0.0.1:8000/api/activities/";
    if (selectedCrop) url += `?crop=${selectedCrop}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results || data;
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
    setWorkersNeeded("5");
    setNotes("");
  };

  const handleFarmSizeChange = (size: string) => {
    setFarmSize(size);
    
    // Auto-suggest workers based on farm size
    const sizeNum = parseFloat(size);
    if (sizeNum) {
      let suggestedWorkers = 5;
      if (sizeNum <= 1) suggestedWorkers = 3;
      else if (sizeNum <= 3) suggestedWorkers = 5;
      else if (sizeNum <= 6) suggestedWorkers = 8;
      else if (sizeNum <= 10) suggestedWorkers = 12;
      else suggestedWorkers = 15;
      
      setWorkersNeeded(suggestedWorkers.toString());
    }
  };

  const handleSubmit = () => {
  if (!selectedCrop || !selectedActivity || !farmSize || !requestedDate || !pricePerAcre || !workersNeeded) {
    toast.error("Please fill all required fields");
    return;
  }

  const jobData = {
    farmer_name: farmerName,
    phone_number: farmerPhone,
    farmer_village: farmerVillage || location,
    crop_id: selectedCrop,  // ✅ ADD
    crop_variety_id: selectedVariety || null,  // ✅ ADD
    activity_briefs: [
      {
        activity_id: selectedActivity,  // ✅ CHANGE to activity_id
        acres: parseFloat(farmSize),
        date_needed: format(requestedDate, "yyyy-MM-dd")
      }
    ],
    location: location || farmerVillage,
    requested_date: format(requestedDate, "yyyy-MM-dd"),
    requested_time: requestedTime,
    workers_needed: parseInt(workersNeeded),
    farmer_price_per_acre: parseFloat(pricePerAcre),
    notes: notes,
  };
console.log("Sending job data:", jobData);
    
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

          {/* Crop Selection */}
<div className="space-y-2">
  <Label>Crop *</Label>
  <Select 
    value={selectedCrop} 
    onValueChange={(value) => {
      setSelectedCrop(value);
      setSelectedVariety("");  // Reset variety when crop changes
      setSelectedActivity("");  // Reset activity when crop changes
    }}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select crop type" />
    </SelectTrigger>
    <SelectContent>
      {crops.map((crop) => (
        <SelectItem key={crop.id} value={crop.id}>
          {crop.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

{/* Variety Selection (Optional) */}
<div className="space-y-2">
  <Label>Crop Variety (Optional)</Label>
  <Select 
    value={selectedVariety} 
    onValueChange={setSelectedVariety}
    disabled={!selectedCrop}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select variety" />
    </SelectTrigger>
    <SelectContent>
      {varieties.map((variety) => (
        <SelectItem key={variety.id} value={variety.id}>
          {variety.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

{/* Activity Selection - REPLACE the text input with dropdown */}
<div className="space-y-2">
  <Label>Activity Type *</Label>
  <Select 
    value={selectedActivity} 
    onValueChange={setSelectedActivity}
    disabled={!selectedCrop}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select activity" />
    </SelectTrigger>
    <SelectContent>
      {activities.map((activity) => (
        <SelectItem key={activity.id} value={activity.id}>
          {activity.name} ({activity.days_after_pruning} days after pruning)
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
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
                onChange={(e) => handleFarmSizeChange(e.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Workers and Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Workers Needed *</Label>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={workersNeeded}
                  onChange={(e) => setWorkersNeeded(e.target.value)}
                  placeholder="5"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Estimated based on farm size. Adjust as needed.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Location/Farm Address *</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter specific location or landmarks"
              />
            </div>
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

          {/* Job Summary */}
          {farmSize && workersNeeded && pricePerAcre && (
            <div className="p-4 bg-secondary/30 rounded space-y-2">
              <h4 className="font-semibold text-sm">Job Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Farm Size:</span>
                  <p className="font-semibold">{farmSize} acres</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Workers Required:</span>
                  <p className="font-semibold">{workersNeeded} workers</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Rate per Acre:</span>
                  <p className="font-semibold">₹{pricePerAcre}/acre</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Job Value:</span>
                  <p className="font-semibold text-green-600">
                    ₹{(parseFloat(farmSize) * parseFloat(pricePerAcre)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

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