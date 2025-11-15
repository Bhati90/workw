import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { MukadamManagementDialog } from "./MukadamManagementDialog";
import { 
  Plus, 
  Bell, 
  Eye, 
  UserCheck, 
  Users,
  MapPin,
  Calendar,
  IndianRupee,
  Search,
  X,
  Edit,
  Filter
} from "lucide-react";
import { JobConfirmationDialog } from "./JobConfirmationDialog";
import { Layout } from "../Layout";
import{ JobAddingDialog } from "./JobAdding";

import { JobEditDialog } from "./JobEdit";


interface SimpleJob {
  id: string;
  farmer: {
    name: string;
    phone: string;
    village: string;
  };
  activity: {
    name: string;
  };
  farm_size_acres: number;
  workers_needed?: number;
  location: string;
  requested_date: string;
  farmer_price_per_acre: number;
  your_price_per_acre?: number;
  status: 'pending' | 'confirmed' | 'priced' | 'notified' | 'assigned' | 'completed';
  assigned_mukadam?: {
    id: string;
    name: string;
    phone: string;
    location: string;
  };
  team_analysis?: {
    team_coverage: string;
    suitable_mukadams: number;
  };
  interests?: Array<{
    id: string;
    mukadam: {
      id: string;
      name: string;
      phone: string;
      location: string;
      team_size?: number;
    };
    is_interested: boolean;
    response_status: 'pending' | 'interested' | 'declined' | 'assigned';
    responded_at: string;
  }>;
}

interface Mukadam {
  id: string;
  name: string;
  phone: string;
  location: string;
  number_of_labourers: number;
  is_active: boolean;
}

