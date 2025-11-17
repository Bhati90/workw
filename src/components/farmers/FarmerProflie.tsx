import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, 
  Phone, 
  Calendar as CalendarIcon, 
  Edit, 
  Plus, 
  Trash2,
  History,
  User,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Layout } from "../Layout";

interface Plot {
  id: string;
  acres: number;
  location: string;
  pruning_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Farmer {
  id: string;
  name: string;
  phone: string;
  village: string;
  plots: Plot[];
  total_acres: number;
  jobs_count: number;
  created_at: string;
  updated_at: string;
}

interface EditHistory {
  id: string;
  field_changed: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  changed_at: string;
  reason?: string;
}

export function FarmerProfile({ farmerId }: { farmerId: string }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPlotDialog, setShowPlotDialog] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [farmerData, setFarmerData] = useState({
    name: "",
    phone: "",
    village: ""
  });
  const [plotData, setPlotData] = useState({
    acres: "",
    location: "",
    pruning_date: undefined as Date | undefined,
    notes: ""
  });

  const queryClient = useQueryClient();

// Fetch farmer details
  const { data: farmer, isLoading } = useQuery({
    queryKey: ["farmer", farmerId],
    queryFn: async (): Promise<Farmer> => {
      const response = await fetch(`https://workcrop.onrender.com//api/farmers/${farmerId}/`);
      if (!response.ok) throw new Error("Failed to fetch farmer");
      return response.json();
    },
  });

  // Fetch edit history
  const { data: editHistory = [] } = useQuery({
    queryKey: ["farmer-history", farmerId],
    queryFn: async (): Promise<EditHistory[]> => {
      const response = await fetch(`https://workcrop.onrender.com//api/farmers/${farmerId}/edit_history/`);
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    },
  });

  // Update farmer mutation
  const updateFarmerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`https://workcrop.onrender.com//api/farmers/${farmerId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update farmer");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Farmer updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["farmer", farmerId] });
      queryClient.invalidateQueries({ queryKey: ["farmer-history", farmerId] });
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast.error("Failed to update farmer: " + error.message);
    },
  });

  // Add/Update plot mutation
  const savePlotMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingPlot
        ? `https://workcrop.onrender.com//api/farmers/${farmerId}/plots/${editingPlot.id}/`
        : `https://workcrop.onrender.com//api/farmers/${farmerId}/plots/`;
      
