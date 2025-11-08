import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface AddLabourTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddLabourTeamDialog = ({ open, onOpenChange }: AddLabourTeamDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const [selectedActivities, setSelectedActivities] = useState<{ [key: string]: string }>({});
  const [availabilityPeriods, setAvailabilityPeriods] = useState<{ start: Date | undefined; end: Date | undefined }[]>([]);

  const { data: activityTypes } = useQuery({
    queryKey: ["activity-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_types").select("*");
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: team, error: teamError } = await supabase
        .from("labour_teams")
        .insert({
          number_of_labourers: parseInt(data.number_of_labourers),
          mukkadam_name: data.mukkadam_name,
          contact: data.contact,
          location: data.location,
          transport_situation: data.transport_situation,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Insert activity rates
      const rates = Object.entries(selectedActivities).map(([activityId, rate]) => ({
        labour_team_id: team.id,
        activity_type_id: activityId,
        rate: parseFloat(rate),
      }));

      if (rates.length > 0) {
        const { error: ratesError } = await supabase
          .from("team_activity_rates")
          .insert(rates);
        if (ratesError) throw ratesError;
      }

      // Insert availability periods
      const validPeriods = availabilityPeriods.filter(p => p.start && p.end);
      if (validPeriods.length > 0) {
        const { error: availError } = await supabase
          .from("team_availability")
          .insert(
            validPeriods.map(p => ({
              labour_team_id: team.id,
              start_date: format(p.start!, "yyyy-MM-dd"),
              end_date: format(p.end!, "yyyy-MM-dd"),
            }))
          );
        if (availError) throw availError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labour-teams"] });
      toast.success("Labour team added successfully");
      reset();
      setSelectedActivities({});
      setAvailabilityPeriods([]);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Failed to add team: " + error.message);
    },
  });

  const addAvailabilityPeriod = () => {
    setAvailabilityPeriods([...availabilityPeriods, { start: undefined, end: undefined }]);
  };

  const removeAvailabilityPeriod = (index: number) => {
    setAvailabilityPeriods(availabilityPeriods.filter((_, i) => i !== index));
  };

  const updateAvailabilityPeriod = (index: number, field: 'start' | 'end', date: Date | undefined) => {
    const updated = [...availabilityPeriods];
    updated[index][field] = date;
    setAvailabilityPeriods(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Labour Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mukkadam_name">Mukkadam Name *</Label>
              <Input id="mukkadam_name" {...register("mukkadam_name", { required: true })} />
            </div>
            <div>
              <Label htmlFor="number_of_labourers">Number of Labourers *</Label>
              <Input
                id="number_of_labourers"
                type="number"
                {...register("number_of_labourers", { required: true })}
              />
            </div>
            <div>
              <Label htmlFor="contact">Contact</Label>
              <Input id="contact" {...register("contact")} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register("location")} />
            </div>
          </div>

          <div>
            <Label htmlFor="transport_situation">Transport Situation</Label>
            <Textarea
              id="transport_situation"
              {...register("transport_situation")}
              placeholder="e.g., Bike, We need to organise, Pay for fuel, Truck pickup required"
            />
          </div>

          <div>
            <Label className="mb-2 block">Activities & Rates</Label>
            <div className="space-y-2 border rounded-md p-4">
              {activityTypes?.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4">
                  <Checkbox
                    checked={activity.id in selectedActivities}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedActivities({ ...selectedActivities, [activity.id]: "" });
                      } else {
                        const { [activity.id]: _, ...rest } = selectedActivities;
                        setSelectedActivities(rest);
                      }
                    }}
                  />
                  <Label className="flex-1">{activity.name}</Label>
                  {activity.id in selectedActivities && (
                    <Input
                      type="number"
                      placeholder="Rate per acre"
                      className="w-32"
                      value={selectedActivities[activity.id]}
                      onChange={(e) =>
                        setSelectedActivities({
                          ...selectedActivities,
                          [activity.id]: e.target.value,
                        })
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Availability Periods</Label>
              <Button type="button" variant="outline" size="sm" onClick={addAvailabilityPeriod}>
                <Plus className="h-4 w-4 mr-1" />
                Add Period
              </Button>
            </div>
            <div className="space-y-2">
              {availabilityPeriods.map((period, index) => (
                <div key={index} className="flex items-center gap-2 border rounded-md p-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {period.start ? format(period.start, "PP") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={period.start}
                        onSelect={(date) => updateAvailabilityPeriod(index, 'start', date)}
                      />
                    </PopoverContent>
                  </Popover>
                  <span>to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {period.end ? format(period.end, "PP") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={period.end}
                        onSelect={(date) => updateAvailabilityPeriod(index, 'end', date)}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeAvailabilityPeriod(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding..." : "Add Team"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLabourTeamDialog;
