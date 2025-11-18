import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus,
 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Calendar,
  Search,
  Download,
  User,
  Leaf,
  Sprout
} from "lucide-react";

import { toast } from "sonner";
import { Layout } from "../Layout";
import { format } from "date-fns";


// ✅ ADD these new interfaces
interface Crop {
  id: string;
  name: string;
  description: string;
}

interface CropVariety {
  id: string;
  crop: string;
  crop_name: string;
  name: string;
}

interface Activity {
  id: string;
  name: string;
  description: string;
  days_after_pruning: number;
  crop?: string;
}

// ✅ UPDATE Plot interface
interface Plot {
  id: string;
  acres: number;
  location?: string;
  crop?: string;  // ✅ ADD
  crop_name?: string;  // ✅ ADD
  crop_variety?: string;  // ✅ ADD
  crop_variety_name?: string;  // ✅ ADD
  activity?: string;  // ✅ ADD (activity ID)
  activity_name?: string;
  pruning_date: string;
  calculated_activity_date?: string;  // ✅ ADD
  days_until_activity?: number;  // ✅ ADD
  activity_details?: {  // ✅ ADD
    id: string;
    name: string;
    days_after_pruning: number;
  };
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
    crop: "",
    crop_variety: "",
    activity: "",
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


  // ✅ ADD: Fetch crops
const { data: crops = [] } = useQuery({
  queryKey: ["crops"],
  queryFn: async (): Promise<Crop[]> => {
    const response = await fetch("http://127.0.0.1:8000/api/crops/");
    if (!response.ok) throw new Error("Failed to fetch crops");
    const data = await response.json();
    return data.results || data;
  },
});

// ✅ ADD: Fetch crop varieties (filtered by selected crop)
const { data: cropVarieties = [] } = useQuery({
  queryKey: ["crop-varieties", plotData.crop],
  queryFn: async (): Promise<CropVariety[]> => {
    if (!plotData.crop) return [];
    const response = await fetch(`http://127.0.0.1:8000/api/crop-varieties/?crop=${plotData.crop}`);
    if (!response.ok) throw new Error("Failed to fetch varieties");
    const data = await response.json();
    return data.results || data;
  },
  enabled: !!plotData.crop,
});

// ✅ ADD: Fetch activities (filtered by crop)
const { data: activities = [] } = useQuery({
  queryKey: ["activities", plotData.crop],
  queryFn: async (): Promise<Activity[]> => {
    let url = "http://127.0.0.1:8000/api/activities/";
    if (plotData.crop) {
      url += `?crop=${plotData.crop}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch activities");
    const data = await response.json();
    return data.results || data;
  },
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
    setPlotData({ acres: "", location: "", activity: "", pruning_date: "" , crop: "", crop_variety: ""});
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
    crop: plot.crop || "",  // ✅ ADD
    crop_variety: plot.crop_variety || "",  // ✅ ADD
    activity: plot.activity || "",  // ✅ UPDATE
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
  if (!plotData.acres || !plotData.pruning_date || !plotData.crop || !plotData.activity) {  // ✅ ADD crop & activity
    toast.error("Acres, crop, activity, and pruning date are required");
    return;
  }

  addPlotMutation.mutate({
    farmerId: currentFarmerId,
    data: {
      acres: parseFloat(plotData.acres),
      location: plotData.location,
      crop: plotData.crop,  // ✅ ADD
      crop_variety: plotData.crop_variety || null,  // ✅ ADD
      activity: plotData.activity,  // ✅ UPDATE (send ID, not name)
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
      crop: plotData.crop,  // ✅ ADD
      crop_variety: plotData.crop_variety || null,  // ✅ ADD
      activity: plotData.activity,  // ✅ UPDATE
      pruning_date: plotData.pruning_date
    }
  });
};



  const generateICSCalendar = (farmer: Farmer) => {
  const formatDateForICS = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // For all-day events, use YYYYMMDD format
    return date.toISOString().split('T')[0].replace(/-/g, '');
  };

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WorkCrop//Farmer Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${farmer.name} - Farm Activities`,
    'X-WR-TIMEZONE:Asia/Kolkata',
    'X-WR-CALDESC:Farm plot activities and pruning dates'
  ];

  farmer.plots.forEach((plot, index) => {
    const uid = `${farmer.id}-${plot.id}-${Date.now()}@workcrop.com`;
    const created = formatDateForICS(new Date().toISOString());
    const eventDate = formatDate(plot.pruning_date);
    
    // Calculate one day after for DTEND (required for all-day events)
    const endDate = new Date(plot.pruning_date);
    endDate.setDate(endDate.getDate() + 1);
    const eventEndDate = formatDate(endDate.toISOString());

    const summary = `${plot.activity_name || 'Farm Activity'} - ${plot.acres} acres`;
    const description = [
      `Farmer: ${farmer.name}`,
      `Phone: ${farmer.phone}`,
      `Village: ${farmer.village}`,
      `Plot Size: ${plot.acres} acres`,
      plot.location ? `Location: ${plot.location}` : '',
      plot.activity_name ? `Activity: ${plot.activity_name}` : '',
      `Pruning Date: ${format(new Date(plot.pruning_date), 'MMMM d, yyyy')}`
    ].filter(Boolean).join('\\n');

    const location = plot.location 
      ? `${plot.location}, ${farmer.village}` 
      : farmer.village;

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${created}`,
      `DTSTART;VALUE=DATE:${eventDate}`,
      `DTEND;VALUE=DATE:${eventEndDate}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${summary}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');

  return icsContent.join('\r\n');
};

// Add this function to download the ICS file
const downloadCalendar = (farmer: Farmer) => {
  try {
    const icsContent = generateICSCalendar(farmer);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Clean filename
    const fileName = `${farmer.name.replace(/[^a-z0-9]/gi, '_')}_farm_calendar.ics`;
    link.download = fileName;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Calendar exported for ${farmer.name}!`, {
      description: 'Import the .ics file into your calendar app'
    });
  } catch (error) {
    toast.error('Failed to export calendar');
    console.error('Calendar export error:', error);
  }
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
  <div key={plot.id} className="p-3 bg-secondary/30 rounded space-y-2">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3" />
          <span className="font-semibold">{plot.acres} acres</span>
        </div>
        
        {/* ✅ ADD Crop info */}
        {plot.crop_name && (
          <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
            <Leaf className="h-3 w-3" />
            {plot.crop_name}
            {plot.crop_variety_name && ` - ${plot.crop_variety_name}`}
          </div>
        )}
        
        {/* ✅ UPDATE Activity display */}
        {plot.activity_details && (
          <div className="flex items-center gap-1 text-xs font-medium text-green-600 mt-1">
            <Sprout className="h-3 w-3" />
            {plot.activity_details.name}
          </div>
        )}
        
        {plot.location && (
          <div className="text-xs text-muted-foreground">
            📍 {plot.location}
          </div>
        )}
      </div>
      
      {/* Edit/Delete buttons */}
    </div>

    {/* ✅ ADD Date info */}
    <div className="space-y-1 border-t pt-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span className="font-medium">Pruned:</span>
        <span>{format(new Date(plot.pruning_date), "MMM d, yyyy")}</span>
      </div>
      
      {plot.calculated_activity_date && (
        <div className="flex items-center gap-1 text-xs text-orange-600">
          <Calendar className="h-3 w-3" />
          <span className="font-medium">Activity:</span>
          <span>{format(new Date(plot.calculated_activity_date), "MMM d, yyyy")}</span>
          {plot.days_until_activity !== undefined && (
            <Badge variant="outline" className="ml-1 text-xs">
              {plot.days_until_activity > 0 ? `in ${plot.days_until_activity}d` : 
               plot.days_until_activity === 0 ? 'Today!' : 
               `${Math.abs(plot.days_until_activity)}d overdue`}
            </Badge>
          )}
        </div>
      )}
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

                <Button 
  variant="outline" 
  size="sm" 
  className="w-full"
  onClick={(e) => {
    e.stopPropagation();
    if (farmer.plots.length === 0) {
      toast.error('No plots to export', {
        description: 'Add at least one plot before exporting calendar'
      });
      return;
    }
    downloadCalendar(farmer);
  }}
  disabled={farmer.plots.length === 0}
>
  <Download className="h-4 w-4 mr-2" />
  Export Calendar {farmer.plots.length > 0 && `(${farmer.plots.length})`}
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
                  <Label>Crop *</Label>
                  <Select 
                    value={plotData.crop} 
                    onValueChange={(value) => setPlotData({ 
                      ...plotData, 
                      crop: value,
                      crop_variety: "",  // Reset variety when crop changes
                      activity: ""  // Reset activity when crop changes
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a crop" />
                    </SelectTrigger>
                    <SelectContent>
                      {crops.map((crop) => (
                        <SelectItem key={crop.id} value={crop.id}>
                          {crop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ✅ ADD Crop Variety Dropdown */}
                <div className="space-y-2">
                  <Label>Crop Variety (Optional)</Label>
                  <Select 
                    value={plotData.crop_variety} 
                    onValueChange={(value) => setPlotData({ ...plotData, crop_variety: value })}
                    disabled={!plotData.crop}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select variety" />
                    </SelectTrigger>
                    <SelectContent>
                      {cropVarieties.map((variety) => (
                        <SelectItem key={variety.id} value={variety.id}>
                          {variety.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ✅ REPLACE Activity Name input with Activity Dropdown */}
                <div className="space-y-2">
                  <Label>Activity *</Label>
                  <Select 
                    value={plotData.activity} 
                    onValueChange={(value) => setPlotData({ ...plotData, activity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {activities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          {activity.name} (perform {activity.days_after_pruning} days after pruning)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              <div className="space-y-2">
                <Label>Pruning Date *</Label>
                <Input
                  type="date"
                  value={plotData.pruning_date}
                  onChange={(e) => setPlotData({ ...plotData, pruning_date: e.target.value })}
                />
              </div>
              {plotData.activity && plotData.pruning_date && activities.find(a => a.id === plotData.activity) && (
                  <p className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                    ℹ️ Activity will be performed on:{" "}
                    <span className="font-medium text-blue-600">
                      {format(
                        new Date(
                          new Date(plotData.pruning_date).getTime() + 
                          (activities.find(a => a.id === plotData.activity)?.days_after_pruning || 0) * 24 * 60 * 60 * 1000
                        ),
                        "MMMM d, yyyy"
                      )}
                    </span>
                  </p>
                )}
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
                  <Label>Crop *</Label>
                  <Select 
                    value={plotData.crop} 
                    onValueChange={(value) => setPlotData({ 
                      ...plotData, 
                      crop: value,
                      crop_variety: "",  // Reset variety when crop changes
                      activity: ""  // Reset activity when crop changes
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a crop" />
                    </SelectTrigger>
                    <SelectContent>
                      {crops.map((crop) => (
                        <SelectItem key={crop.id} value={crop.id}>
                          {crop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ✅ ADD Crop Variety Dropdown */}
                <div className="space-y-2">
                  <Label>Crop Variety (Optional)</Label>
                  <Select 
                    value={plotData.crop_variety} 
                    onValueChange={(value) => setPlotData({ ...plotData, crop_variety: value })}
                    disabled={!plotData.crop}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select variety" />
                    </SelectTrigger>
                    <SelectContent>
                      {cropVarieties.map((variety) => (
                        <SelectItem key={variety.id} value={variety.id}>
                          {variety.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ✅ REPLACE Activity Name input with Activity Dropdown */}
                <div className="space-y-2">
                  <Label>Activity *</Label>
                  <Select 
                    value={plotData.activity} 
                    onValueChange={(value) => setPlotData({ ...plotData, activity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {activities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          {activity.name} (perform {activity.days_after_pruning} days after pruning)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              <div className="space-y-2">
                <Label>Pruning Date *</Label>
                <Input
                  type="date"
                  value={plotData.pruning_date}
                  onChange={(e) => setPlotData({ ...plotData, pruning_date: e.target.value })}
                />
              </div>
              {plotData.activity && plotData.pruning_date && activities.find(a => a.id === plotData.activity) && (
                  <p className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                    ℹ️ Activity will be performed on:{" "}
                    <span className="font-medium text-blue-600">
                      {format(
                        new Date(
                          new Date(plotData.pruning_date).getTime() + 
                          (activities.find(a => a.id === plotData.activity)?.days_after_pruning || 0) * 24 * 60 * 60 * 1000
                        ),
                        "MMMM d, yyyy"
                      )}
                    </span>
                  </p>
                )}
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