import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

interface ReviewDialogProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewDialog({ job, open, onOpenChange }: ReviewDialogProps) {
  const [overallRating, setOverallRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!job || !currentUser) return;

    // Determine reviewee based on role
    let revieweeId = job.mukadam_id;
    let revieweeType = 'mukadam';

    const { error } = await supabase.from("reviews").insert({
      booking_id: job.booking_id,
      job_assignment_id: job.job_assignment_id,
      reviewer_id: currentUser.id,
      reviewer_type: currentUser.role,
      reviewee_id: revieweeId,
      reviewee_type: revieweeType,
      rating: overallRating,
      feedback: feedback || null,
      punctuality_rating: punctualityRating,
      quality_rating: qualityRating,
      communication_rating: communicationRating,
    });

    if (error) {
      toast.error("Failed to submit review");
      console.error(error);
      return;
    }

    toast.success("Review submitted successfully!");
    queryClient.invalidateQueries();
    onOpenChange(false);
    
    // Reset form
    setOverallRating(5);
    setPunctualityRating(5);
    setQualityRating(5);
    setCommunicationRating(5);
    setFeedback("");
  };

  const RatingSelector = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={cn(
              "transition-all hover:scale-110",
              value >= rating ? "text-yellow-500" : "text-gray-300"
            )}
          >
            <Star className="h-8 w-8 fill-current" />
          </button>
        ))}
        <span className="ml-2 text-lg font-semibold">{value}/5</span>
      </div>
    </div>
  );

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Job Performance</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Summary */}
          <Card className="bg-secondary/30">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Farmer:</span>
                  <span className="font-semibold">{job.farmer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Activity:</span>
                  <span className="font-semibold">{job.activity_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mukadam:</span>
                  <span className="font-semibold">{job.mukkadam_name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Rating */}
          <RatingSelector
            label="Overall Performance"
            value={overallRating}
            onChange={setOverallRating}
          />

          {/* Specific Ratings */}
          <div className="grid gap-4">
            <RatingSelector
              label="Punctuality"
              value={punctualityRating}
              onChange={setPunctualityRating}
            />
            <RatingSelector
              label="Work Quality"
              value={qualityRating}
              onChange={setQualityRating}
            />
            <RatingSelector
              label="Communication"
              value={communicationRating}
              onChange={setCommunicationRating}
            />
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label>Additional Feedback (Optional)</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience, observations, or suggestions..."
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <Button onClick={handleSubmit} className="w-full" size="lg">
            <Send className="h-5 w-5 mr-2" />
            Submit Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}