import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddPlotDialogProps {
  farmerId: string;
}

export function AddPlotDialog({ farmerId }: AddPlotDialogProps) {
  const [open, setOpen] = useState(false);
  const [acres, setAcres] = useState("");
  const [variety, setVariety] = useState("");
  const [pruningDate, setPruningDate] = useState<Date>();
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const queryClient = useQueryClient();

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
    
    if (!pruningDate) {
      toast.error("Please select a pruning date");
      return;
    }

    if (selectedActivities.length === 0) {
      toast.error("Please select at least one activity");
      return;
    }

    // Insert plot first
    const { data: plot, error: plotError } = await supabase.from("plots").insert([{
      farmer_id: farmerId,
      acres: parseFloat(acres),
      variety,
      pruning_date: format(pruningDate, "yyyy-MM-dd"),
    }]).select().single();
    
    if (plotError) {
      toast.error("Failed to add plot");
      return;
    }

    // Insert selected activities for this plot
    const plotActivities = selectedActivities.map(activityId => ({
      plot_id: plot.id,
      activity_type_id: activityId
    }));

    const { error: activitiesError } = await supabase.from("plot_activities").insert(plotActivities);

    if (activitiesError) {
      toast.error("Failed to add activities");
      return;
    }

    toast.success("Plot and activities added successfully");
    queryClient.invalidateQueries({ queryKey: ["farmers"] });
    queryClient.invalidateQueries({ queryKey: ["activities"] });
    setOpen(false);
    setAcres("");
    setVariety("");
    setPruningDate(undefined);
    setSelectedActivities([]);
  };

  const toggleActivity = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-3 w-3" />
          Add Plot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Plot</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acres">Plot Size (Acres)</Label>
              <Input
                id="acres"
                type="number"
                step="0.1"
                min="0"
                value={acres}
                onChange={(e) => setAcres(e.target.value)}
                placeholder="e.g., 1.5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variety">Variety (Optional)</Label>
              <Input
                id="variety"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g., Thompson Seedless"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Pruning Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !pruningDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {pruningDate ? format(pruningDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                <Calendar
                  mode="single"
                  selected={pruningDate}
                  onSelect={setPruningDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Select Activities to Perform</Label>
            <ScrollArea className="h-[250px] rounded-md border p-4">
              <div className="space-y-3">
                {activityTypes.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={activity.id}
                      checked={selectedActivities.includes(activity.id)}
                      onCheckedChange={() => toggleActivity(activity.id)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={activity.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {activity.name}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Day {activity.days_after_pruning}
                        {activity.description && ` - ${activity.description}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Plot</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
