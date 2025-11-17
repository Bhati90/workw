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
  Edit, Eye, TrendingUp, Calendar, Award, Clock, XCircle,
  ThumbsUp, Target
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
  interested_jobs?: number;  // ✅ NEW
  pending_responses?: number; // ✅ NEW
}

interface JobHistory {
  id: string;
  farmer_name: string;
  activity_name: string;
  farm_size_acres: number;
  farmer_price_per_acre: number;
  your_price_per_acre: number;
  finalized_price: number | null;
  status: string;
  requested_date: string;
  completed_at: string | null;
  location: string;
  workers_needed: number;
  mukadam_response: {
    is_interested: boolean;
    response_status: 'pending' | 'interested' | 'declined' | 'assigned';
    responded_at: string | null;
    was_assigned: boolean;
  };
}

interface JobHistoryResponse {
  mukadam: MukadamDetail;
  jobs: JobHistory[];
  summary: {
    total_notified: number;
    interested: number;
    won: number;
    pending: number;
    declined: number;
  };
}

// Props for the MukadamManagementDialog component
interface MukadamManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
      const response = await fetch("https://workcrop.onrender.com/api/activities/");
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
      const response = await fetch("https://workcrop.onrender.com/api/mukadams/?detailed=true");
      if (!response.ok) throw new Error("Failed to fetch mukadams");
      const data = await response.json();
      console.log("🔍 Mukadams with rates:", data);
      return data.results || data;
    },
    enabled: open,
  });

  // Fetch comprehensive job history for profile view
  const { data: jobHistoryData } = useQuery({
    queryKey: ["mukadam-job-history", viewingProfile],
    queryFn: async (): Promise<JobHistoryResponse> => {
      if (!viewingProfile) return { mukadam: {} as MukadamDetail, jobs: [], summary: {} as any };
      const response = await fetch(`https://workcrop.onrender.com/api/mukadams/${viewingProfile}/job_history/`);
      if (!response.ok) throw new Error("Failed to fetch job history");
      return response.json();
    },
    enabled: !!viewingProfile,
  });

  const addMukadamMutation = useMutation({
    mutationFn: async (mukadamData: any) => {
      const url = isEditMode ? 
        `https://workcrop.onrender.com/api/mukadams/${editingMukadam?.id}/` : 
        "https://workcrop.onrender.com/api/mukadams/";
      
      const method = isEditMode ? "PATCH" : "POST";
      
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
      
      const activityRates = Object.entries(mukadamData.activities)
        .filter(([_, data]: [string, any]) => data.selected && data.rate)
        .map(([activityId, data]: [string, any]) => ({
          mukadam: mukadam.id,
          activity: activityId,
          rate_per_acre: parseFloat(data.rate),
          is_available: true,
        }));

      if (activityRates.length > 0) {
        await fetch("https://workcrop.onrender.com/api/mukadam-activity-rates/bulk_create/", {
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

  // Helper function to get status badge
  const getStatusBadge = (status: string, responseStatus?: string) => {
    if (responseStatus === 'assigned' || status === 'assigned') {
      return <Badge className="bg-green-500">✅ Assigned</Badge>;
    }
    if (responseStatus === 'interested') {
      return <Badge className="bg-blue-500">👍 Interested</Badge>;
    }
    if (responseStatus === 'declined') {
      return <Badge className="bg-red-500">❌ Declined</Badge>;
    }
    if (responseStatus === 'pending') {
      return <Badge className="bg-yellow-500">⏳ Pending</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const profileMukadam = mukadams.find(m => m.id === viewingProfile);
  const jobHistory = jobHistoryData?.jobs || [];
  const summary = jobHistoryData?.summary;

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
            /* ENHANCED PROFILE VIEW */
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

                    {/* Enhanced Performance Stats */}
                    <div className="space-y-2">
                      <Label className="font-medium">Performance Overview</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-muted-foreground">Notified</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {summary?.total_notified || profileMukadam?.total_jobs || 0}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <span className="text-xs text-muted-foreground">Pending</span>
                          </div>
                          <div className="text-2xl font-bold text-purple-600">
                            {summary?.pending || 0}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <ThumbsUp className="h-4 w-4 text-yellow-600" />
                            <span className="text-xs text-muted-foreground">Interested</span>
                          </div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {summary?.interested || 0}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-xs text-muted-foreground">Declined</span>
                          </div>
                          <div className="text-2xl font-bold text-red-600">
                            {summary?.declined || 0}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Award className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-muted-foreground">Won Jobs</span>
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            {summary?.won || profileMukadam?.won_bids || 0}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="text-xs text-muted-foreground">Completed</span>
                          </div>
                          <div className="text-2xl font-bold text-emerald-600">
                            {profileMukadam?.completed_jobs || 0}
                          </div>
                        </div>
                      </div>
                      
                      {/* Success Rates */}
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Response Rate:</span>
                          <span className="font-medium">
                            {summary?.total_notified 
                              ? Math.round(((summary.total_notified - summary.pending) / summary.total_notified) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Win Rate:</span>
                          <span className="font-medium">
                            {summary?.interested 
                              ? Math.round((summary.won / summary.interested) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avg Bid:</span>
                          <span className="font-medium">₹{profileMukadam?.avg_bid_price || 0}/acre</span>
                        </div>
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
                    <CardTitle>Complete Job History ({jobHistory.length})</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      All jobs this mukadam was notified about
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3">
                        {jobHistory.map((job) => (
                          <Card key={job.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{job.farmer_name}</h4>
                                  {getStatusBadge(job.status, job.mukadam_response.response_status)}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                  <div className="text-muted-foreground">
                                    <span className="font-medium">{job.activity_name}</span>
                                  </div>
                                  <div className="text-muted-foreground">
                                    {job.farm_size_acres} acres
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {job.location}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(job.requested_date).toLocaleDateString()}
                                  </div>
                                </div>

                                {/* Response Details */}
                                <div className="text-xs text-muted-foreground">
                                  {job.mukadam_response.responded_at ? (
                                    <span>
                                      Responded: {new Date(job.mukadam_response.responded_at).toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-yellow-600">⏳ No response yet</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right space-y-1">
                                <div className="text-sm text-muted-foreground">
                                  Farmer: ₹{job.farmer_price_per_acre}/acre
                                </div>
                                {job.your_price_per_acre && (
                                  <div className="text-sm font-medium text-green-600">
                                    Your: ₹{job.your_price_per_acre}/acre
                                  </div>
                                )}
                                {job.mukadam_response.was_assigned && job.finalized_price && (
                                  <div className="text-sm font-bold text-blue-600">
                                    Final: ₹{job.finalized_price}/acre
                                  </div>
                                )}
                                {job.mukadam_response.was_assigned && (
                                  <div className="text-sm font-semibold text-green-600">
                                    Total: ₹{((job.finalized_price || 0) * job.farm_size_acres).toLocaleString()}
                                  </div>
                                )}
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
            /* MAIN MANAGEMENT VIEW - Keep existing code */
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
                            <div className="text-muted-foreground">Notified</div>
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