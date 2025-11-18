// GroupedJobCard.tsx - UPDATE the entire component

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MapPin, 
  Phone, 
  Calendar, 
  Leaf, 
  UserCheck,
  ChevronDown,
  ChevronUp,
  Bell,
  IndianRupee
} from "lucide-react";
import { format } from "date-fns";

interface GroupedJob {
  id: string;
  activity: { name: string };
  crop?: string;
  crop_variety?: string;
  farm_size_acres: number;
  location: string;
  requested_date: string;
  farmer_price_per_acre: number;
  your_price_per_acre?: number;
  status: string;
  interests?: any[];
}

interface GroupedJobCardProps {
  farmerName: string;
  farmerPhone: string;
  farmerVillage: string;
  jobs: GroupedJob[];
  onBulkAssign: (jobIds: string[], mukadamId: string) => void;
  isAssigning: boolean;
  // ✅ ADD these new props for individual actions
  onSetPrice?: (job: GroupedJob) => void;
  onNotifyMukadams?: (jobId: string) => void;
  onBulkNotify?:(jobIds: string[]) => void;
  onAssignJob?: (jobId: string, mukadamId: string) => void;
}

export function GroupedJobCard({
  farmerName,
  farmerPhone,
  farmerVillage,
  jobs,
  onBulkAssign,
  isAssigning,
  onSetPrice,
  onNotifyMukadams,
  onBulkNotify,
  onAssignJob
}: GroupedJobCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [selectedMukadam, setSelectedMukadam] = useState<string>("");

  // Get common interested mukadams (mukadams interested in ALL selected jobs)
  const getCommonInterestedMukadams = () => {
    if (selectedJobIds.length === 0) return [];
    
    const selectedJobs = jobs.filter(job => selectedJobIds.includes(job.id));
    if (selectedJobs.length === 0) return [];
    
    // Get mukadams interested in first selected job
    const firstJobInterested = selectedJobs[0].interests
      ?.filter(i => i.is_interested && i.response_status === 'interested')
      ?.map(i => i.mukadam) || [];
    
    // Filter to only those interested in ALL selected jobs
    return firstJobInterested.filter(mukadam => 
      selectedJobs.every(job => 
        job.interests?.some(i => 
          i.mukadam.id === mukadam.id && 
          i.is_interested && 
          i.response_status === 'interested'
        )
      )
    );
  };

  const commonMukadams = getCommonInterestedMukadams();
  const allSelected = selectedJobIds.length === jobs.length;
  const someSelected = selectedJobIds.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(jobs.map(j => j.id));
    }
  };

  const toggleJob = (jobId: string) => {
    setSelectedJobIds(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleBulkAssign = () => {
    if (selectedJobIds.length === 0 || !selectedMukadam) return;
    onBulkAssign(selectedJobIds, selectedMukadam);
    setSelectedJobIds([]);
    setSelectedMukadam("");
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

  // Calculate totals
  const totalAcres = jobs.reduce((sum, job) => sum + job.farm_size_acres, 0);
  const totalValue = jobs.reduce((sum, job) => 
    sum + (job.farmer_price_per_acre * job.farm_size_acres), 0
  );
const canBulkNotify = selectedJobIds.length > 0 && 
    selectedJobIds.every(id => {
      const job = jobs.find(j => j.id === id);
      return job?.status === 'priced';
    });

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-3">
              <span>{farmerName}</span>
              <Badge variant="secondary" className="text-sm">
                {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'}
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {farmerPhone}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {farmerVillage}
              </span>
            </div>

            {/* Summary Stats */}
            <div className="flex items-center gap-6 mt-3 text-sm">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/20 rounded">
                <span className="text-muted-foreground">Total Area:</span>
                <span className="font-semibold">{totalAcres} acres</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950/20 rounded">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-semibold text-green-600">₹{totalValue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </CardHeader>

       {isExpanded && (
        <CardContent className="space-y-4">
          {/* Bulk Selection Controls */}
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded">
            <div className="flex items-center gap-3">
              <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    ref={(el) => {
                        const input = el as HTMLInputElement | null;
                        if (input) {
                          input.indeterminate = someSelected && !allSelected;
                        }
                    }}
                    />

              <span className="font-medium text-sm">
                {selectedJobIds.length === 0 
                  ? "Select jobs for bulk actions" 
                  : `${selectedJobIds.length} job(s) selected`}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* ✅ ADD: Bulk Notify Button */}
              {canBulkNotify && onBulkNotify && selectedJobIds.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => onBulkNotify(selectedJobIds)}
                  className="gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Bulk Notify ({selectedJobIds.length})
                </Button>
              )}
              
              {selectedJobIds.length > 0 && (
                <Badge variant="secondary">
                  {selectedJobIds.reduce((sum, id) => {
                    const job = jobs.find(j => j.id === id);
                    return sum + (job?.farm_size_acres || 0);
                  }, 0).toFixed(1)} acres selected
                </Badge>
              )}
            </div>
          </div>

          {/* Individual Jobs */}
          <div className="space-y-3">
            {jobs.map((job) => (
              <div 
                key={job.id}
                className={`p-4 border rounded-lg transition-all ${
                  selectedJobIds.includes(job.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedJobIds.includes(job.id)}
                    onCheckedChange={() => toggleJob(job.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{job.activity.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          {job.crop && (
                            <span className="flex items-center gap-1">
                              <Leaf className="h-3 w-3" />
                              {job.crop} {job.crop_variety && `- ${job.crop_variety}`}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(job.requested_date), "MMM d, yyyy")}
                          </span>
                          <span>{job.location}</span>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                        {job.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Size:</span>
                        <p className="font-semibold">{job.farm_size_acres} acres</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rate:</span>
                        <p className="font-semibold">₹{job.farmer_price_per_acre}/acre</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <p className="font-semibold text-green-600">
                          ₹{(job.farmer_price_per_acre * job.farm_size_acres).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* ✅ ADD Individual Job Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      {job.status === 'confirmed' && onSetPrice && (
                        <Button 
                          onClick={() => onSetPrice(job)}
                          variant="outline"
                          size="sm"
                        >
                          <IndianRupee className="h-3 w-3 mr-1" />
                          Set Price
                        </Button>
                      )}

                      {job.status === 'priced' && onNotifyMukadams && (
                        <Button 
                          onClick={() => onNotifyMukadams(job.id)}
                          size="sm"
                        >
                          <Bell className="h-3 w-3 mr-1" />
                          Notify Mukadams
                        </Button>
                      )}

                      {/* Show interested mukadams for this job */}
                      {job.status === 'notified' && job.interests && 
                       job.interests.filter(i => i.response_status === 'interested').length > 0 && (
                        <div className="flex gap-2 items-center text-sm">
                          <span className="text-green-600">
                            ✅ {job.interests.filter(i => i.response_status === 'interested').length} interested
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Individual interested mukadams */}
                    {job.status === 'notified' && job.interests && 
                     job.interests.filter(i => i.response_status === 'interested').length > 0 && onAssignJob && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Interested for this job:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.interests
                            .filter(i => i.response_status === 'interested')
                            .map((interest) => (
                              <Button
                                key={interest.id}
                                size="sm"
                                variant="outline"
                                onClick={() => onAssignJob(job.id, interest.mukadam.id)}
                                className="text-xs"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Assign to {interest.mukadam.name}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Common Interested Mukadams - Bulk Assignment */}
          {commonMukadams.length > 0 && selectedJobIds.length > 1 && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Mukadams interested in ALL {selectedJobIds.length} selected jobs
              </h4>
              
              <div className="space-y-2">
                {commonMukadams.map((mukadam) => (
                  <div 
                    key={mukadam.id}
                    className={`flex items-center justify-between p-3 rounded cursor-pointer transition-all ${
                      selectedMukadam === mukadam.id
                        ? 'bg-green-200 dark:bg-green-900 border-2 border-green-500'
                        : 'bg-white dark:bg-gray-800 border border-green-300 hover:border-green-500'
                    }`}
                    onClick={() => setSelectedMukadam(mukadam.id)}
                  >
                    <div>
                      <p className="font-semibold">{mukadam.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {mukadam.location} • {mukadam.team_size || mukadam.number_of_labourers} workers
                      </p>
                    </div>
                    
                    {selectedMukadam === mukadam.id && (
                      <Badge className="bg-green-600">Selected</Badge>
                    )}
                  </div>
                ))}
              </div>

              <Button
                className="w-full mt-4"
                onClick={handleBulkAssign}
                disabled={selectedJobIds.length === 0 || !selectedMukadam || isAssigning}
              >
                {isAssigning 
                  ? "Assigning..." 
                  : `Bulk Assign ${selectedJobIds.length} Job(s) to Selected Mukadam`}
              </Button>
            </div>
          )}

          {selectedJobIds.length > 1 && commonMukadams.length === 0 && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded text-sm text-orange-600">
              ⚠️ No mukadams interested in all {selectedJobIds.length} selected jobs. 
              Handle individually or wait for more responses.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}