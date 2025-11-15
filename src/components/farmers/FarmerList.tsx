import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Calendar,
  Search,
  Download,
  User
} from "lucide-react";
import { toast } from "sonner";
import { Layout } from "../Layout";
import { format } from "date-fns";

interface Plot {
  id: string;
  acres: number;
  location?: string;
  activity_name?: string;
  pruning_date: string;
}

interface Farmer {
  id: string;
  name: string;
  phone: string;
  village: string;
  plots: Plot[];
  total_acres: number;
  jobs_count: number;
}

export function FarmersList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [showAddPlotDialog, setShowAddPlotDialog] = useState(false);
  const [currentFarmerId, setCurrentFarmerId] = useState<string>("");
  const [showEditPlotDialog, setShowEditPlotDialog] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  
  const [farmerData, setFarmerData] = useState({
    name: "",
    phone: "",
    village: ""
  });

  const [plotData, setPlotData] = useState({
    acres: "",
    location: "",
    activity_name: "",
    pruning_date: ""
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch all farmers
  const { data: farmers = [], isLoading } = useQuery({
    queryKey: ["farmers"],
    // queryFn: async (): Promise<Farmer[]> => {
    //   const response = await fetch("http://127.0.0.1:8000/api/farmers/");
    //   if (!response.ok) throw new Error("Failed to fetch farmers");
    //   return response.json();
    queryFn: async (): Promise<Farmer[]> => {
  const response = await fetch("http://127.0.0.1:8000/api/farmers/");
  const data = await response.json();
  return data.results;  // ← FIX


}

    ,
  });

  // Filter farmers based on search
  const list = farmers ?? [];   // Safeguard

const filteredFarmers = useMemo(() => {
  return list.filter((farmer) =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.phone.includes(searchTerm) ||
    farmer.village.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [list, searchTerm]);


  // Add farmer mutation
  const addFarmerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("http://127.0.0.1:8000/api/farmers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add farmer");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Farmer added successfully!");
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      setShowAddDialog(false);
      resetFarmerForm();
    },
    onError: (error) => {
      toast.error("Failed to add farmer: " + error.message);
    },
  });

  // Update farmer mutation
  const updateFarmerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await fetch(`http://127.0.0.1:8000/api/farmers/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update farmer");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Farmer updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      setShowEditDialog(false);
      setEditingFarmer(null);
    },
    onError: (error) => {
      toast.error("Failed to update farmer: " + error.message);
    },
  });

  // Delete farmer mutation
  const deleteFarmerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`http://127.0.0.1:8000/api/farmers/${id}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete farmer");
    },
    onSuccess: () => {
      toast.success("Farmer deleted!");
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
    },
    onError: (error) => {
      toast.error("Failed to delete farmer: " + error.message);
    },
  });

  // Add plot mutation
  const addPlotMutation = useMutation({
    mutationFn: async ({ farmerId, data }: { farmerId: string, data: any }) => {
      const response = await fetch(`http://127.0.0.1:8000/api/farmers/${farmerId}/plots/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add plot");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Plot added!");
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      setShowAddPlotDialog(false);
      resetPlotForm();
    },
    onError: (error) => {
      toast.error("Failed to add plot: " + error.message);
    },
  });

  // Edit plot mutation
  const editPlotMutation = useMutation({
    mutationFn: async ({ farmerId, plotId, data }: { farmerId: string, plotId: string, data: any }) => {
      const response = await fetch(`http://127.0.0.1:8000/api/farmers/${farmerId}/plots/${plotId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update plot");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Plot updated!");
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      setShowEditPlotDialog(false);
      setEditingPlot(null);
      resetPlotForm();
    },
  });

  // Delete plot mutation
  const deletePlotMutation = useMutation({
    mutationFn: async ({ farmerId, plotId }: { farmerId: string, plotId: string }) => {
      const response = await fetch(`http://127.0.0.1:8000/api/farmers/${farmerId}/plots/${plotId}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete plot");
    },
    onSuccess: () => {
      toast.success("Plot deleted!");
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
    },
  });

  const resetFarmerForm = () => {
    setFarmerData({ name: "", phone: "", village: "" });
  };

  const resetPlotForm = () => {
    setPlotData({ acres: "", location: "", activity_name: "", pruning_date: "" });
  };

  const handleEditFarmer = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setFarmerData({
      name: farmer.name,
      phone: farmer.phone,
      village: farmer.village
    });
    setShowEditDialog(true);
  };

  const handleAddPlot = (farmerId: string) => {
    setCurrentFarmerId(farmerId);
    setShowAddPlotDialog(true);
  };

  const handleEditPlot = (farmerId: string, plot: Plot) => {
    setCurrentFarmerId(farmerId);
    setEditingPlot(plot);
    setPlotData({
      acres: plot.acres.toString(),
      location: plot.location || "",
      activity_name: plot.activity_name || "",
      pruning_date: plot.pruning_date
    });
    setShowEditPlotDialog(true);
  };

  const handleSaveFarmer = () => {
    if (!farmerData.name || !farmerData.phone) {
      toast.error("Name and phone are required");
      return;
    }
    addFarmerMutation.mutate(farmerData);
  };

  const handleUpdateFarmer = () => {
    if (!editingFarmer) return;
    updateFarmerMutation.mutate({
      id: editingFarmer.id,
      data: farmerData
    });
  };

  const handleSavePlot = () => {
    if (!plotData.acres || !plotData.pruning_date) {
      toast.error("Acres and pruning date are required");
      return;
    }

    addPlotMutation.mutate({
      farmerId: currentFarmerId,
      data: {
        acres: parseFloat(plotData.acres),
        location: plotData.location,
        activity_name: plotData.activity_name,
        pruning_date: plotData.pruning_date
      }
    });
  };

  const handleUpdatePlot = () => {
    if (!editingPlot) return;

    editPlotMutation.mutate({
      farmerId: currentFarmerId,
      plotId: editingPlot.id,
      data: {
        acres: parseFloat(plotData.acres),
        location: plotData.location,
        activity_name: plotData.activity_name,
        pruning_date: plotData.pruning_date
      }
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading farmers...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Farmers & Plots</h1>
            <p className="text-muted-foreground">Manage farmer information and their plots</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Farmer
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search farmers by name, phone, or village..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Farmers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFarmers.map((farmer) => (
            <Card 
              key={farmer.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/farmers/${farmer.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{farmer.name}</h3>
                      <Badge variant="outline">{farmer.plots.length} plots</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditFarmer(farmer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this farmer?")) {
                          deleteFarmerMutation.mutate(farmer.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1 mt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {farmer.village}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {farmer.phone}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Plots */}
                {farmer.plots.map((plot) => (
                  <div 
                    key={plot.id} 
                    className="p-3 bg-secondary/30 rounded flex justify-between items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="font-semibold">{plot.acres} acres</span>
                      </div>
                      {plot.activity_name && (
                        <div className="text-xs text-muted-foreground">
                          {plot.activity_name}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Pruned: {format(new Date(plot.pruning_date), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPlot(farmer.id, plot)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this plot?")) {
                            deletePlotMutation.mutate({ farmerId: farmer.id, plotId: plot.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add Plot Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddPlot(farmer.id);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plot
                </Button>

                {/* Export Calendar */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Export calendar logic
                    toast.info("Calendar export coming soon!");
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Calendar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFarmers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No farmers found</p>
              <Button variant="link" onClick={() => setShowAddDialog(true)}>
                Add your first farmer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Farmer Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Farmer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Farmer Name *</Label>
                <Input
                  value={farmerData.name}
                  onChange={(e) => setFarmerData({ ...farmerData, name: e.target.value })}
                  placeholder="Enter farmer name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  value={farmerData.phone}
                  onChange={(e) => setFarmerData({ ...farmerData, phone: e.target.value })}
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Village</Label>
                <Input
                  value={farmerData.village}
                  onChange={(e) => setFarmerData({ ...farmerData, village: e.target.value })}
                  placeholder="Enter village name"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveFarmer} disabled={addFarmerMutation.isPending} className="flex-1">
                  {addFarmerMutation.isPending ? "Adding..." : "Add Farmer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Farmer Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Farmer</DialogTitle>
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
                <Label>Village</Label>
                <Input
                  value={farmerData.village}
                  onChange={(e) => setFarmerData({ ...farmerData, village: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUpdateFarmer} disabled={updateFarmerMutation.isPending} className="flex-1">
                  {updateFarmerMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Plot Dialog */}
        <Dialog open={showAddPlotDialog} onOpenChange={setShowAddPlotDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Plot</DialogTitle>
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
                  placeholder="Plot location"
                />
              </div>
              <div className="space-y-2">
                <Label>Activity Name</Label>
                <Input
                  value={plotData.activity_name}
                  onChange={(e) => setPlotData({ ...plotData, activity_name: e.target.value })}
                  placeholder="e.g., SSN, Anushka"
                />
              </div>
              <div className="space-y-2">
                <Label>Pruning Date *</Label>
                <Input
                  type="date"
                  value={plotData.pruning_date}
                  onChange={(e) => setPlotData({ ...plotData, pruning_date: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddPlotDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSavePlot} disabled={addPlotMutation.isPending} className="flex-1">
                  {addPlotMutation.isPending ? "Adding..." : "Add Plot"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Plot Dialog */}
        <Dialog open={showEditPlotDialog} onOpenChange={setShowEditPlotDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Plot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Acres *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={plotData.acres}
                  onChange={(e) => setPlotData({ ...plotData, acres: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={plotData.location}
                  onChange={(e) => setPlotData({ ...plotData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Activity Name</Label>
                <Input
                  value={plotData.activity_name}
                  onChange={(e) => setPlotData({ ...plotData, activity_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Pruning Date *</Label>
                <Input
                  type="date"
                  value={plotData.pruning_date}
                  onChange={(e) => setPlotData({ ...plotData, pruning_date: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditPlotDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUpdatePlot} disabled={editPlotMutation.isPending} className="flex-1">
                  {editPlotMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}