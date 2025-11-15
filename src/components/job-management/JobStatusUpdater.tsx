import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle 
} from "lucide-react";
import { Job } from "@/types/job";
import { cn } from "@/lib/utils";

interface JobStatusUpdaterProps {
  job: Job;
  onStatusUpdate: () => void;
}

export function JobStatusUpdater({ job, onStatusUpdate }: JobStatusUpdaterProps) {
  const [newStatus, setNewStatus] = useState(job.status);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`https://workcrop.onrender.com/api/jobs/${job.id}/update_status/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success("Job status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onStatusUpdate();
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
      setNewStatus(job.status); // Reset to original status
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <Clock className="h-4 w-4" />;
      case 'assigned': return <Clock className="h-4 w-4" />;
      case 'bidding': return <Clock className="h-4 w-4" />;
      case 'finalized': return <CheckCircle2 className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return "bg-blue-500";
      case 'assigned': return "bg-purple-500";
      case 'bidding': return "bg-orange-500";
      case 'finalized': return "bg-green-500";
      case 'in_progress': return "bg-green-600";
      case 'completed': return "bg-gray-500";
      case 'cancelled': return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getNextPossibleStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case 'confirmed':
        return ['assigned', 'cancelled'];
      case 'assigned':
        return ['bidding', 'cancelled'];
      case 'bidding':
        return ['finalized', 'cancelled'];
      case 'finalized':
        return ['in_progress', 'cancelled'];
      case 'in_progress':
        return ['completed', 'cancelled'];
      case 'completed':
        return []; // No further status changes
      case 'cancelled':
        return ['confirmed']; // Can restart
      default:
        return [];
    }
  };

  const possibleStatuses = getNextPossibleStatuses(job.status);
  const hasChanges = newStatus !== job.status;

  const handleUpdateStatus = () => {
    if (hasChanges) {
      updateStatusMutation.mutate(newStatus);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {getStatusIcon(job.status)}
          Update Job Status
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Status:</span>
          <Badge className={cn(getStatusColor(job.status), "text-white")}>
            {job.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        {/* Status Selector */}
        {possibleStatuses.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Update to:</label>
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as typeof newStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={job.status}>
                  {job.status.replace('_', ' ').toUpperCase()} (Current)
                </SelectItem>
                {possibleStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Update Button */}
        {hasChanges && (
          <Button
            onClick={handleUpdateStatus}
            disabled={updateStatusMutation.isPending}
            className="w-full"
          >
            {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        )}

        {/* Status Help */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Status Guide:</strong></p>
          <ul className="space-y-0.5 ml-2">
            <li>• <strong>Confirmed:</strong> Job details confirmed, ready to assign</li>
            <li>• <strong>Assigned:</strong> Mukadams notified about job</li>
            <li>• <strong>Bidding:</strong> Receiving price quotes from mukadams</li>
            <li>• <strong>Finalized:</strong> Mukadam selected, ready for work</li>
            <li>• <strong>In Progress:</strong> Work is happening</li>
            <li>• <strong>Completed:</strong> Work finished</li>
            <li>• <strong>Cancelled:</strong> Job cancelled</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}