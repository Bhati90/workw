import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  IndianRupee,
  MapPin,
  Phone,
  Plus,
  RefreshCw
} from "lucide-react";
import { BidHistoryDialog } from "./BidHistoryDialog";
import { MukadamManagementDialog } from "./MukadamManagementDialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Job, MukadamBid } from "@/types/job";
import { JobConfirmationDialog } from "./JobConfirmationDialog";
import { MukadamAssignmentDialog } from "./MukadamAssignmentDialog";
import { BidComparisonPanel } from "./BidComparisonPanel";
import { toast } from "sonner";

import { ReAssignJobDialog } from "./ReassignJobDialog";
import { Layout } from "../Layout";
 const getStatusColor = (status: string) => {
    const colors = {
      confirmed: "bg-blue-500",
      assigned: "bg-purple-500", 
      bidding: "bg-orange-500",
      finalized: "bg-green-500",
      in_progress: "bg-green-600",
      completed: "bg-gray-500",
      cancelled: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getStatusText = (status: string) => {
    const texts = {
      confirmed: "Ready to Assign",
      assigned: "Mukadams Notified",
      bidding: "Receiving Bids", 
      finalized: "Mukadam Selected",
      in_progress: "Work in Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return texts[status as keyof typeof texts] || status;
  };
export function JobManagementDashboard() {
  const [bidHistoryJobId, setBidHistoryJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningJob, setAssigningJob] = useState<Job | null>(null);
  const [showMukadamDialog, setShowMukadamDialog] = useState(false);

  const [reAssignJob, setReAssignJob] = useState<Job | null>(null);
const [currentAssignments, setCurrentAssignments] = useState<string[]>([]);

const handleReAssign = async (job: Job) => {
  // Get current assignments for this job
  try {
    const response = await fetch(`http://localhost:8000/api/jobs/${job.id}/assignments/`);
    const data = await response.json();
    setCurrentAssignments(data.assignments.map(a => a.mukadam_id));
    setReAssignJob(job);
  } catch (error) {
    toast.error("Failed to load current assignments");
  }
};

  const { data: jobsResponse, isLoading, refetch } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const response = await fetch("https://workcrop.onrender.com/api/jobs/");
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json();
    },
    refetchInterval: 30000,
  });
  const { data: selectedJobBids = [] } = useQuery({
    queryKey: ["bids", selectedJob?.id],
    queryFn: async (): Promise<MukadamBid[]> => {
      if (!selectedJob) return [];
      const response = await fetch(`https://workcrop.onrender.com/api/jobs/${selectedJob.id}/bids/`);
      if (!response.ok) throw new Error("Failed to fetch bids");
      return response.json();
    },
    enabled: !!selectedJob,
    refetchInterval: 10000, // Refresh bids more frequently
  });

 
   const jobs = jobsResponse?.results || [];

  console.log("Jobs from query:", jobs);
console.log("Jobs by status:", {
  confirmed: jobs.filter(j => j.status === 'confirmed'),
  bidding: jobs.filter(j => j.status === 'bidding'),
  finalized: jobs.filter(j => j.status === 'finalized'),
});
  const jobsByStatus = {
    confirmed: jobs.filter(j => j.status === 'confirmed'),
    bidding: jobs.filter(j => j.status === 'bidding'),
    finalized: jobs.filter(j => j.status === 'finalized'),
    active: jobs.filter(j => ['in_progress'].includes(j.status)),
    completed: jobs.filter(j => j.status === 'completed'),
  };

  const handleAssignJob = (job: Job) => {
    setAssigningJob(job);
    setShowAssignDialog(true);
  };

  const handleJobStatusUpdate = () => {
    // Refetch jobs when status changes
    refetch();
    toast.success("Job status updated");
  };

  return (
    <Layout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

  <div>
    <h1 className="text-3xl font-bold">Job Management</h1>
    <p className="text-muted-foreground">Manage confirmed jobs, assignments, and bidding</p>
  </div>
  <div className="flex gap-2">
    <Button variant="outline" onClick={() => setShowMukadamDialog(true)}>
      <Users className="h-4 w-4 mr-2" />
      Manage Mukadams
    </Button>
    <Button onClick={() => setShowConfirmDialog(true)}>
      <Plus className="h-4 w-4 mr-2" />
      Add New Job
    </Button>
  </div>
</div>

      {/* Key Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{jobsByStatus.confirmed.length}</div>
            <p className="text-xs text-muted-foreground">Ready to assign</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bidding</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{jobsByStatus.bidding.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalized</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{jobsByStatus.finalized.length}</div>
            <p className="text-xs text-muted-foreground">Ready for work</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{jobsByStatus.active.length}</div>
            <p className="text-xs text-muted-foreground">Work ongoing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{jobsByStatus.completed.length}</div>
            <p className="text-xs text-muted-foreground">Done</p>
          </CardContent>
        </Card>
      </div>
      

      {/* Main Content */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3 ">

       {/* Jobs List */}
<div className="lg:col-span-2" >
  <Tabs defaultValue="confirmed" className="space-y-4">
    {/* Tabs Header */}
    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
      <TabsTrigger value="confirmed">
        Confirmed ({jobsByStatus.confirmed.length})
      </TabsTrigger>
      <TabsTrigger value="bidding">
        Bidding ({jobsByStatus.bidding.length})
      </TabsTrigger>
      <TabsTrigger value="finalized">
        Finalized ({jobsByStatus.finalized.length})
      </TabsTrigger>
      <TabsTrigger value="active">
        Active ({jobsByStatus.active.length})
      </TabsTrigger>
    </TabsList>

    {/* Confirmed */}
    <TabsContent value="confirmed" className="space-y-3">
      {jobsByStatus.confirmed.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No confirmed jobs pending assignment
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowConfirmDialog(true)}
            >
              Add New Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        jobsByStatus.confirmed.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onSelect={setSelectedJob}
            onAssign={handleAssignJob}
            isSelected={selectedJob?.id === job.id}
          />
        ))
      )}
    </TabsContent>

    {/* Bidding */}
    <TabsContent value="bidding" className="space-y-4">
      {jobsByStatus.bidding.map((job) => (
        <div key={job.id} className="space-y-2 border rounded-xl p-3 bg-muted/20">
          {/* Action Row */}
          <div className="flex justify-between items-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="xs"
              className="text-orange-600 hover:text-orange-700"
              onClick={() => handleReAssign(job)}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Re-assign
            </Button>
          </div>

          {/* Job Card */}
          <JobCard
            job={job}
            onSelect={setSelectedJob}
            isSelected={selectedJob?.id === job.id}
          />
        </div>
      ))}
    </TabsContent>

    {/* Finalized */}
    <TabsContent value="finalized" className="space-y-4">
      {jobsByStatus.finalized.map((job) => (
        <div key={job.id} className="space-y-2 border rounded-xl p-3 bg-muted/20">
          {/* Action Row */}
          <div className="flex justify-between items-center flex-wrap gap-2">
            <Button
              variant="secondary"
              size="xs"
              className="h-7 text-xs px-2 py-1 rounded-md"
              onClick={() => setBidHistoryJobId(job.id)}
            >
              📊 View All Bids
            </Button>
          </div>

          {/* Job Card */}
          <JobCard
            job={job}
            onSelect={setSelectedJob}
            isSelected={selectedJob?.id === job.id}
          />
        </div>
      ))}
    </TabsContent>

    {/* Active */}
    <TabsContent value="active" className="space-y-3">
      {jobsByStatus.active.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onSelect={setSelectedJob}
          isSelected={selectedJob?.id === job.id}
        />
      ))}
    </TabsContent>
  </Tabs>
