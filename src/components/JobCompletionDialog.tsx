import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle2, Upload, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface JobCompletionDialogProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobCompletionDialog({ booking, open, onOpenChange }: JobCompletionDialogProps) {
  const [workSummary, setWorkSummary] = useState("");
  const [actualAreaCovered, setActualAreaCovered] = useState("");
  const [actualLabourers, setActualLabourers] = useState("");
  const [actualHours, setActualHours] = useState("");
  const [qualityScore, setQualityScore] = useState(5);
  const [onTime, setOnTime] = useState(true);
  const [farmerSatisfied, setFarmerSatisfied] = useState(true);
  const [hadIssues, setHadIssues] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");
  const [beforePhotos, setBeforePhotos] = useState("");
  const [afterPhotos, setAfterPhotos] = useState("");
  
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!workSummary) {
      toast.error("Please provide a work summary");
      return;
    }

    // Mark job as completed
    const { error: jobError } = await supabase
      .from("job_assignments")
      .update({
        status: "completed",
        actual_end: new Date().toISOString(),
      })
      .eq("id", booking.job_assignment_id);

    if (jobError) {
      toast.error("Failed to update job status");
      return;
    }

    const { error: bookingError } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", booking.id);

    if (bookingError) {
      toast.error("Failed to update booking status");
      return;
    }

    // Create completion history
    const { error: historyError } = await supabase
      .from("job_completion_history")
      .insert({
        booking_id: booking.id,
        job_assignment_id: booking.job_assignment_id,
        completed_at: new Date().toISOString(),
        completed_by: currentUser?.id,
        work_summary: workSummary,
        actual_area_covered: parseFloat(actualAreaCovered) || booking.area_acres,
        actual_labourers_used: parseInt(actualLabourers) || booking.number_of_labourers,
        actual_hours_worked: parseFloat(actualHours) || null,
        work_quality_score: qualityScore,
        on_time_completion: onTime,
        farmer_satisfied: farmerSatisfied,
        had_issues: hadIssues,
        issue_description: hadIssues ? issueDescription : null,
        before_work_photos: beforePhotos ? [beforePhotos] : null,
        after_work_photos: afterPhotos ? [afterPhotos] : null,
      });

    if (historyError) {
      toast.error("Failed to save completion history");
      console.error(historyError);
      return;
    }

    toast.success("Job marked as completed!");
    queryClient.invalidateQueries();
    onOpenChange(false);
    
    // Reset form
    setWorkSummary("");
    setActualAreaCovered("");
    setActualLabourers("");
    setActualHours("");
    setQualityScore(5);
    setOnTime(true);
    setFarmerSatisfied(true);
    setHadIssues(false);
    setIssueDescription("");
    setBeforePhotos("");
    setAfterPhotos("");
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Job & Record Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Summary */}
          <Card className="bg-secondary/30">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Farmer:</span>
                  <span className="font-semibold">{booking.farmer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Activity:</span>
                  <span className="font-semibold">{booking.activity_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mukadam:</span>
                  <span className="font-semibold">{booking.mukkadam_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Planned Area:</span>
                  <span className="font-semibold">{booking.area_acres} acres</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Summary */}
          <div className="space-y-2">
            <Label>Work Summary *</Label>
            <Textarea
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              placeholder="Describe the work done, conditions, any notable observations..."
              rows={4}
            />
          </div>

          {/* Actual Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Actual Area Covered (acres)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder={booking.area_acres}
                value={actualAreaCovered}
                onChange={(e) => setActualAreaCovered(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Actual Labourers Used</Label>
              <Input
                type="number"
                placeholder={booking.number_of_labourers}
                value={actualLabourers}
                onChange={(e) => setActualLabourers(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Hours Worked</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="6.5"
                value={actualHours}
                onChange={(e) => setActualHours(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Work Quality (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={qualityScore}
                onChange={(e) => setQualityScore(parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Quality Checks */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onTime"
                checked={onTime}
                onCheckedChange={(checked) => setOnTime(checked as boolean)}
              />
              <label
                htmlFor="onTime"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Work completed on time
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="farmerSatisfied"
                checked={farmerSatisfied}
                onCheckedChange={(checked) => setFarmerSatisfied(checked as boolean)}
              />
              <label
                htmlFor="farmerSatisfied"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Farmer satisfied with work
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hadIssues"
                checked={hadIssues}
                onCheckedChange={(checked) => setHadIssues(checked as boolean)}
              />
              <label
                htmlFor="hadIssues"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                There were issues/problems
              </label>
            </div>
          </div>

          {/* Issue Description (conditional) */}
          {hadIssues && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Issue Description *
              </Label>
              <Textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe the issues encountered and how they were resolved..."
                rows={3}
              />
            </div>
          )}

          {/* Photo Upload */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Before Work Photos</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Paste image URL"
                  value={beforePhotos}
                  onChange={(e) => setBeforePhotos(e.target.value)}
                  className="text-center text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>After Work Photos</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Paste image URL"
                  value={afterPhotos}
                  onChange={(e) => setAfterPhotos(e.target.value)}
                  className="text-center text-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button onClick={handleSubmit} className="w-full" size="lg">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Complete Job & Save Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}