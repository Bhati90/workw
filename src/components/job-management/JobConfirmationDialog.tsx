import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { IndianRupee, Calculator } from "lucide-react";

interface JobConfirmationDialogProps {
  job: any | null;  // Accept any job object or null
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobConfirmationDialog({ job, open, onOpenChange }: JobConfirmationDialogProps) {
  const [yourPrice, setYourPrice] = useState("");
  const queryClient = useQueryClient();

  const confirmJobMutation = useMutation({
    mutationFn: async (priceData: { yourPrice: number }) => {
      const response = await fetch("https://workcrop.onrender.com/api/job/confirm_and_price/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id,
          your_price_per_acre: priceData.yourPrice,
          farmer_original_price: job.farmer_price_per_acre
        }),
      });
      
      if (!response.ok) throw new Error("Failed to confirm job");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Job confirmed at ₹${data.your_price}/acre!`);
      queryClient.invalidateQueries({ queryKey: ["simple-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setYourPrice("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to confirm job: " + error.message);
    },
  });

  const handleConfirm = () => {
    if (!yourPrice || parseFloat(yourPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    confirmJobMutation.mutate({
      yourPrice: parseFloat(yourPrice)
    });
  };

  // ✅ Guard against null job
  if (!job) {
    return null;
  }

  // ✅ Calculate safely with fallbacks
  const farmerPrice = job.farmer_price_per_acre || 0;
  const farmSize = job.farm_size_acres || 0;
  const totalAmount = yourPrice ? parseFloat(yourPrice) * farmSize : 0;
  const farmerTotal = farmerPrice * farmSize;
  const margin = yourPrice ? farmerTotal - totalAmount : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirm Job & Set Your Price</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Farmer:</span>
                  <p className="font-semibold">{job.farmer?.name || "Unknown"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Activity:</span>
                  <p className="font-semibold">{job.activity?.name || "Unknown"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Farm Size:</span>
                  <p className="font-semibold">{farmSize} acres</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Farmer's Budget:</span>
                  <p className="font-semibold">₹{farmerPrice}/acre</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Setting */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label>Your Price (₹ per acre) *</Label>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={yourPrice}
                    onChange={(e) => setYourPrice(e.target.value)}
                    placeholder="Enter your price per acre"
                    step="50"
                    min="0"
                  />
                </div>
              </div>

              {/* Price Calculation */}
              {yourPrice && parseFloat(yourPrice) > 0 && (
                <div className="bg-secondary/30 p-4 rounded space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calculator className="h-4 w-4" />
                    <span className="font-medium">Price Calculation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Farmer pays:</span>
                      <p className="font-semibold">₹{farmerTotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mukadam gets:</span>
                      <p className="font-semibold">₹{totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Your margin:</span>
                      <p className={`font-semibold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{margin.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Margin %:</span>
                      <p className={`font-semibold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {farmerTotal > 0 ? ((margin / farmerTotal) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!yourPrice || parseFloat(yourPrice) <= 0 || confirmJobMutation.isPending}
              className="flex-1"
            >
              {confirmJobMutation.isPending ? "Confirming..." : "Confirm & Set Price"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// import { useState } from "react";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Calendar } from "@/components/ui/calendar";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { toast } from "sonner";
// import { CalendarIcon, Clock } from "lucide-react";
// import { format } from "date-fns";
// import { cn } from "@/lib/utils";
// import { api } from '@/lib/api';

// interface JobConfirmationDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   prefilledData?: {
//     farmerName?: string;
//     activity?: string;
//     farmSize?: string;
//     location?: string;
//   };
// }

// export function JobConfirmationDialog({ 
//   open, 
//   onOpenChange, 
//   prefilledData 
// }: JobConfirmationDialogProps) {
//   const [farmerName, setFarmerName] = useState(prefilledData?.farmerName || "");
//   const [farmerPhone, setFarmerPhone] = useState("");
//   const [farmerVillage, setFarmerVillage] = useState("");
//   const [activityName, setActivityName] = useState(prefilledData?.activity || "");
//   const [farmSize, setFarmSize] = useState(prefilledData?.farmSize || "");
//   const [location, setLocation] = useState(prefilledData?.location || "");
//   const [requestedDate, setRequestedDate] = useState<Date | undefined>();
//   const [requestedTime, setRequestedTime] = useState("07:00");
//   const [pricePerAcre, setPricePerAcre] = useState("");
//   const [notes, setNotes] = useState("");

//   const queryClient = useQueryClient();

//   // In JobConfirmationDialog.tsx, update the mutation:


// const confirmJobMutation = useMutation({
//   mutationFn: async (jobData: any) => {
//     return api.confirmJob(jobData);  // Use the API client
//   },
//   onSuccess: () => {
//     toast.success("Job confirmed successfully!");
//     queryClient.invalidateQueries({ queryKey: ["jobs"] });
//     onOpenChange(false);
//     resetForm();
//   },
//   onError: (error) => {
//     console.error('API Error:', error);
//     toast.error("Failed to confirm job: " + error.message);
//   },
// });

//   const resetForm = () => {
//     setFarmerName("");
//     setFarmerPhone("");
//     setFarmerVillage("");
//     setActivityName("");
//     setFarmSize("");
//     setLocation("");
//     setRequestedDate(undefined);
//     setRequestedTime("07:00");
//     setPricePerAcre("");
//     setNotes("");
//   };

//   const handleSubmit = () => {
//     if (!farmerName || !farmerPhone || !activityName || !farmSize || !requestedDate || !pricePerAcre) {
//       toast.error("Please fill all required fields");
//       return;
//     }

//     const jobData = {
//       farmer_name: farmerName,
//       farmer_phone: farmerPhone,
//       farmer_village: farmerVillage,
//       activity_name: activityName,
//       farm_size_acres: parseFloat(farmSize),
//       location: location,
//       requested_date: format(requestedDate, "yyyy-MM-dd"),
//       requested_time: requestedTime,
//       farmer_price_per_acre: parseFloat(pricePerAcre),
//       notes: notes,
//     };

//     confirmJobMutation.mutate(jobData);
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>Confirm New Job</DialogTitle>
//         </DialogHeader>

//         <div className="space-y-4">
//           {/* Farmer Details */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label>Farmer Name *</Label>
//               <Input
//                 value={farmerName}
//                 onChange={(e) => setFarmerName(e.target.value)}
//                 placeholder="Enter farmer name"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label>Phone Number *</Label>
//               <Input
//                 value={farmerPhone}
//                 onChange={(e) => setFarmerPhone(e.target.value)}
//                 placeholder="+91-XXXXXXXXXX"
//               />
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label>Village *</Label>
//             <Input
//               value={farmerVillage}
//               onChange={(e) => setFarmerVillage(e.target.value)}
//               placeholder="Enter village name"
//             />
//           </div>

//           {/* Job Details */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label>Activity Type *</Label>
//               <Input
//                 value={activityName}
//                 onChange={(e) => setActivityName(e.target.value)}
//                 placeholder="e.g., Pruning, Spray, Tying"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label>Farm Size (acres) *</Label>
//               <Input
//                 type="number"
//                 step="0.1"
//                 value={farmSize}
//                 onChange={(e) => setFarmSize(e.target.value)}
//                 placeholder="0.0"
//               />
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label>Location/Farm Address *</Label>
//             <Input
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//               placeholder="Enter specific location or landmarks"
//             />
//           </div>

//           {/* Schedule */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label>Requested Date *</Label>
//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     className={cn(
//                       "w-full justify-start text-left font-normal",
//                       !requestedDate && "text-muted-foreground"
//                     )}
//                   >
//                     <CalendarIcon className="mr-2 h-4 w-4" />
//                     {requestedDate ? format(requestedDate, "PPP") : <span>Pick a date</span>}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0" align="start">
//                   <Calendar
//                     mode="single"
//                     selected={requestedDate}
//                     onSelect={setRequestedDate}
//                     disabled={(date) => date < new Date()}
//                     initialFocus
//                   />
//                 </PopoverContent>
//               </Popover>
//             </div>
//             <div className="space-y-2">
//               <Label>Preferred Time</Label>
//               <Input
//                 type="time"
//                 value={requestedTime}
//                 onChange={(e) => setRequestedTime(e.target.value)}
//               />
//             </div>
//           </div>

//           {/* Pricing */}
//           <div className="space-y-2">
//             <Label>Farmer's Price Per Acre (₹) *</Label>
//             <Input
//               type="number"
//               step="50"
//               value={pricePerAcre}
//               onChange={(e) => setPricePerAcre(e.target.value)}
//               placeholder="0"
//             />
//           </div>

//           {/* Notes */}
//           <div className="space-y-2">
//             <Label>Notes</Label>
//             <Textarea
//               value={notes}
//               onChange={(e) => setNotes(e.target.value)}
//               placeholder="Any special instructions, requirements, or notes..."
//               rows={3}
//             />
//           </div>

//           {/* Actions */}
//           <div className="flex gap-2 pt-4">
//             <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
//               Cancel
//             </Button>
//             <Button 
//               onClick={handleSubmit} 
//               disabled={confirmJobMutation.isPending}
//               className="flex-1"
//             >
//               {confirmJobMutation.isPending ? "Confirming..." : "Confirm Job"}
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }