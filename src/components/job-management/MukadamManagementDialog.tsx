// Complete enhanced MukadamManagementDialog.tsx
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Plus, Users, MapPin, Phone, CheckCircle2, IndianRupee, 
  Edit, Eye, TrendingUp, Calendar, Award
} from "lucide-react";

interface Activity {
  id: string;
  name: string;
  description: string;
}

interface MukadamActivityRate {
  id: string;
  activity: Activity;
  activity_name: string;
  rate_per_acre: number;
  is_available: boolean;
}

interface MukadamDetail {
  id: string;
  name: string;
  phone: string;
  location: string;
  number_of_labourers: number;
  is_active: boolean;
  created_at: string;
  activity_rates: MukadamActivityRate[];
  total_jobs: number;
  completed_jobs: number;
  won_bids: number;
  avg_bid_price: number;
}

interface JobHistory {
  id: string;
  farmer_name: string;
  activity_name: string;
  farm_size_acres: number;
  finalized_price: number;
  status: string;
  requested_date: string;
  completed_at: string;
}

export function MukadamManagementDialog({ open, onOpenChange }: MukadamManagementDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [labourers, setLabourers] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<{[key: string]: {selected: boolean, rate: string}}>({});
  const [editingMukadam, setEditingMukadam] = useState<MukadamDetail | null>(null);
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const queryClient = useQueryClient();

  // Fetch activities
  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: async (): Promise<Activity[]> => {
      const response = await fetch("http://127.0.0.1:8000/api/activities/");
      if (!response.ok) throw new Error("Failed to fetch activities");
      const data = await response.json();
      return data.results || data;
    },
    enabled: open,
  });

  // Fetch mukadams with detailed info
  const { data: mukadams = [] } = useQuery({
    queryKey: ["mukadams-detailed"],
    queryFn: async (): Promise<MukadamDetail[]> => {
      const response = await fetch("http://127.0.0.1:8000/api/mukadams/?detailed=true");
      if (!response.ok) throw new Error("Failed to fetch mukadams");
      const data = await response.json();
      console.log("🔍 Mukadams with rates:", data); // Debug log
      return data.results || data;
    },
    enabled: open,
  });

  // Fetch job history for profile view
  const { data: jobHistory = [] } = useQuery({
    queryKey: ["mukadam-job-history", viewingProfile],
    queryFn: async (): Promise<JobHistory[]> => {
      if (!viewingProfile) return [];
      const response = await fetch(`http://127.0.0.1:8000/api/mukadams/${viewingProfile}/job_history/`);
      if (!response.ok) throw new Error("Failed to fetch job history");
      const data = await response.json();
      return data.jobs || [];
    },
    enabled: !!viewingProfile,
  });

  const addMukadamMutation = useMutation({
    mutationFn: async (mukadamData: any) => {
      const url = isEditMode ? 
        `http://127.0.0.1:8000/api/mukadams/${editingMukadam?.id}/` : 
        "http://127.0.0.1:8000/api/mukadams/";
      
      const method = isEditMode ? "PATCH" : "POST";
      
      // Create or update mukadam
      const mukadamResponse = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mukadamData.name,
          phone: mukadamData.phone,
          location: mukadamData.location,
          number_of_labourers: mukadamData.number_of_labourers,
          is_active: mukadamData.is_active ?? true,
        }),
      });
      
      if (!mukadamResponse.ok) throw new Error(`Failed to ${isEditMode ? 'update' : 'add'} mukadam`);
      const mukadam = await mukadamResponse.json();
      
      // Handle activity rates
      const activityRates = Object.entries(mukadamData.activities)
        .filter(([_, data]: [string, any]) => data.selected && data.rate)
        .map(([activityId, data]: [string, any]) => ({
          mukadam: mukadam.id,
          activity: activityId,
          rate_per_acre: parseFloat(data.rate),
          is_available: true,
        }));

      if (activityRates.length > 0) {
        await fetch("http://127.0.0.1:8000/api/mukadam-activity-rates/bulk_create/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rates: activityRates }),
        });
      }

      return mukadam;
    },
    onSuccess: () => {
      toast.success(`Mukadam ${isEditMode ? 'updated' : 'added'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["mukadams-detailed"] });
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to ${isEditMode ? 'update' : 'add'} mukadam: ` + error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setPhone("");
    setLocation("");
    setLabourers("");
    setSelectedActivities({});
    setEditingMukadam(null);
    setIsEditMode(false);
  };

  const handleEdit = (mukadam: MukadamDetail) => {
    setEditingMukadam(mukadam);
    setIsEditMode(true);
    setName(mukadam.name);
    setPhone(mukadam.phone);
    setLocation(mukadam.location);
    setLabourers(mukadam.number_of_labourers.toString());
    
    // Pre-populate activity rates
    const activityRates: {[key: string]: {selected: boolean, rate: string}} = {};
    mukadam.activity_rates?.forEach(rate => {
      activityRates[rate.activity.id] = {
        selected: rate.is_available,
        rate: rate.rate_per_acre.toString()
      };
    });
    setSelectedActivities(activityRates);
  };

  const handleActivityToggle = (activityId: string) => {
    setSelectedActivities(prev => ({
      ...prev,
      [activityId]: {
        selected: !prev[activityId]?.selected,
        rate: prev[activityId]?.rate || ""
      }
    }));
  };

  const handleRateChange = (activityId: string, rate: string) => {
    setSelectedActivities(prev => ({
      ...prev,
      [activityId]: {
        ...prev[activityId],
        rate
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone || !location || !labourers) {
      toast.error("Please fill all fields");
      return;
    }

    const selectedActivitiesData = Object.entries(selectedActivities)
      .filter(([_, data]) => data.selected);

    if (selectedActivitiesData.length === 0) {
      toast.error("Please select at least one activity with rate");
      return;
    }

    const invalidRates = selectedActivitiesData.filter(([_, data]) => !data.rate || parseFloat(data.rate) <= 0);
    if (invalidRates.length > 0) {
      toast.error("Please enter valid rates for all selected activities");
      return;
    }

    addMukadamMutation.mutate({
      name,
      phone,
      location,
      number_of_labourers: parseInt(labourers),
      activities: selectedActivities,
      is_active: editingMukadam?.is_active ?? true,
    });
  };

  // Get mukadam profile data
  const profileMukadam = mukadams.find(m => m.id === viewingProfile);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl p-6">
  <ScrollArea className="max-h-[85vh] pr-2">

        <DialogHeader>
          <DialogTitle>
            {viewingProfile ? `${profileMukadam?.name} - Profile` : 
             isEditMode ? `Edit ${editingMukadam?.name}` :
             "Manage Mukadams & Activity Rates"}
          </DialogTitle>
        </DialogHeader>

        {viewingProfile ? (
          /* PROFILE VIEW */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setViewingProfile(null)}>
                ← Back to List
              </Button>
              <Button onClick={() => handleEdit(profileMukadam!)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Summary */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {profileMukadam?.name}
                    <Badge className={profileMukadam?.is_active ? "bg-green-500" : "bg-red-500"}>
                      {profileMukadam?.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{profileMukadam?.number_of_labourers} labourers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{profileMukadam?.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profileMukadam?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Joined {new Date(profileMukadam?.created_at || '').toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Performance Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                      <div className="text-2xl font-bold text-blue-600">{profileMukadam?.total_jobs}</div>
                      <div className="text-xs text-muted-foreground">Total Jobs</div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded">
                      <div className="text-2xl font-bold text-green-600">{profileMukadam?.completed_jobs}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                      <div className="text-2xl font-bold text-yellow-600">{profileMukadam?.won_bids}</div>
                      <div className="text-xs text-muted-foreground">Won Bids</div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded">
                      <div className="text-2xl font-bold text-purple-600">₹{profileMukadam?.avg_bid_price}</div>
                      <div className="text-xs text-muted-foreground">Avg Rate</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Activity Rates */}
                  <div className="space-y-2">
                    <Label className="font-medium">Activity Rates</Label>
                    <div className="space-y-2">
                      {profileMukadam?.activity_rates?.filter(rate => rate.is_available).map((rate) => (
                        <div key={rate.id} className="flex justify-between items-center text-sm bg-secondary/30 p-2 rounded">
                          <span>{rate.activity_name || rate.activity.name}</span>
                          <span className="font-medium">₹{rate.rate_per_acre}/acre</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job History */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Job History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {jobHistory.map((job) => (
                        <Card key={job.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h4 className="font-semibold">{job.farmer_name}</h4>
                              <p className="text-sm text-muted-foreground">{job.activity_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {job.farm_size_acres} acres • {new Date(job.requested_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">₹{job.finalized_price}/acre</div>
                              <div className="text-sm text-green-600">
                                Total: ₹{(job.finalized_price * job.farm_size_acres).toLocaleString()}
                              </div>
                              <Badge className="mt-1" variant={job.status === 'completed' ? 'default' : 'secondary'}>
                                {job.status}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                      
                      {jobHistory.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Award className="h-12 w-12 mx-auto mb-2" />
                          <p>No job history yet</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* MAIN MANAGEMENT VIEW */
          <Tabs defaultValue={isEditMode ? "add" : "list"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add">
                {isEditMode ? "Edit Mukadam" : "Add New Mukadam"}
              </TabsTrigger>
              <TabsTrigger value="list">Existing Mukadams ({mukadams.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="space-y-6">
              {isEditMode && (
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Editing: {editingMukadam?.name}</Badge>
                  <Button variant="outline" onClick={resetForm}>Cancel Edit</Button>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Details Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter mukadam name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Phone Number *</Label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91-XXXXXXXXXX"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Location *</Label>
                        <Input
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Enter location"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Number of Labourers *</Label>
                        <Input
                          type="number"
                          value={labourers}
                          onChange={(e) => setLabourers(e.target.value)}
                          placeholder="0"
                          min="1"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={addMukadamMutation.isPending}
                      >
                        {addMukadamMutation.isPending ? 
                          (isEditMode ? "Updating..." : "Adding...") : 
                          (isEditMode ? "Update Mukadam" : "Add Mukadam")
                        }
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Activities & Rates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Activities & Rates (₹ per acre)</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select activities this mukadam can do and set their rates
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {activities.map((activity) => (
                          <div key={activity.id} className="border rounded p-3">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={selectedActivities[activity.id]?.selected || false}
                                  onCheckedChange={() => handleActivityToggle(activity.id)}
                                />
                                <Label className="text-sm font-medium">
                                  {activity.name}
                                </Label>
                                {selectedActivities[activity.id]?.selected && (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                              
                              {selectedActivities[activity.id]?.selected && (
                                <div className="ml-6 flex items-center gap-2">
                                  <Label className="text-xs">Rate:</Label>
                                  <div className="flex items-center gap-1">
                                    <IndianRupee className="h-3 w-3" />
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={selectedActivities[activity.id]?.rate || ""}
                                      onChange={(e) => handleRateChange(activity.id, e.target.value)}
                                      className="w-24 h-8 text-sm"
                                      min="0"
                                      step="50"
                                    />
                                    <span className="text-xs text-muted-foreground">/acre</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mukadams.map((mukadam) => (
                    <Card key={mukadam.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{mukadam.name}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Users className="h-3 w-3" />
                              {mukadam.number_of_labourers} labourers
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => setViewingProfile(mukadam.id)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(mukadam)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {mukadam.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {mukadam.phone}
                          </div>
                        </div>

                        {/* Performance Summary */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="text-xs">
                            <div className="font-bold">{mukadam.total_jobs}</div>
                            <div className="text-muted-foreground">Jobs</div>
                          </div>
                          <div className="text-xs">
                            <div className="font-bold">{mukadam.won_bids}</div>
                            <div className="text-muted-foreground">Won</div>
                          </div>
                          <div className="text-xs">
                            <div className="font-bold">₹{mukadam.avg_bid_price}</div>
                            <div className="text-muted-foreground">Avg</div>
                          </div>
                        </div>

                        {/* Activity Rates Summary */}
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Activity Rates:</Label>
                          <div className="text-xs text-muted-foreground">
                            {mukadam.activity_rates?.filter(rate => rate.is_available).length || 0} activities configured
                          </div>
                          {mukadam.activity_rates?.filter(rate => rate.is_available).slice(0, 2).map((rate) => (
                            <div key={rate.id} className="flex justify-between items-center text-xs bg-secondary/30 p-1 rounded">
                              <span>{rate.activity_name || rate.activity.name}</span>
                              <span className="font-medium">₹{rate.rate_per_acre}</span>
                            </div>
                          ))}
                          {(mukadam.activity_rates?.filter(rate => rate.is_available).length || 0) > 2 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{(mukadam.activity_rates?.filter(rate => rate.is_available).length || 0) - 2} more
                            </div>
                          )}
                        </div>

                        <Badge className={mukadam.is_active ? "bg-green-500 w-full justify-center" : "bg-red-500 w-full justify-center"}>
                          {mukadam.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}