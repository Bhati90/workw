import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Phone,
  IndianRupee,
  Send,
  XCircle
} from "lucide-react";
import { Job } from "@/types/job";

interface JobBiddingInterfaceProps {
  job: Job;
  mukadamId: string;
}

export function JobBiddingInterface({ job, mukadamId }: JobBiddingInterfaceProps) {
  const [bidPrice, setBidPrice] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [comments, setComments] = useState("");
  const [bidStatus, setBidStatus] = useState<"interested" | "declined" | null>(null);

  const submitBidMutation = useMutation({
    mutationFn: async (bidData: any) => {
      const response = await fetch("/api/bids/submit_bid/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bidData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit bid");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (bidStatus === "interested") {
        toast.success("Bid submitted successfully!");
      } else {
        toast.success("Job declined successfully.");
      }
    },
    onError: (error) => {
      toast.error("Failed to submit response: " + error.message);
    },
  });

  const handleInterested = () => {
    if (!bidPrice || parseFloat(bidPrice) <= 0) {
      toast.error("Please enter a valid bid price");
      return;
    }

    const bidData = {
      job: job.id,
      mukadam: mukadamId,
      bid_price_per_acre: parseFloat(bidPrice),
      estimated_duration_hours: estimatedHours ? parseInt(estimatedHours) : null,
      comments: comments,
    };

    setBidStatus("interested");
    submitBidMutation.mutate(bidData);
  };

  const handleDecline = () => {
    const bidData = {
      job: job.id,
      mukadam: mukadamId,
      status: "declined",
      comments: comments || "Not available for this job",
    };

    setBidStatus("declined");
    submitBidMutation.mutate(bidData);
  };

  const totalEarnings = bidPrice ? (parseFloat(bidPrice) * job.farm_size_acres) : 0;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>New Job Opportunity</span>
          <Badge className="bg-blue-500">Bidding</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Job Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Farmer:</span>
                  <p className="font-semibold">{job.farmer.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Contact:</span>
                  <p className="font-semibold">{job.farmer.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Location:</span>
                  <p className="font-semibold">{job.location}, {job.farmer.village}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <p className="font-semibold">
                    {new Date(job.requested_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Time:</span>
                  <p className="font-semibold">{job.requested_time}</p>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">Work:</span>
                <p className="font-semibold">{job.activity.name}</p>
                <p className="text-sm text-muted-foreground">{job.farm_size_acres} acres</p>
              </div>
            </div>
          </div>

          {job.notes && (
            <div className="p-3 bg-secondary/30 rounded-lg">
              <span className="text-sm font-medium">Special Instructions:</span>
              <p className="text-sm mt-1">{job.notes}</p>
            </div>
          )}
        </div>

        {/* Bidding Form */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="text-lg font-semibold">Your Response</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Your Price (₹ per acre) *</Label>
              <Input
                type="number"
                step="50"
                value={bidPrice}
                onChange={(e) => setBidPrice(e.target.value)}
                placeholder="0"
              />
              {bidPrice && (
                <p className="text-sm text-green-600">
                  Total earnings: ₹{totalEarnings.toLocaleString("en-IN")}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Estimated Hours</Label>
              <Input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="e.g., 8"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Comments (Optional)</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any special requirements, team capabilities, or notes..."
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={submitBidMutation.isPending}
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Not Available
          </Button>
          
          <Button
            onClick={handleInterested}
            disabled={submitBidMutation.isPending}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {submitBidMutation.isPending ? "Submitting..." : "Submit Bid"}
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded">
          <p>
            📝 <strong>Note:</strong> This is a bidding process. Submit your best competitive price. 
            You'll be notified if your bid is selected.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}