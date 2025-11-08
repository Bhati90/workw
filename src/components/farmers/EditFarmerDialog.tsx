import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EditFarmerDialogProps {
  farmer: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditFarmerDialog = ({ farmer, open, onOpenChange }: EditFarmerDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const colorValue = watch("color");

  useEffect(() => {
    if (farmer) {
      reset({
        name: farmer.name,
        village: farmer.village,
        contact: farmer.contact,
        color: farmer.color || "#10b981",
      });
    }
  }, [farmer, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("farmers")
        .update({
          name: data.name,
          village: data.village,
          contact: data.contact,
          color: data.color,
        })
        .eq("id", farmer.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast.success("Farmer updated successfully");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Failed to update farmer: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Farmer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <Label htmlFor="name">Farmer Name *</Label>
            <Input id="name" {...register("name", { required: true })} />
          </div>
          <div>
            <Label htmlFor="village">Village</Label>
            <Input id="village" {...register("village")} />
          </div>
          <div>
            <Label htmlFor="contact">Contact</Label>
            <Input id="contact" {...register("contact")} />
          </div>
          <div>
            <Label htmlFor="color">Calendar Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                {...register("color")}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={colorValue}
                onChange={(e) => setValue("color", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Updating..." : "Update Farmer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFarmerDialog;
