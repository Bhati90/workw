import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Leaf,
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
import { GroupedJobCard } from "./GroupedJob";


import { AutoPriceDialog } from "./AddPrice";
import { JobEditDialog } from "./JobEdit";
interface FarmerJobGroup {
  farmerPhone: string;
  farmerName: string;
  farmerVillage: string;
  jobs: SimpleJob[];
}
  
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
  // Optional crop fields added to match usage in the component
  crop?: string;
  crop_variety?: string;
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


interface ActivityRate {
  id: string;
  activity: string;
  activity_name: string;
  rate_per_acre: string;
  is_available: boolean;
  created_at: string;
}

interface Mukadam {
  id: string;
  name: string;
  phone: string;
  location: string;
  number_of_labourers: number;
  is_active: boolean;
  activity_rates?: ActivityRate[];
  total_jobs?: number;
  completed_jobs?: number;
  won_bids?: number;
  avg_bid_price?: number;
  recommendation?: {  // ✅ ADD THIS
    score: number;
    reasons: string[];
    flags: string[];
    is_available: boolean;
    is_recommended: boolean;
    recommendation_level: string;
    rate: number;
    rate_comparison: string;
    cost_estimate: {
      rate_per_acre: number;
      total_cost: number;
      your_margin: number;
    };
  };
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
  


  const [bulkNotifyJobIds, setBulkNotifyJobIds] = useState<string[]>([]);
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
      const response = await fetch("http://127.0.0.1:8000/api/jobs/simple_list/");
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json();
    },
    refetchInterval: 5000,
  });

  // In SimpleJobList.tsx - Update the mukadam fetching query

const { data: mukadams = [] } = useQuery({
  queryKey: ["mukadams-for-job", currentJobId],
  queryFn: async (): Promise<Mukadam[]> => {
    // ✅ Pass job_id to get recommendations
    const url = currentJobId 
      ? `http://127.0.0.1:8000/api/mukadams/?detailed=true&job_id=${currentJobId}`
      : "http://127.0.0.1:8000/api/mukadams/?detailed=true";
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch mukadams");
    const data = await response.json();
    return (data.results || data).filter((m: Mukadam) => m.is_active);
  },
  enabled: showMukadamDialog && !!currentJobId,
});

