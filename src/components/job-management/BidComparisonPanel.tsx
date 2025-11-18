// Updated BidComparisonPanel.tsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [finalPrice, setFinalPrice] = useState<string>("");
  const [showFinalizationForm, setShowFinalizationForm] = useState(false);
  const queryClient = useQueryClient();

  const finalizeBidMutation = useMutation({
    mutationFn: async ({ bidId, finalPrice }: { bidId: string, finalPrice: number }) => {
      const response = await fetch(`http://127.0.0.1:8000/api/jobs/${job.id}/finalize_mukadam/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          bid_id: bidId,           // ✅ Send bid_id as expected by backend
          final_price: finalPrice  // ✅ Send final_price as expected by backend
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to finalize bid: ${errorData}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`${data.mukadam} selected at ₹${data.price}/acre!`);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setShowFinalizationForm(false);
      setSelectedBidId(null);
      setFinalPrice("");
      onStatusUpdate();
    },
    onError: (error) => {
      toast.error("Failed to finalize: " + error.message);
    },
  });

  const handleSelectBid = (bid: MukadamBid) => {
    setSelectedBidId(bid.id);
    setFinalPrice(bid.bid_price_per_acre?.toString() || "");
    setShowFinalizationForm(true);
  };

  const handleFinalize = () => {
    if (!selectedBidId || !finalPrice) {
      toast.error("Please select a bid and enter final price");
      return;
    }

    const priceNumber = parseFloat(finalPrice);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    finalizeBidMutation.mutate({
      bidId: selectedBidId,
      finalPrice: priceNumber
    });
  };

  // Sort bids by price (lowest first)
  const sortedBids = [...bids].sort((a, b) => {
    if (a.status === 'interested' && b.status !== 'interested') return -1;
    if (b.status === 'interested' && a.status !== 'interested') return 1;
    if (a.status === 'interested' && b.status === 'interested') {
      return (a.bid_price_per_acre || 0) - (b.bid_price_per_acre || 0);
    }
    return 0;
  });

  if (bids.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No bids received yet</p>
          <p className="text-sm text-muted-foreground">Mukadams will submit their bids here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bid Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Bid Comparison
            <Badge variant="outline">{bids.length} total bids</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center items-center justify-center">

            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded">
              <div className="text-2xl font-bold text-green-600">
                {bids.filter(b => b.status === 'interested').length}
              </div>
              <div className="text-xs text-muted-foreground">Interested</div>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded">
              <div className="text-2xl font-bold text-red-600">
                {bids.filter(b => b.status === 'declined').length}
              </div>
              <div className="text-xs text-muted-foreground">Declined</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
              <div className="text-2xl font-bold text-blue-600">
                ₹{Math.min(...bids.filter(b => b.bid_price_per_acre).map(b => b.bid_price_per_acre!)) || 0}
              </div>
              <div className="text-xs text-muted-foreground">Lowest Bid</div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded">
              <div className="text-2xl font-bold text-purple-600">
                ₹{job.farmer_price_per_acre}
              </div>
              <div className="text-xs text-muted-foreground">Farmer Budget</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Finalization Form */}
      {showFinalizationForm && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400">
              Finalize Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Selected Mukadam</Label>
              <p className="font-semibold">
                {bids.find(b => b.id === selectedBidId)?.mukadam.name}
              </p>
            </div>
            <div>
              <Label>Final Price (₹ per acre)</Label>
              <Input
                type="number"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                placeholder="Enter final negotiated price"
                step="50"
                min="0"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleFinalize}
                disabled={finalizeBidMutation.isPending}
                className="flex-1"
              >
                {finalizeBidMutation.isPending ? "Finalizing..." : "Finalize Selection"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowFinalizationForm(false);
                  setSelectedBidId(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bid Cards */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {sortedBids.map((bid) => {
            const savings = job.farmer_price_per_acre - (bid.bid_price_per_acre || 0);
            const savingsPercentage = ((savings / job.farmer_price_per_acre) * 100);
            const totalAmount = (bid.bid_price_per_acre || 0) * job.farm_size_acres;
            
            return (
              <Card 
  key={bid.id}
  className={cn(
    "w-full max-w-xl mx-auto transition-all cursor-pointer hover:shadow-md",
    bid.status === 'interested' ? "border-green-300" : "border-gray-200 opacity-75",
    selectedBidId === bid.id && "ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20"
  )}
  onClick={() => bid.status === 'interested' && handleSelectBid(bid)}
>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {bid.mukadam.name}
                            {bid.status === 'interested' && savings > 0 && (
                              <Award className="h-4 w-4 text-green-500" />
                            )}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {bid.mukadam.number_of_labourers} workers
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {bid.mukadam.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {bid.mukadam.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Badge className={
                        bid.status === 'interested' ? 'bg-green-500' :
                        bid.status === 'declined' ? 'bg-red-500' :
                        'bg-gray-500'
                      }>
                        {bid.status}
                      </Badge>
                    </div>

                    {bid.status === 'interested' && bid.bid_price_per_acre && (
                      <>
                        {/* Pricing */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">₹{bid.bid_price_per_acre}</div>
                            <div className="text-xs text-muted-foreground">Per Acre</div>
                          </div>
                          <div className="text-center">
                            <div className="truncate text-ellipsis max-w-[120px] mx-auto">
  ₹{totalAmount.toLocaleString()}
</div>

                            <div className="text-xs text-muted-foreground">Total Amount</div>
                          </div>
                          <div className="text-center">
                            <div className={cn(
                              "text-lg font-semibold flex items-center justify-center gap-1",
                              savings > 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {savings > 0 ? (
                                <TrendingDown className="h-4 w-4" />
                              ) : (
                                <TrendingUp className="h-4 w-4" />
                              )}
                              ₹{Math.abs(savings)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {savings > 0 ? 'Savings' : 'Premium'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className={cn(
                              "text-lg font-semibold",
                              savingsPercentage > 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {savingsPercentage > 0 ? '-' : '+'}{Math.abs(savingsPercentage).toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">vs Budget</div>
                          </div>
                        </div>

                        {/* Duration */}
                        {bid.estimated_duration_hours && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Estimated duration: {bid.estimated_duration_hours} hours</span>
                          </div>
                        )}

                        {/* Comments */}
                        {bid.comments && (
                          <div className="bg-secondary/30 p-3 rounded">
                            <p className="text-sm">{bid.comments}</p>
                          </div>
                        )}

                        {/* Action Button */}
                        {job.status === 'bidding' && (
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectBid(bid);
                            }}
                            className="w-full"
                            variant={selectedBidId === bid.id ? "default" : "outline"}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            {selectedBidId === bid.id ? "Selected" : "Select This Bid"}
                          </Button>
                        )}
                      </>
                    )}

                    {bid.status === 'declined' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">{bid.comments || "Declined to bid"}</span>
                      </div>
                    )}

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
      </ScrollArea>
    </div>
  );
}