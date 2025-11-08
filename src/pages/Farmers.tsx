import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { AddFarmerDialog } from "@/components/farmers/AddFarmerDialog";
import { AddPlotDialog } from "@/components/farmers/AddPlotDialog";
import { ExportFarmerCalendar } from "@/components/farmers/ExportFarmerCalendar";
import EditFarmerDialog from "@/components/farmers/EditFarmerDialog";
import EditPlotDialog from "@/components/farmers/EditPlotDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Phone, MapPin, Calendar, Grape, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FarmerHistoryDialog } from "@/components/FarmerHistoryDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Farmers() {
  const queryClient = useQueryClient();
  const [editingFarmer, setEditingFarmer] = useState<any>(null);
  const [editingPlot, setEditingPlot] = useState<any>(null);
  const [deletingFarmerId, setDeletingFarmerId] = useState<string | null>(null);
  const [deletingPlotId, setDeletingPlotId] = useState<string | null>(null);
// Inside the Farmers component, add:
const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  const { data: farmers = [], isLoading } = useQuery({
    queryKey: ["farmers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("farmers").select("*, plots(*)").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allActivities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("scheduled_activities").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const deleteFarmerMutation = useMutation({
    mutationFn: async (farmerId: string) => {
      const { error } = await supabase.from("farmers").delete().eq("id", farmerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast.success("Farmer deleted successfully");
      setDeletingFarmerId(null);
    },
    onError: (error: any) => {
      toast.error("Failed to delete farmer: " + error.message);
    },
  });

  const deletePlotMutation = useMutation({
    mutationFn: async (plotId: string) => {
      const { error } = await supabase.from("plots").delete().eq("id", plotId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      toast.success("Plot deleted successfully");
      setDeletingPlotId(null);
    },
    onError: (error: any) => {
      toast.error("Failed to delete plot: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading farmers...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Farmers & Plots</h2>
            <p className="text-muted-foreground mt-1">Manage farmer information and their plots</p>
          </div>
          <AddFarmerDialog />
        </div>

        {farmers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground mb-4">No farmers added yet</p>
              <AddFarmerDialog />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {farmers.map((farmer) => {
              const farmerActivities = allActivities.filter(a => a.farmer_id === farmer.id);
              
              return (
                <Card key={farmer.id} className="shadow-soft">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: farmer.color || '#10b981' }}
                          />
                          <CardTitle className="text-lg">{farmer.name}</CardTitle>
                        </div>
                        {farmer.village && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {farmer.village}
                          </div>
                        )}
                        {farmer.contact && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {farmer.contact}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setEditingFarmer(farmer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setDeletingFarmerId(farmer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedFarmerId(farmer.id)}
                                  >
                                    View History
                                  </Button>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/5 mt-2 w-fit">
                      {farmer.plots?.length || 0} plots
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {farmer.plots && farmer.plots.length > 0 ? (
                      <div className="space-y-3">
                        {farmer.plots.map((plot: any) => (
                          <div key={plot.id} className="rounded-lg border border-border p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{plot.acres} acres</span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setEditingPlot(plot)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setDeletingPlotId(plot.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                                
                              </div>
                            </div>
                            {plot.variety && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Grape className="h-3 w-3" />
                                {plot.variety}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Pruned: {format(new Date(plot.pruning_date), "MMM d, yyyy")}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No plots added</p>
                    )}
                    <div className="flex gap-2">
                      <AddPlotDialog farmerId={farmer.id} />
                      {farmerActivities.length > 0 && (
                        <ExportFarmerCalendar 
                          farmerName={farmer.name} 
                          activities={farmerActivities}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {editingFarmer && (
        <EditFarmerDialog
          farmer={editingFarmer}
          open={!!editingFarmer}
          onOpenChange={(open) => !open && setEditingFarmer(null)}
        />
      )}

      {editingPlot && (
        <EditPlotDialog
          plot={editingPlot}
          open={!!editingPlot}
          onOpenChange={(open) => !open && setEditingPlot(null)}
        />
      )}
      <FarmerHistoryDialog
  farmerId={selectedFarmerId}
  open={!!selectedFarmerId}
  onOpenChange={(open) => !open && setSelectedFarmerId(null)}
/>

      <AlertDialog open={!!deletingFarmerId} onOpenChange={() => setDeletingFarmerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Farmer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this farmer? This will also delete all their plots and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingFarmerId && deleteFarmerMutation.mutate(deletingFarmerId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingPlotId} onOpenChange={() => setDeletingPlotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this plot? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingPlotId && deletePlotMutation.mutate(deletingPlotId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