// Get the current job details
const currentJob = jobs.find(j => j.id === currentJobId);

  // ✅ MOVE ALL MUTATIONS HERE (BEFORE ANY CONDITIONAL RETURNS)
  const notifyMukadamsMutation = useMutation({
    mutationFn: async ({ jobId, mukadamIds }: { jobId: string, mukadamIds: string[] }) => {
      const response = await fetch(`http://127.0.0.1:8000/api/jobs/${jobId}/notify_mukadams/`, {
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

  const assignJobMutation = useMutation({
    mutationFn: async ({ jobId, mukadamId }: { jobId: string, mukadamId: string }) => {
      const response = await fetch(`http://127.0.0.1:8000/api/jobs/${jobId}/assign_final/`, {
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

  // ✅ MOVE bulkAssignMutation HERE
  const bulkAssignMutation = useMutation({
    mutationFn: async ({ jobIds, mukadamId }: { jobIds: string[], mukadamId: string }) => {
      const response = await fetch(`http://127.0.0.1:8000/api/jobs/bulk_assign/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_ids: jobIds, mukadam_id: mukadamId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign jobs");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`${data.summary.successfully_assigned} job(s) assigned successfully!`);
      if (data.failed_jobs.length > 0) {
        toast.warning(`${data.failed_jobs.length} job(s) could not be assigned`);
      }
      queryClient.invalidateQueries({ queryKey: ["simple-jobs"] });
    },
    onError: (error) => {
      toast.error("Bulk assignment failed: " + error.message);
    },
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

  const allMukadamsSelected = mukadams.length > 0 && selectedMukadams.length === mukadams.length;

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        job.farmer.name.toLowerCase().includes(searchLower) ||
        job.activity.name.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower) ||
        (job.assigned_mukadam?.name.toLowerCase().includes(searchLower) || false);
       
       
       
   const matchesStatus = filterStatus === "all" || job.status === filterStatus;
      const matchesLocation = filterLocation === "all" || job.location === filterLocation;
      const matchesActivity = filterActivity === "all" || job.activity.name === filterActivity;
      const matchesDate = !filterDate || 
        new Date(job.requested_date).toISOString().split('T')[0] === filterDate;
      const matchesMukadam = filterMukadam === "all" || 
        (filterMukadam === "unassigned" && !job.assigned_mukadam) ||
        (job.assigned_mukadam?.name === filterMukadam);

      return matchesSearch && matchesStatus && matchesLocation && 
             matchesActivity && matchesDate && matchesMukadam;
    });
  }, [jobs, searchTerm, filterStatus, filterLocation, filterActivity, filterDate, filterMukadam]);

  // Group jobs by farmer (phone number)
  const groupedJobs = useMemo<FarmerJobGroup[]>(() => {
    const grouped = new Map<string, SimpleJob[]>();
    
    filteredJobs.forEach(job => {
      const key = `${job.farmer.phone}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(job);
    });
    
    return Array.from(grouped.entries()).map(([phone, jobs]) => ({
      farmerPhone: phone,
      farmerName: jobs[0].farmer.name,
      farmerVillage: jobs[0].farmer.village,
      jobs: jobs
    }));
  }, [filteredJobs]);

  // Helper functions
  const toggleAllMukadams = () => {
    if (allMukadamsSelected) {
      setSelectedMukadams([]);
    } else {
      setSelectedMukadams(mukadams.map(m => m.id));
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterLocation("all");
    setFilterActivity("all");
    setFilterDate("");
    setFilterMukadam("all");
  };

  const hasActiveFilters = searchTerm || filterStatus !== "all" || 
    filterLocation !== "all" || filterActivity !== "all" || 
    filterDate || filterMukadam !== "all";

  const handleNotifyMukadams = (jobId: string) => {
    setCurrentJobId(jobId);
    setShowMukadamDialog(true);
  };

  // const handleConfirmJob = (job: SimpleJob) => {
  //   setSelectedJob(job);
  //   setShowConfirmDialog(true);
  // };

  // const handleSendNotifications = () => {
  //   if (selectedMukadams.length === 0) {
  //     toast.error("Please select at least one mukadam");
  //     return;
  //   }

  //   notifyMukadamsMutation.mutate({
  //     jobId: currentJobId,
  //     mukadamIds: selectedMukadams
  //   });
  // };

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

  // ✅ NOW you can have conditional returns AFTER all hooks
  if (isLoading) {
    return <div className="flex justify-center py-8">Loading jobs...</div>;
  }

  const [showAutoPriceDialog, setShowAutoPriceDialog] = useState(false);
const [autoPriceJob, setAutoPriceJob] = useState<SimpleJob | null>(null);


    // ✅ ADD: Handle bulk notify
  const handleBulkNotify = (jobIds: string[]) => {
    setBulkNotifyJobIds(jobIds);
    setCurrentJobId(jobIds[0]); // Set first job as current (for dialog context)
    setShowMukadamDialog(true);
  };

  // ✅ UPDATE: Handle send notifications to work with bulk
  const handleSendNotifications = () => {
    if (selectedMukadams.length === 0) {
      toast.error("Please select at least one mukadam");
      return;
    }

    // If bulk notify mode (multiple jobs)
    if (bulkNotifyJobIds.length > 1) {
      // Notify mukadams for all selected jobs
      Promise.all(
        bulkNotifyJobIds.map(jobId =>
          notifyMukadamsMutation.mutateAsync({
            jobId,
            mukadamIds: selectedMukadams
          })
        )
      ).then(() => {
        toast.success(`Notified mukadams for ${bulkNotifyJobIds.length} jobs!`);
        setBulkNotifyJobIds([]);
      }).catch((error) => {
        toast.error("Some notifications failed: " + error.message);
      });
    } else {
      // Single job notification
      notifyMukadamsMutation.mutate({
        jobId: currentJobId,
        mukadamIds: selectedMukadams
      });
    }
  };

  // ✅ UPDATE: Dialog header to show bulk mode
  const dialogTitle = bulkNotifyJobIds.length > 1
    ? `Select Mukadams to Notify (${bulkNotifyJobIds.length} jobs)`
    : "Select Mukadams to Notify";



// Update handler
const handleConfirmJob = (job: SimpleJob) => {
  setAutoPriceJob(job);
  setShowAutoPriceDialog(true);
};


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

  <Button variant="outline" className="rounded-lg flex gap-2" onClick={() => navigate('/labour-teams')}>
    <Users className="h-4 w-4" />
    availability
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
<div className="space-y-6">
          {groupedJobs.map((group) => (
            group.jobs.length > 1 ? (
              <GroupedJobCard
                key={group.farmerPhone}
                farmerName={group.farmerName}
                farmerPhone={group.farmerPhone}
                farmerVillage={group.farmerVillage}
                jobs={group.jobs}
                onBulkAssign={(jobIds, mukadamId) => 
                  bulkAssignMutation.mutate({ jobIds, mukadamId })
                }
                isAssigning={bulkAssignMutation.isPending}
                onSetPrice={handleConfirmJob}
                onNotifyMukadams={handleNotifyMukadams}
                onBulkNotify={handleBulkNotify} // ✅ ADD THIS
                onAssignJob={handleAssignJob}
              />
    ) : (
      // Single job card (your existing card component)
      (() => {
        const job = group.jobs[0]; // ✅ Define job from group
        return (
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

                    {job.crop && (
                      <span className="flex items-center gap-1">
                        <Leaf className="h-3 w-3" />
                        {job.crop}
                        {job.crop_variety && ` - ${job.crop_variety}`}
                      </span>
                    )}

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
                    <p className="font-semibold">approx {job.workers_needed}</p>
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

              {/* Declined */}
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
        );
      })()
    )
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

        <Dialog open={showMukadamDialog} onOpenChange={setShowMukadamDialog}>
  <DialogContent className="max-w-4xl max-h-[85vh]">
    <DialogHeader>
      <DialogTitle>Select Mukadams to Notify</DialogTitle>
      {currentJob && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>{currentJob.farmer.name} - {currentJob.activity.name} - {currentJob.farm_size_acres} acres</p>
          <p>Your Budget: ₹{currentJob.your_price_per_acre}/acre • Date: {new Date(currentJob.requested_date).toLocaleDateString()}</p>
        </div>
      )}
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Select All Checkbox */}
      <div className="flex items-center space-x-3 p-3 border-b-2 border-primary/20 bg-muted/50 rounded-t">
        <Checkbox
          checked={allMukadamsSelected}
          onCheckedChange={toggleAllMukadams}
          id="select-all"
        />
        <label 
          htmlFor="select-all" 
          className="font-semibold text-sm cursor-pointer flex-1"
        >
          Select All ({mukadams.length} mukadams)
        </label>
        {selectedMukadams.length > 0 && (
          <Badge variant="secondary">
            {selectedMukadams.length} selected
          </Badge>
        )}
      </div>

      {/* ✅ ADD: Recommendation Summary */}
      {mukadams.length > 0 && (
        <div className="grid grid-cols-3 gap-3 p-3 bg-secondary/20 rounded">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {mukadams.filter(m => m.recommendation?.is_recommended).length}
            </div>
            <div className="text-xs text-muted-foreground">Recommended</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {mukadams.filter(m => m.recommendation?.is_available).length}
            </div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {mukadams.filter(m => m.recommendation?.rate && m.recommendation.rate <= (currentJob?.your_price_per_acre || 0)).length}
            </div>
            <div className="text-xs text-muted-foreground">Within Budget</div>
          </div>
        </div>
      )}

      <ScrollArea className="h-[450px] pr-4">
        <div className="space-y-3">
          {mukadams.map((mukadam) => {
            const rec = mukadam.recommendation;
            const isTopPick = mukadams[0]?.id === mukadam.id && rec?.is_recommended;
            
            return (
              <div 
                key={mukadam.id} 
                className={`
                  flex items-start space-x-3 p-4 border rounded-lg transition-all cursor-pointer
                  ${selectedMukadams.includes(mukadam.id) 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-border hover:border-primary/50'
                  }
                  ${isTopPick ? 'border-2 border-green-500 bg-green-50 dark:bg-green-950/20' : ''}
                  ${rec && !rec.is_available ? 'opacity-60' : ''}
                `}
                onClick={() => {
                  if (selectedMukadams.includes(mukadam.id)) {
                    setSelectedMukadams(prev => prev.filter(id => id !== mukadam.id));
                  } else {
                    setSelectedMukadams(prev => [...prev, mukadam.id]);
                  }
                }}
              >
                <Checkbox
                  checked={selectedMukadams.includes(mukadam.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedMukadams(prev => [...prev, mukadam.id]);
                    } else {
                      setSelectedMukadams(prev => prev.filter(id => id !== mukadam.id));
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
                
                <div className="flex-1 space-y-2">
                  {/* Mukadam Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{mukadam.name}</p>
                        
                        {/* ✅ Recommendation Badges */}
                        {isTopPick && (
                          <Badge className="bg-green-600">
                            🌟 Top Pick
                          </Badge>
                        )}
                        {rec?.is_recommended && !isTopPick && (
                          <Badge className="bg-blue-600">
                            ✅ Recommended
                          </Badge>
                        )}
                        {rec?.is_available && (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            Available
                          </Badge>
                        )}
                        {rec && !rec.is_available && (
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                            Not Available
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {mukadam.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {mukadam.number_of_labourers} workers
                        </span>
                        <span>{mukadam.phone}</span>
                      </div>
                    </div>
                    
                    {/* ✅ Match Score & Price */}
                    <div className="text-right">
                      {rec && (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-right">
                              <p className="font-semibold text-green-600">
                                ₹{rec.rate}/acre
                              </p>
                              {rec.cost_estimate && (
                                <p className="text-xs text-muted-foreground">
                                  Margin: ₹{rec.cost_estimate.your_margin.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Match Score Bar */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-20">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  rec.score >= 70 ? 'bg-green-500' :
                                  rec.score >= 50 ? 'bg-blue-500' :
                                  rec.score >= 30 ? 'bg-yellow-500' : 'bg-orange-500'
                                }`}
                                style={{ width: `${Math.min(rec.score, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">{rec.score}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ✅ Reasons for Recommendation */}
                  {rec && rec.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {rec.reasons.map((reason: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* ✅ Warning Flags */}
                  {rec && rec.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {rec.flags.map((flag: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs text-orange-600 border-orange-300">
                          ⚠️ {flag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Activity Rates Summary */}
                  {!rec && mukadam.activity_rates && mukadam.activity_rates.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {mukadam.activity_rates.length} activities configured
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {mukadams.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2" />
              <p>No mukadams found matching criteria</p>
            </div>
          )}
        </div>
      </ScrollArea>
    
      <DialogFooter className="flex justify-end gap-2 pt-4">
        <Button 
          variant="outline" 
          onClick={() => {
            setShowMukadamDialog(false);
            setSelectedMukadams([]);
          }}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSendNotifications}
          disabled={selectedMukadams.length === 0 || notifyMukadamsMutation.isPending}
          className="flex-1"
        >
          {notifyMukadamsMutation.isPending 
            ? "Sending..." 
            : `Notify ${selectedMukadams.length} Mukadam${selectedMukadams.length !== 1 ? 's' : ''}`
          }
        </Button>
      </DialogFooter>
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
        <JobEditDialog
          job={editingJob}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
        <JobAddingDialog 
          open={showConfirmDialogAdd}
          onOpenChange={setShowConfirmDialogAdd}
        />

        <AutoPriceDialog
  job={autoPriceJob}
  open={showAutoPriceDialog}
  onOpenChange={setShowAutoPriceDialog}
  onPriced={() => queryClient.invalidateQueries({ queryKey: ["simple-jobs"] })}
/>

        
      </div>
    </Layout>
  );
}