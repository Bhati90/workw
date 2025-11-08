import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AddBookingDialog() {
  const [open, setOpen] = useState(false);
  const [farmerId, setFarmerId] = useState("");
  const [activityTypeId, setActivityTypeId] = useState("");
  const [requestedDate, setRequestedDate] = useState<Date>();
  const [areaAcres, setAreaAcres] = useState("");
  const [quotedPrice, setQuotedPrice] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceDate, setAdvanceDate] = useState<Date>();
  const [callNotes, setCallNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: farmers = [] } = useQuery({
    queryKey: ["farmers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("farmers").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: activityTypes = [] } = useQuery({
    queryKey: ["activityTypes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_types").select("*").order("days_after_pruning");
      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestedDate) {
      toast.error("Please select a date");
      return;
    }

    const { error } = await supabase.from("bookings").insert([{
      farmer_id: farmerId,
      activity_type_id: activityTypeId,
      requested_date: format(requestedDate, "yyyy-MM-dd"),
      area_acres: parseFloat(areaAcres),
      quoted_price: quotedPrice ? parseFloat(quotedPrice) : null,
      advance_amount: advanceAmount ? parseFloat(advanceAmount) : 0,
      advance_date: advanceDate ? format(advanceDate, "yyyy-MM-dd") : null,
      call_notes: callNotes || null,
      status: 'pending'
    }]);

    if (error) {
      toast.error("Failed to add booking: " + error.message);
      return;
    }

    toast.success("Booking added successfully");
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFarmerId("");
    setActivityTypeId("");
    setRequestedDate(undefined);
    setAreaAcres("");
    setQuotedPrice("");
    setAdvanceAmount("");
    setAdvanceDate(undefined);
    setCallNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="farmer">Farmer *</Label>
              <Select value={farmerId} onValueChange={setFarmerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select farmer..." />
                </SelectTrigger>
                <SelectContent>
                  {farmers.map((farmer) => (
                    <SelectItem key={farmer.id} value={farmer.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: farmer.color || '#10b981' }} />
                        {farmer.name} {farmer.village && `(${farmer.village})`}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity">Activity *</Label>
              <Select value={activityTypeId} onValueChange={setActivityTypeId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity..." />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.name} (Day {activity.days_after_pruning})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Requested Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !requestedDate && "text-muted-foreground")}
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
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="acres">Area (Acres) *</Label>
              <Input
                id="acres"
                type="number"
                step="0.1"
                min="0"
                value={areaAcres}
                onChange={(e) => setAreaAcres(e.target.value)}
                placeholder="e.g., 5.5"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Quoted Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value)}
                placeholder="e.g., 19250"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="advance">Advance Amount (₹)</Label>
              <Input
                id="advance"
                type="number"
                step="0.01"
                min="0"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="e.g., 5000"
              />
            </div>
          </div>

          {advanceAmount && parseFloat(advanceAmount) > 0 && (
            <div className="space-y-2">
              <Label>Advance Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !advanceDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {advanceDate ? format(advanceDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={advanceDate}
                    onSelect={setAdvanceDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Call Notes</Label>
            <Textarea
              id="notes"
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="Customer requirements, preferences, location details, etc."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Booking</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}