</div>


        {/* Job Details Panel */}
        <div>
          {selectedJob ? (
            selectedJob.status === 'bidding' && selectedJobBids.length > 0 ? (
              <BidComparisonPanel 
                job={selectedJob} 
                bids={selectedJobBids}
                onStatusUpdate={handleJobStatusUpdate}
              />
            ) : (
              <JobDetailsPanel 
                job={selectedJob} 
                bids={selectedJobBids}
                onAssign={handleAssignJob}
                onStatusUpdate={handleJobStatusUpdate}
              />
            )
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a job to view details and manage bidding</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <JobConfirmationDialog 
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
      />

      <MukadamAssignmentDialog
        job={assigningJob}
        open={showAssignDialog}
        onOpenChange={(open) => {
          setShowAssignDialog(open);
          if (!open) setAssigningJob(null);
        }}
      />
      <MukadamManagementDialog 
  open={showMukadamDialog}
  onOpenChange={setShowMukadamDialog}
/>
<BidHistoryDialog 
  jobId={bidHistoryJobId}
  open={!!bidHistoryJobId}
  onOpenChange={(open) => !open && setBidHistoryJobId(null)}
/>

<ReAssignJobDialog 
  job={reAssignJob}
  open={!!reAssignJob}
  onOpenChange={(open) => !open && setReAssignJob(null)}
  currentAssignments={currentAssignments}
/>
    </div>
    </Layout>
  );
}

