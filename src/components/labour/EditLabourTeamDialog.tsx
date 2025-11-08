import { useState, useEffect } from "react";
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

interface EditLabourTeamDialogProps {
  team: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditLabourTeamDialog = ({ team, open, onOpenChange }: EditLabourTeamDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const [selectedActivities, setSelectedActivities] = useState<{ [key: string]: string }>({});

  const { data: activityTypes } = useQuery({
    queryKey: ["activity-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_types").select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (team) {
      reset({
        mukkadam_name: team.mukkadam_name,
        number_of_labourers: team.number_of_labourers,
        contact: team.contact,
        location: team.location,
        transport_situation: team.transport_situation,
      });

      const rates: { [key: string]: string } = {};
      team.team_activity_rates?.forEach((rate: any) => {
        rates[rate.activity_type_id] = rate.rate.toString();
      });
      setSelectedActivities(rates);
    }
  }, [team, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { error: teamError } = await supabase
        .from("labour_teams")
        .update({
          number_of_labourers: parseInt(data.number_of_labourers),
          mukkadam_name: data.mukkadam_name,
          contact: data.contact,
          location: data.location,
          transport_situation: data.transport_situation,
        })
        .eq("id", team.id);

      if (teamError) throw teamError;

      // Delete existing rates and insert new ones
      await supabase.from("team_activity_rates").delete().eq("labour_team_id", team.id);

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labour-teams"] });
      toast.success("Labour team updated successfully");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Failed to update team: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Labour Team</DialogTitle>
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Updating..." : "Update Team"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLabourTeamDialog;
