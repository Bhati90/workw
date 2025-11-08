import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface EditPlotDialogProps {
  plot: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditPlotDialog = ({ plot, open, onOpenChange }: EditPlotDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const [pruningDate, setPruningDate] = useState<Date>();
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  const { data: activityTypes } = useQuery({
    queryKey: ["activity-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_types").select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (plot) {
      reset({
        acres: plot.acres,
        variety: plot.variety,
      });
      setPruningDate(new Date(plot.pruning_date));

      // Fetch existing plot activities
      const fetchPlotActivities = async () => {
        const { data } = await supabase
          .from("plot_activities")
          .select("activity_type_id")
          .eq("plot_id", plot.id);
        if (data) {
          setSelectedActivities(data.map((pa: any) => pa.activity_type_id));
        }
      };
      fetchPlotActivities();
    }
  }, [plot, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { error: plotError } = await supabase
        .from("plots")
        .update({
          acres: parseFloat(data.acres),
          variety: data.variety,
          pruning_date: format(pruningDate!, "yyyy-MM-dd"),
        })
        .eq("id", plot.id);

      if (plotError) throw plotError;

      // Delete existing plot activities and insert new ones
      await supabase.from("plot_activities").delete().eq("plot_id", plot.id);

      if (selectedActivities.length > 0) {
        const { error: activitiesError } = await supabase.from("plot_activities").insert(
          selectedActivities.map((activityId) => ({
            plot_id: plot.id,
            activity_type_id: activityId,
          }))
        );
        if (activitiesError) throw activitiesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast.success("Plot updated successfully");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Failed to update plot: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Plot</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <Label htmlFor="acres">Acres *</Label>
            <Input
              id="acres"
              type="number"
              step="0.01"
              {...register("acres", { required: true })}
            />
          </div>
          <div>
            <Label htmlFor="variety">Variety</Label>
            <Input id="variety" {...register("variety")} />
          </div>
          <div>
            <Label>Pruning Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {pruningDate ? format(pruningDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={pruningDate} onSelect={setPruningDate} />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="mb-2 block">Activities for this plot</Label>
            <div className="space-y-2 border rounded-md p-4">
              {activityTypes?.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={activity.id}
                    checked={selectedActivities.includes(activity.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedActivities([...selectedActivities, activity.id]);
                      } else {
                        setSelectedActivities(
                          selectedActivities.filter((id) => id !== activity.id)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={activity.id} className="cursor-pointer">
                    {activity.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Updating..." : "Update Plot"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlotDialog;