// Enhanced Job Card Component
function JobCard({ 
  job, 
  onSelect, 
  onAssign,
  isSelected 
}: { 
  job: Job; 
  onSelect: (job: Job) => void;
  onAssign?: (job: Job) => void;
  isSelected?: boolean;
}) {
  const urgencyColor = () => {
    const daysUntil = Math.ceil(
      (new Date(job.requested_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) return "border-red-500";
    if (daysUntil <= 2) return "border-orange-500";
    if (daysUntil <= 7) return "border-yellow-500";
    return "border-green-500";
  };

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all cursor-pointer",
        isSelected && "ring-2 ring-primary",
        urgencyColor()
      )}
      onClick={() => onSelect(job)}
    >
      <CardContent className="pt-4 px-3 sm:px-4">

        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold">{job.farmer.name}</h4>
              <p className="text-sm text-muted-foreground">{job.activity.name}</p>
            </div>
            <div className="text-right space-y-1">
              <Badge className={cn(getStatusColor(job.status), "text-white")}>
                {getStatusText(job.status)}
              </Badge>
              {job.finalized_mukadam && (
                <p className="text-xs text-green-600">
                  → {job.finalized_mukadam.name}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">

            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.farm_size_acres} acres
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(job.requested_date), "MMM d")}
            </div>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              {job.finalized_price 
                ? `₹${job.finalized_price}/acre (Final)`
                : `₹${job.farmer_price_per_acre}/acre (Farmer)`
              }
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </div>
          </div>

          {job.status === 'confirmed' && onAssign && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAssign(job);
              }}
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              Assign to Mukadams
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Job Details Panel Component  
function JobDetailsPanel({ 
  job, 
  bids, 
  onAssign, 
  onStatusUpdate 
}: { 
  job: Job; 
  bids: MukadamBid[];
  onAssign?: (job: Job) => void;
  onStatusUpdate: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {job.farmer.name} - {job.activity.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Job Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Farm Size:</span>
            <span>{job.farm_size_acres} acres</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span>{format(new Date(job.requested_date), "MMM d, yyyy")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time:</span>
            <span>{job.requested_time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Farmer's Price:</span>
            <span>₹{job.farmer_price_per_acre}/acre</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location:</span>
            <span>{job.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contact:</span>
            <span>{job.farmer.phone}</span>
          </div>
        </div>

        {job.notes && (
          <div className="p-3 bg-secondary/30 rounded">
            <p className="text-sm"><strong>Notes:</strong> {job.notes}</p>
          </div>
        )}

        {/* Status-specific Actions */}
        {job.status === 'confirmed' && onAssign && (
          <Button onClick={() => onAssign(job)} className="w-full">
            <Users className="h-4 w-4 mr-2" />
            Assign to Mukadams
          </Button>
        )}

        {job.status === 'bidding' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Bids Status</span>
              <Badge variant="outline">{bids.length} responses</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              • Interested: {bids.filter(b => b.status === 'interested').length}
              <br />
              • Declined: {bids.filter(b => b.status === 'declined').length}
              <br />
              • Pending: {bids.filter(b => b.status === 'pending').length}
            </div>
          </div>
        )}

        {job.status === 'finalized' && job.finalized_mukadam && (
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded">
            <div className="text-sm">
              <p><strong>Selected:</strong> {job.finalized_mukadam.name}</p>
              <p><strong>Final Price:</strong> ₹{job.finalized_price}/acre</p>
              <p><strong>Total:</strong> ₹{((job.finalized_price || 0) * job.farm_size_acres).toLocaleString("en-IN")}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}