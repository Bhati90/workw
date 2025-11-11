// Create BidHistoryDialog.tsx
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Users, MapPin, Phone, TrendingUp, TrendingDown, 
  Trophy, Target, Clock, IndianRupee
} from "lucide-react";

interface BidHistoryDialogProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BidHistoryDialog({ jobId, open, onOpenChange }: BidHistoryDialogProps) {
  const { data: bidDetails } = useQuery({
    queryKey: ["job-bid-details", jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const response = await fetch(`https://workw-mu.vercel.app/api/jobs/${jobId}/bid_details/`);
      if (!response.ok) throw new Error("Failed to fetch bid details");
      return response.json();
    },
    enabled: !!jobId && open,
  });

  if (!bidDetails) return null;

  const { job, bid_summary, bids } = bidDetails;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[95vh] overflow-y-auto">

        <DialogHeader>
          <DialogTitle>Complete Bid History - {job.farmer_name}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {job.activity} • {job.farm_size_acres} acres • ₹{job.farmer_price_per_acre}/acre budget
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Bid Summary */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Bid Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                  <div className="text-2xl font-bold text-blue-600">{bid_summary.total_bids}</div>
                  <div className="text-xs text-muted-foreground">Total Bids</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded">
                  <div className="text-2xl font-bold text-green-600">{bid_summary.interested_bids}</div>
                  <div className="text-xs text-muted-foreground">Interested</div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                  <div className="text-2xl font-bold text-yellow-600">{bid_summary.selected_bid}</div>
                  <div className="text-xs text-muted-foreground">Selected</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded">
                  <div className="text-2xl font-bold text-red-600">{bid_summary.declined_bids}</div>
                  <div className="text-xs text-muted-foreground">Declined</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium">Job Status: 
                  <Badge className="ml-2">{job.status}</Badge>
                </div>
                {job.finalized_mukadam && (
                  <div className="text-sm">
                    <span className="font-medium">Selected:</span> {job.finalized_mukadam}
                    <br />
                    <span className="font-medium">Final Price:</span> ₹{job.finalized_price}/acre
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Bid List */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">All Bids & Mukadam Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {bids.map((bidData) => {
                    const { mukadam, bid, performance, comparison } = bidData;
                    
                    return (
                      <Card key={bidData.id} className={`${
                        bid.status === 'selected' ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20' :
                        bid.status === 'interested' ? 'border-blue-300' :
                        bid.status === 'declined' ? 'border-gray-300 opacity-75' :
                        'border-red-300 opacity-50'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div>
                                <h4 className="font-semibold flex items-center gap-2">
                                  {mukadam.name}
                                  {bid.status === 'selected' && <Trophy className="h-4 w-4 text-yellow-500" />}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {mukadam.labourers} workers
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {mukadam.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {mukadam.phone}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <Badge className={
                              bid.status === 'selected' ? 'bg-green-500' :
                              bid.status === 'interested' ? 'bg-blue-500' :
                              bid.status === 'declined' ? 'bg-gray-500' :
                              'bg-red-500'
                            }>
                              {bid.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Bid Details */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Bid Details</h5>
                              {bid.bid_price_per_acre ? (
                                <>
                                  <div className="text-lg font-bold">₹{bid.bid_price_per_acre}/acre</div>
                                  <div className="text-sm text-muted-foreground">
                                    Total: ₹{comparison?.total_cost?.toLocaleString()}
                                  </div>
                                  <div className="text-xs">
                                    {comparison?.vs_farmer_price?.is_saving ? (
                                      <span className="text-green-600 flex items-center gap-1">
                                        <TrendingDown className="h-3 w-3" />
                                        {comparison.vs_farmer_price.percentage}% saving
                                      </span>
                                    ) : (
                                      <span className="text-red-600 flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        {Math.abs(comparison.vs_farmer_price.percentage)}% premium
                                      </span>
                                    )}
                                  </div>
                                  {bid.estimated_duration_hours && (
                                    <div className="text-sm flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {bid.estimated_duration_hours}h estimated
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-sm text-muted-foreground">No bid submitted</div>
                              )}
                            </div>

                            {/* Performance Stats */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Performance History</h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Success Rate:</span>
                                  <span className="font-medium">{performance.success_rate}%</span>
                                </div>
                                <Progress value={performance.success_rate} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{performance.won_bids} won</span>
                                  <span>{performance.total_bids} total bids</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Avg Rate:</span>
                                  <span className="font-medium">₹{performance.avg_bid_price}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Recent: {performance.recent_performance.recent_success_rate}% 
                                  ({performance.recent_performance.recent_wins}/{performance.recent_performance.last_10_bids})
                                </div>
                              </div>
                            </div>

                            {/* Comments */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Comments</h5>
                              <p className="text-sm text-muted-foreground">
                                {bid.comments || "No comments provided"}
                              </p>
                              {bid.responded_at && (
                                <div className="text-xs text-muted-foreground">
                                  Responded: {new Date(bid.responded_at).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}