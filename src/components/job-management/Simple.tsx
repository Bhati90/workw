import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import { MukadamManagementDialog } from "./MukadamManagementDialog";
import { 
  Plus, 
  Bell, 
  Eye, 
  UserCheck, 
  Users,
  MapPin,
  Calendar,
  IndianRupee
} from "lucide-react";
import { JobConfirmationDialog } from "./JobConfirmationDialog";
import { Layout } from "../Layout";
import{ JobAddingDialog } from "./JobAdding";


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
  interests?: Array<{
    id: string;
    mukadam: {
      id: string;
      name: string;
      phone: string;
      location: string;
    };
    is_interested: boolean;
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

  const queryClient = useQueryClient();

  // Fetch jobs
  const { data: jobs = [], isLoading } = useQuery({
  queryKey: ["simple-jobs"],
  queryFn: async (): Promise<SimpleJob[]> => {
    const response = await fetch("https://workcrop.onrender.com/api/jobs/simple_list/");  // ✅ Use new endpoint
    if (!response.ok) throw new Error("Failed to fetch jobs");
    return response.json();
  },
  refetchInterval: 5000,  // ✅ Reduce to 5 seconds for faster updates
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

  // Notify mukadams mutation
  const notifyMukadamsMutation = useMutation({
    mutationFn: async ({ jobId, mukadamIds }: { jobId: string, mukadamIds: string[] }) => {
      const response = await fetch(`https://workcrop.onrender.com/api/jobs/${jobId}/notify_mukadams/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mukadam_ids: mukadamIds }),
      });
      if (!response.ok) throw new Error("Failed to notify mukadams");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Notified ${data.notified.length} mukadams!`);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Simple Job Management</h1>
          <p className="text-muted-foreground">Confirm jobs, set prices, notify mukadams</p>
        </div>
        <div className="flex gap-2">
        <Button onClick={() => setShowConfirmDialogAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Confirm New Job
        </Button>

        <Button variant="outline" onClick={() => setShowMukadamDialogBig(true)}>
      <Users className="h-4 w-4 mr-2" />
      Manage Mukadams
    </Button>
    </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {job.farmer.name} - {job.activity.name}
                    {/* ✅ Show if assigned */}
                    {job.assigned_mukadam && (
                      <Badge variant="outline" className="ml-2">
                        Assigned to {job.assigned_mukadam.name}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
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
                <Badge className={getStatusColor(job.status)}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            
<CardContent className="space-y-4">
  {/* Job Requirements Info */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
    <div>
      <span className="text-muted-foreground">Farm Size:</span>
      <p className="font-semibold">{job.farm_size_acres} acres</p>
    </div>
    <div>
      <span className="text-muted-foreground">Workers Needed:</span>
      <p className="font-semibold">{job.workers_needed} workers</p>
    </div>
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

  {/* Show Interested Mukadams with team size comparison */}
  {job.interests && job.interests.filter(i => i.response_status === 'interested').length > 0 && (
    <div className="space-y-2">
      <h4 className="font-semibold text-green-600">✅ Interested Mukadams:</h4>
      <div className="space-y-2">
        {job.interests.filter(i => i.response_status === 'interested').map((interest) => {
          const hasEnoughWorkers = interest.mukadam.team_size >= job.workers_needed;
          
          return (
            <div 
              key={interest.id} 
              className={`flex justify-between items-center p-3 rounded ${
                hasEnoughWorkers 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200' 
                  : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200'
              }`}
            >
              <div>
                <div className="font-semibold flex items-center gap-2">
                  {interest.mukadam.name}
                  {hasEnoughWorkers ? (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      ✓ Team Size OK
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                      ⚠ Small Team
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {interest.mukadam.location} • {interest.mukadam.phone}
                </div>
                <div className="text-sm font-medium">
                  Team: {interest.mukadam.team_size} workers 
                  {!hasEnoughWorkers && (
                    <span className="text-yellow-600">
                      (Need {job.workers_needed - interest.mukadam.team_size} more)
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Responded: {new Date(interest.responded_at).toLocaleString()}
                </div>
              </div>
              
              {job.status === 'notified' && !job.assigned_mukadam && (
                <Button 
                  size="sm"
                  onClick={() => handleAssignJob(job.id, interest.mukadam.id)}
                  disabled={assignJobMutation.isPending}
                  variant={hasEnoughWorkers ? "default" : "outline"}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  )}
</CardContent>
            
            <CardContent className="space-y-4">
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

                {/* {job.status === 'notified' && (
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Responses ({job.interests?.filter(i => i.is_interested).length || 0})
                  </Button>
                )} */}

                {/* ✅ Show completion button for assigned jobs
                {job.status === 'assigned' && (
                  <Button variant="outline">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                )} */}
              </div>

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
              {/* Show Interested Mukadams */}
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
                        
                        {/* ✅ Only show assign button if job not already assigned */}
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

                        {/* ✅ Show if this mukadam is assigned */}
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
                {/* Show Assigned Mukadam */}
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
              {/* Show Not Interested */}
              {job.interests && job.interests.filter(i => i.response_status === 'declined').length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-semibold text-red-600">❌ Not Interested:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {job.interests.filter(i => !i.is_interested).map((interest) => (
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
                setSelectedJob(null);  // ✅ Clear selected job when closing
                }
            }}
            />
            <JobAddingDialog 
        open={showConfirmDialogAdd}
        onOpenChange={setShowConfirmDialogAdd}
      />
    </div>
    </Layout>
  );
}