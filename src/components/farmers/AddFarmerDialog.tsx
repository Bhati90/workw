import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FARMER_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16"
];

export function AddFarmerDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [village, setVillage] = useState("");
  const [selectedColor, setSelectedColor] = useState(FARMER_COLORS[0]);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("farmers").insert([{ 
      name, 
      contact, 
      village,
      color: selectedColor 
    }]);

    if (error) {
      toast.error("Failed to add farmer");
      return;
    }

    toast.success("Farmer added successfully");
    queryClient.invalidateQueries({ queryKey: ["farmers"] });
    setOpen(false);
    setName("");
    setContact("");
    setVillage("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Farmer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Farmer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Farmer Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter farmer name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contact (Optional)</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone or email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="village">Village (Optional)</Label>
            <Input
              id="village"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="e.g., Kikuyu"
            />
          </div>
          <div className="space-y-2">
            <Label>Farmer Color</Label>
            <div className="flex flex-wrap gap-2">
              {FARMER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{ 
                    backgroundColor: color,
                    borderColor: selectedColor === color ? "#000" : "transparent"
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Farmer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