export function SimpleJobList() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showConfirmDialogAdd, setShowConfirmDialogAdd] = useState(false);
  const [selectedJob, setSelectedJob] = useState<SimpleJob | null>(null);
  const [showMukadamDialog, setShowMukadamDialog] = useState(false);
  const [selectedMukadams, setSelectedMukadams] = useState<string[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string>("");
  const [showMukadamDialogBig, setShowMukadamDialogBig] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
const [editingJob, setEditingJob] = useState<SimpleJob | null>(null);


 const navigate = useNavigate();
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterActivity, setFilterActivity] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterMukadam, setFilterMukadam] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Fetch jobs
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["simple-jobs"],
    queryFn: async (): Promise<SimpleJob[]> => {
      const response = await fetch("https://workcrop.onrender.com/api/jobs/simple_list/");
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json();
    },
    refetchInterval: 5000,
  });

  // Fetch mukadams for notification
  const { data: mukadams = [] } = useQuery({
    queryKey: ["mukadams"],
    queryFn: async (): Promise<Mukadam[]> => {
      const response = await fetch("https://workcrop.onrender.com/api/mukadams/");
      if (!response.ok) throw new Error("Failed to fetch mukadams");
      const data = await response.json();
      return (data.results || data).filter((m: Mukadam) => m.is_active);
    },
    enabled: showMukadamDialog,
  });

  // Extract unique values for filters
  const uniqueLocations = useMemo(() => {
    const locations = new Set(jobs.map(job => job.location));
    return Array.from(locations).sort();
  }, [jobs]);

  const uniqueActivities = useMemo(() => {
    const activities = new Set(jobs.map(job => job.activity.name));
    return Array.from(activities).sort();
  }, [jobs]);

  const uniqueMukadams = useMemo(() => {
    const mukadamSet = new Set<string>();
    jobs.forEach(job => {
      if (job.assigned_mukadam) {
        mukadamSet.add(job.assigned_mukadam.name);
      }
    });
    return Array.from(mukadamSet).sort();
  }, [jobs]);

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Search term filter (searches farmer name, activity, location, mukadam name)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        job.farmer.name.toLowerCase().includes(searchLower) ||
        job.activity.name.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower) ||
        (job.assigned_mukadam?.name.toLowerCase().includes(searchLower) || false);

      // Status filter
      const matchesStatus = filterStatus === "all" || job.status === filterStatus;

      // Location filter
      const matchesLocation = filterLocation === "all" || job.location === filterLocation;

      // Activity filter
      const matchesActivity = filterActivity === "all" || job.activity.name === filterActivity;

      // Date filter
      const matchesDate = !filterDate || 
        new Date(job.requested_date).toISOString().split('T')[0] === filterDate;

      // Mukadam filter
      const matchesMukadam = filterMukadam === "all" || 
        (filterMukadam === "unassigned" && !job.assigned_mukadam) ||
        (job.assigned_mukadam?.name === filterMukadam);

      return matchesSearch && matchesStatus && matchesLocation && 
             matchesActivity && matchesDate && matchesMukadam;
    });
  }, [jobs, searchTerm, filterStatus, filterLocation, filterActivity, filterDate, filterMukadam]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterLocation("all");
    setFilterActivity("all");
    setFilterDate("");
    setFilterMukadam("all");
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || filterStatus !== "all" || 
    filterLocation !== "all" || filterActivity !== "all" || 
    filterDate || filterMukadam !== "all";


    const notifyMukadamsMutation = useMutation({
  mutationFn: async ({ jobId, mukadamIds }: { jobId: string, mukadamIds: string[] }) => {
    const response = await fetch(`https://workcrop.onrender.com/api/jobs/${jobId}/notify_mukadams/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mukadam_ids: mukadamIds }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to notify mukadams");
    }

    return response.json();
  },
  onSuccess: (data) => {
    // ✅ FIX: Handle both old and new response format
    const count = data.notified?.length || data.push_notifications_sent || 0;
    toast.success(`Notified ${count} mukadams! Push sent: ${data.push_notifications_sent || 0}`);
    queryClient.invalidateQueries({ queryKey: ["simple-jobs"] });
    setShowMukadamDialog(false);
    setSelectedMukadams([]);
  },
  onError: (error) => {
    toast.error("Failed to notify mukadams: " + error.message);
  },
});
  // Assign job mutation
  const assignJobMutation = useMutation({
    mutationFn: async ({ jobId, mukadamId }: { jobId: string, mukadamId: string }) => {
      const response = await fetch(`https://workcrop.onrender.com/api/jobs/${jobId}/assign_final/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mukadam_id: mukadamId }),
      });
      if (!response.ok) throw new Error("Failed to assign job");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Job assigned to ${data.mukadam}!`);
      queryClient.invalidateQueries({ queryKey: ["simple-jobs"] });
    },
    onError: (error) => {
      toast.error("Failed to assign job: " + error.message);
    },
  });

  const handleNotifyMukadams = (jobId: string) => {
    setCurrentJobId(jobId);
    setShowMukadamDialog(true);
  };

  const handleConfirmJob = (job: SimpleJob) => {
    setSelectedJob(job);
    setShowConfirmDialog(true);
  };

  const handleSendNotifications = () => {
    if (selectedMukadams.length === 0) {
      toast.error("Please select at least one mukadam");
      return;
    }

    notifyMukadamsMutation.mutate({
      jobId: currentJobId,
      mukadamIds: selectedMukadams
    });
  };

  const handleAssignJob = (jobId: string, mukadamId: string) => {
    assignJobMutation.mutate({ jobId, mukadamId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-500';
      case 'confirmed': return 'bg-blue-500';
      case 'priced': return 'bg-orange-500';
      case 'notified': return 'bg-purple-500';
      case 'assigned': return 'bg-green-500';
      case 'completed': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading jobs...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold"> Job Management</h1>
            <p className="text-muted-foreground">Confirm jobs, set prices, notify mukadams</p>
          </div>
          <div className="flex items-center gap-2 mt-4">

  <Button className="rounded-lg flex gap-2" onClick={() => setShowConfirmDialogAdd(true)}>
    <Plus className="h-4 w-4" />
    Add New Job
  </Button>

  <Button variant="outline" className="rounded-lg flex gap-2" onClick={() => setShowMukadamDialogBig(true)}>
    <Users className="h-4 w-4" />
    Manage Mukadams
  </Button>

  <Button variant="outline" className="rounded-lg flex gap-2" onClick={() => navigate('/farmers')}>
    <Users className="h-4 w-4" />
    Farmers
  </Button>

</div>


        </div>

        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by farmer name, activity, location, or mukadam..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    {[searchTerm && 1, filterStatus !== "all" && 1, 
                      filterLocation !== "all" && 1, filterActivity !== "all" && 1,
                      filterDate && 1, filterMukadam !== "all" && 1]
                      .filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="priced">Priced</SelectItem>
                      <SelectItem value="notified">Notified</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {uniqueLocations
  .filter(location => location && location.trim() !== '')
  .map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Activity Filter */}
                <div className="space-y-2">
                  <Label>Activity</Label>
                  <Select value={filterActivity} onValueChange={setFilterActivity}>
                    <SelectTrigger>
                      <SelectValue placeholder="All activities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Activities</SelectItem>
                      {uniqueActivities.map(activity => (
                        <SelectItem key={activity} value={activity}>
                          {activity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Filter */}
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>

                {/* Mukadam Filter */}
                <div className="space-y-2">
                  <Label>Mukadam</Label>
                  <Select value={filterMukadam} onValueChange={setFilterMukadam}>
                    <SelectTrigger>
                      <SelectValue placeholder="All mukadams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Mukadams</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {uniqueMukadams.map(mukadam => (
                        <SelectItem key={mukadam} value={mukadam}>
                          {mukadam}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredJobs.length} of {jobs.length} jobs
            </div>
          </CardContent>
        </Card>

        {/* Job Cards */}
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Card key={job.id}>
             <CardHeader>
  <div className="flex justify-between items-start w-full">

    {/* LEFT SIDE CONTENT */}
    <div className="flex flex-col gap-1">
      <CardTitle className="text-lg flex items-center gap-2">
        {job.farmer.name} - {job.activity.name}

        {job.assigned_mukadam && (
          <Badge variant="outline">
            Assigned to {job.assigned_mukadam.name}
          </Badge>
        )}
      </CardTitle>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {job.location}
        </span>

        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(job.requested_date).toLocaleDateString()}
        </span>

        <span>{job.farm_size_acres} acres</span>
      </div>
    </div>

    {/* RIGHT SIDE ACTIONS */}
    <div className="flex flex-col items-end gap-2">

      {/* Status Badge */}
      <Badge className={getStatusColor(job.status)}>
        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
      </Badge>

      {/* Edit Button */}
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => {
          setEditingJob(job);
          setShowEditDialog(true);
        }}
      >
        <Edit className="h-4 w-4" />
        Edit Job
      </Button>
    </div>
  </div>
</CardHeader>

              <CardContent className="space-y-4">
                {/* Job Requirements Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Farm Size:</span>
                    <p className="font-semibold">{job.farm_size_acres} acres</p>
                  </div>
                  {job.workers_needed && (
                    <div>
                      <span className="text-muted-foreground">Workers Needed:</span>
                      <p className="font-semibold">{job.workers_needed} workers</p>
                    </div>
                  )}
                </div>

                {/* Team Analysis */}
                {job.team_analysis && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                    <p className="text-sm text-blue-600">
                      <strong>Team Requirements:</strong> {job.team_analysis.team_coverage} • 
                      {job.team_analysis.suitable_mukadams} suitable teams available
                    </p>
                  </div>
                )}

                {/* Pricing Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Farmer Budget:</span>
                    <p className="font-semibold">₹{job.farmer_price_per_acre}/acre</p>
                  </div>
                  {job.your_price_per_acre && (
                    <div>
                      <span className="text-muted-foreground">Your Price:</span>
                      <p className="font-semibold text-green-600">₹{job.your_price_per_acre}/acre</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Total (Farmer):</span>
                    <p className="font-semibold">₹{(job.farmer_price_per_acre * job.farm_size_acres).toLocaleString()}</p>
                  </div>
                  {job.your_price_per_acre && (
                    <div>
                      <span className="text-muted-foreground">Your Margin:</span>
                      <p className="font-semibold text-blue-600">
                        ₹{((job.farmer_price_per_acre - job.your_price_per_acre) * job.farm_size_acres).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {job.status === 'confirmed' && (
                    <Button 
                      onClick={() => handleConfirmJob(job)}
                      variant="outline"
                    >
                      <IndianRupee className="h-4 w-4 mr-2" />
                      Set Price
                    </Button>
                  )}

                  {job.status === 'priced' && (
                    <Button onClick={() => handleNotifyMukadams(job.id)}>
                      <Bell className="h-4 w-4 mr-2" />
                      Notify Mukadams
                    </Button>
                  )}
                </div>

                {/* Pending Responses */}
                {job.interests && job.interests.filter(i => i.response_status === 'pending').length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-yellow-600">⏳ Waiting for Response:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {job.interests.filter(i => i.response_status === 'pending').map((interest) => (
                        <div key={interest.id} className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
                          {interest.mukadam.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interested Mukadams */}
                {job.interests && job.interests.filter(i => i.response_status === 'interested').length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-600">✅ Interested Mukadams:</h4>
                    <div className="space-y-2">
                      {job.interests.filter(i => i.is_interested).map((interest) => (
                        <div 
                          key={interest.id} 
                          className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded"
                        >
                          <div>
                            <p className="font-semibold">{interest.mukadam.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {interest.mukadam.location} • {interest.mukadam.phone}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Responded: {new Date(interest.responded_at).toLocaleString()}
                            </p>
                          </div>
                          
                          {job.status === 'notified' && !job.assigned_mukadam && (
                            <Button 
                              size="sm"
                              onClick={() => handleAssignJob(job.id, interest.mukadam.id)}
                              disabled={assignJobMutation.isPending}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Assign
                            </Button>
                          )}

                          {job.assigned_mukadam?.id === interest.mukadam.id && (
                            <Badge className="bg-green-500">
                              ✅ ASSIGNED
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assigned Mukadam */}
                {job.interests && job.interests.filter(i => i.response_status === 'assigned').length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-600">🎯 Assigned:</h4>
                    {job.interests.filter(i => i.response_status === 'assigned').map((interest) => (
                      <div key={interest.id} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                        <p className="font-semibold text-blue-700">{interest.mukadam.name}</p>
                        <p className="text-sm text-blue-600">Job assigned • Contact: {interest.mukadam.phone}</p>
                      </div>
                    ))}
                  </div>
                )}

                {job.interests && job.interests.filter(i => i.response_status === 'declined').length > 0 && (
  <div className="space-y-2">
    <h4 className="font-semibold text-red-600">❌ Not Interested:</h4>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {job.interests.filter(i => i.response_status === 'declined').map((interest) => (
                        <div key={interest.id} className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                          {interest.mukadam.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 && jobs.length > 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No jobs match your filters</p>
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        )}

        {jobs.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No jobs found</p>
              <p className="text-sm text-muted-foreground">Confirm your first job to get started</p>
            </CardContent>
          </Card>
        )}

        {/* Mukadam Selection Dialog */}
        <Dialog open={showMukadamDialog} onOpenChange={setShowMukadamDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Mukadams to Notify</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {mukadams.map((mukadam) => (
                    <div key={mukadam.id} className="flex items-center space-x-3 p-3 border rounded">
                      <Checkbox
                        checked={selectedMukadams.includes(mukadam.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMukadams(prev => [...prev, mukadam.id]);
                          } else {
                            setSelectedMukadams(prev => prev.filter(id => id !== mukadam.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{mukadam.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {mukadam.location} • {mukadam.number_of_labourers} workers • {mukadam.phone}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowMukadamDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendNotifications}
                  disabled={selectedMukadams.length === 0 || notifyMukadamsMutation.isPending}
                  className="flex-1"
                >
                  {notifyMukadamsMutation.isPending ? "Sending..." : `Notify ${selectedMukadams.length} Mukadams`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <MukadamManagementDialog 
          open={showMukadamDialogBig}
          onOpenChange={setShowMukadamDialogBig}
        />

        {/* Job Confirmation Dialog */}
        <JobConfirmationDialog 
          job={selectedJob}
          open={showConfirmDialog}
          onOpenChange={(open) => {
            setShowConfirmDialog(open);
            if (!open) {
              setSelectedJob(null);
            }
          }}
        />
        <JobAddingDialog 
          open={showConfirmDialogAdd}
          onOpenChange={setShowConfirmDialogAdd}
        />

        <JobEditDialog
  job={editingJob}
  open={showEditDialog}
  onOpenChange={setShowEditDialog}
/>
      </div>
    </Layout>
  );
}