      const response = await fetch(url, {
        method: editingPlot ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save plot");
      return response.json();
    },
    onSuccess: () => {
      toast.success(editingPlot ? "Plot updated!" : "Plot added!");
      queryClient.invalidateQueries({ queryKey: ["farmer", farmerId] });
      queryClient.invalidateQueries({ queryKey: ["farmer-history", farmerId] });
      setShowPlotDialog(false);
      setEditingPlot(null);
      resetPlotForm();
    },
    onError: (error) => {
      toast.error("Failed to save plot: " + error.message);
    },
  });

  // Delete plot mutation
  const deletePlotMutation = useMutation({
    mutationFn: async (plotId: string) => {
      const response = await fetch(
        `https://workcrop.onrender.com//api/farmers/${farmerId}/plots/${plotId}/`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete plot");
    },
    onSuccess: () => {
      toast.success("Plot deleted!");
      queryClient.invalidateQueries({ queryKey: ["farmer", farmerId] });
    },
    onError: (error) => {
      toast.error("Failed to delete plot: " + error.message);
    },
  });

  const resetPlotForm = () => {
    setPlotData({
      acres: "",
      location: "",
      pruning_date: undefined,
      notes: ""
    });
  };

  const handleEditFarmer = () => {
    if (farmer) {
      setFarmerData({
        name: farmer.name,
        phone: farmer.phone,
        village: farmer.village
      });
      setShowEditDialog(true);
    }
  };

  const handleSaveFarmer = () => {
    updateFarmerMutation.mutate(farmerData);
  };

  const handleEditPlot = (plot: Plot) => {
    setEditingPlot(plot);
    setPlotData({
      acres: plot.acres.toString(),
      location: plot.location,
      pruning_date: new Date(plot.pruning_date),
      notes: plot.notes || ""
    });
    setShowPlotDialog(true);
  };

  const handleAddPlot = () => {
    setEditingPlot(null);
    resetPlotForm();
    setShowPlotDialog(true);
  };

  const handleSavePlot = () => {
    if (!plotData.acres || !plotData.pruning_date) {
      toast.error("Please fill required fields");
      return;
    }

    savePlotMutation.mutate({
      acres: parseFloat(plotData.acres),
      location: plotData.location || farmer?.village || "",
      pruning_date: format(plotData.pruning_date, "yyyy-MM-dd"),
      notes: plotData.notes
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading farmer profile...</div>;
  }

  if (!farmer) {
    return <div className="flex justify-center py-8">Farmer not found</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{farmer.name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {farmer.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {farmer.village}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Button onClick={handleEditFarmer}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Farmer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Plots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{farmer.plots.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Area
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{farmer.total_acres} acres</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{farmer.jobs_count}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="plots" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plots">Plots & Activities</TabsTrigger>
            <TabsTrigger value="history">Edit History</TabsTrigger>
          </TabsList>

          {/* Plots Tab */}
          <TabsContent value="plots" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Plots</h2>
              <Button onClick={handleAddPlot}>
                <Plus className="h-4 w-4 mr-2" />
                Add Plot
              </Button>
            </div>

            <div className="space-y-4">
              {farmer.plots.map((plot) => (
                <Card key={plot.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          {plot.acres} acres
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plot.location}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPlot(plot)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this plot?")) {
                              deletePlotMutation.mutate(plot.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Pruned:</span>
                        <p className="font-semibold flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(plot.pruning_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      {plot.notes && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="text-sm">{plot.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {farmer.plots.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No plots added yet</p>
                    <Button variant="link" onClick={handleAddPlot} className="mt-2">
                      Add your first plot
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Edit History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {editHistory.map((entry) => (
                      <div key={entry.id} className="flex gap-4 pb-4 border-b last:border-0">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{entry.field_changed}</p>
                              <p className="text-sm text-muted-foreground">
                                <span className="line-through">{entry.old_value}</span>
                                {" → "}
                                <span className="text-green-600">{entry.new_value}</span>
                              </p>
                              {entry.reason && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Reason: {entry.reason}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline">
                              {format(new Date(entry.changed_at), "MMM d, h:mm a")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            By {entry.changed_by}
                          </p>
                        </div>
                      </div>
                    ))}

                    {editHistory.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No edit history available
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Farmer Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Farmer Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Farmer Name *</Label>
                <Input
                  value={farmerData.name}
                  onChange={(e) => setFarmerData({ ...farmerData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  value={farmerData.phone}
                  onChange={(e) => setFarmerData({ ...farmerData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Village *</Label>
                <Input
                  value={farmerData.village}
                  onChange={(e) => setFarmerData({ ...farmerData, village: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveFarmer} disabled={updateFarmerMutation.isPending} className="flex-1">
                  {updateFarmerMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Plot Dialog */}
        <Dialog open={showPlotDialog} onOpenChange={setShowPlotDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlot ? "Edit Plot" : "Add New Plot"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Acres *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={plotData.acres}
                  onChange={(e) => setPlotData({ ...plotData, acres: e.target.value })}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={plotData.location}
                  onChange={(e) => setPlotData({ ...plotData, location: e.target.value })}
                  placeholder="Plot location or landmarks"
                />
              </div>
              <div className="space-y-2">
                <Label>Pruning Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !plotData.pruning_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {plotData.pruning_date ? format(plotData.pruning_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={plotData.pruning_date}
                      onSelect={(date) => setPlotData({ ...plotData, pruning_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={plotData.notes}
                  onChange={(e) => setPlotData({ ...plotData, notes: e.target.value })}
                  placeholder="Any special notes about this plot..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPlotDialog(false);
                    setEditingPlot(null);
                    resetPlotForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleSavePlot} disabled={savePlotMutation.isPending} className="flex-1">
                  {savePlotMutation.isPending ? "Saving..." : editingPlot ? "Update Plot" : "Add Plot"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}