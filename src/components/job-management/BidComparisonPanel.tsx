import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Users, 
  MapPin, 
  IndianRupee, 
  Clock, 
  CheckCircle2,
  Phone,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  Award,
  XCircle
} from "lucide-react";
import { Job, MukadamBid } from "@/types/job";
import { cn } from "@/lib/utils";

interface BidComparisonPanelProps {
  job: Job;
  bids: MukadamBid[];
  onStatusUpdate: () => void;
}

export function BidComparisonPanel({ job, bids, onStatusUpdate }: BidComparisonPanelProps) {
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const finalizeBidMutation = useMutation({
    mutationFn: async (bidId: string) => {
      const response = await fetch(`https://workcrop.onrender.com/api/jobs/${job.id}/finalize_mukadam/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bid_id: bidId }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to finalize bid");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success("Mukadam finalized successfully!");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onStatusUpdate();
    },
    onError: (error) => {
      toast.error("Failed to finalize: " + error.message);
    },
  });

  // Separate bids by status
  const interestedBids = bids.filter(b => b.status === 'interested').sort((a, b) => 
    (a.bid_price_per_acre || 0) - (b.bid_price_per_acre || 0)
  );
  const declinedBids = bids.filter(b => b.status === 'declined');
  const pendingBids = bids.filter(b => b.status === 'pending');

  // Calculate savings compared to farmer's price
  const calculateSavings = (bidPrice?: number) => {
    if (!bidPrice) return 0;
    return (job.farmer_price_per_acre - bidPrice) * job.farm_size_acres;
  };

  const getBidRank = (bid: MukadamBid) => {
    const sortedBids = interestedBids.sort((a, b) => 
      (a.bid_price_per_acre || 0) - (b.bid_price_per_acre || 0)
    );
    return sortedBids.findIndex(b => b.id === bid.id) + 1;
  };

  const handleFinalizeBid = (bidId: string) => {
    setSelectedBidId(bidId);
    finalizeBidMutation.mutate(bidId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Compare Bids</span>
          <Badge className="bg-orange-500 text-white">
            {interestedBids.length} Bids
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Job Summary */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Farmer's Price:</span>
                  <span className="font-semibold">₹{job.farmer_price_per_acre}/acre</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Value:</span>
                  <span className="font-semibold">
                    ₹{(job.farmer_price_per_acre * job.farm_size_acres).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Farm Size:</span>
                  <span className="font-semibold">{job.farm_size_acres} acres</span>
                </div>
              </div>
            </div>

            {/* Bid Summary Stats */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded">
                <div className="font-semibold text-green-600">{interestedBids.length}</div>
                <div className="text-muted-foreground">Interested</div>
              </div>
              <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
                <div className="font-semibold text-orange-600">{pendingBids.length}</div>
                <div className="text-muted-foreground">Pending</div>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded">
                <div className="font-semibold text-red-600">{declinedBids.length}</div>
                <div className="text-muted-foreground">Declined</div>
              </div>
            </div>

            {/* Interested Bids */}
            {interestedBids.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-green-600">
                  💰 Interested Bids ({interestedBids.length})
                </h4>
                
                {interestedBids.map((bid) => {
                  const savings = calculateSavings(bid.bid_price_per_acre);
                  const totalCost = (bid.bid_price_per_acre || 0) * job.farm_size_acres;
                  const rank = getBidRank(bid);
                  const isLowest = rank === 1;
                  
                  return (
                    <Card 
                      key={bid.id}
                      className={cn(
                        "transition-all hover:shadow-md",
                        isLowest && "border-green-500 bg-green-50 dark:bg-green-950/20",
                        selectedBidId === bid.id && "ring-2 ring-primary"
                      )}
                    >
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          {/* Header with ranking */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div>
                                <h5 className="font-semibold">{bid.mukadam.name}</h5>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  {bid.mukadam.number_of_labourers} labourers
                                </div>
                              </div>
                              {isLowest && (
                                <Badge className="bg-yellow-500 text-white">
                                  <Award className="h-3 w-3 mr-1" />
                                  Lowest
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">
                                ₹{bid.bid_price_per_acre}/acre
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Rank #{rank}
                              </div>
                            </div>
                          </div>

                          {/* Financial breakdown */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Cost:</span>
                                <span className="font-medium">₹{totalCost.toLocaleString("en-IN")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">vs Farmer Price:</span>
                                <span className={cn(
                                  "font-medium flex items-center gap-1",
                                  savings > 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {savings > 0 ? (
                                    <>
                                      <TrendingDown className="h-3 w-3" />
                                      Save ₹{Math.abs(savings).toLocaleString("en-IN")}
                                    </>
                                  ) : (
                                    <>
                                      <TrendingUp className="h-3 w-3" />
                                      +₹{Math.abs(savings).toLocaleString("en-IN")}
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Location:</span>
                                <span className="font-medium">{bid.mukadam.location}</span>
                              </div>
                              {bid.estimated_duration_hours && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Est. Hours:</span>
                                  <span className="font-medium">{bid.estimated_duration_hours}h</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Contact info */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {bid.mukadam.phone}
                          </div>

                          {/* Comments */}
                          {bid.comments && (
                            <div className="p-2 bg-secondary/30 rounded text-xs">
                              <div className="flex items-start gap-1">
                                <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />
                                <span>{bid.comments}</span>
                              </div>
                            </div>
                          )}

                          {/* Action Button */}
                          <Button
                            onClick={() => handleFinalizeBid(bid.id)}
                            disabled={finalizeBidMutation.isPending && selectedBidId === bid.id}
                            className={cn(
                              "w-full",
                              isLowest ? "bg-green-600 hover:bg-green-700" : ""
                            )}
                          >
                            {finalizeBidMutation.isPending && selectedBidId === bid.id ? (
                              "Finalizing..."
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Select This Bid
                              </>
                            )}
                          </Button>

                          {/* Responded time */}
                          {bid.responded_at && (
                            <div className="text-xs text-muted-foreground">
                              Responded: {new Date(bid.responded_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pending Responses */}
            {pendingBids.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-600">
                  ⏳ Pending Responses ({pendingBids.length})
                </h4>
                
                {pendingBids.map((bid) => (
                  <Card key={bid.id} className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold">{bid.mukadam.name}</h5>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {bid.mukadam.number_of_labourers} labourers
                            <MapPin className="h-3 w-3" />
                            {bid.mukadam.location}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Waiting
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Notified at {new Date().toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Declined Bids */}
            {declinedBids.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-red-600">
                  ❌ Declined ({declinedBids.length})
                </h4>
                
                {declinedBids.map((bid) => (
                  <Card key={bid.id} className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold text-red-700">{bid.mukadam.name}</h5>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {bid.mukadam.number_of_labourers} labourers
                            <MapPin className="h-3 w-3" />
                            {bid.mukadam.location}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-red-600 border-red-300">
                            <XCircle className="h-3 w-3 mr-1" />
                            Declined
                          </Badge>
                        </div>
                      </div>
                      
                      {bid.comments && (
                        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded text-xs">
                          <span className="text-red-700 dark:text-red-400">{bid.comments}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* No Bids Yet */}
            {interestedBids.length === 0 && pendingBids.length === 0 && declinedBids.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Waiting for mukadams to respond...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}