import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  MapPin,
  Calendar,
  Users,
  Star,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PaymentCollectionDialog } from "./PaymentCollectionDialog";
import { JobCompletionDialog } from "./JobCompletionDialog";
import { ReviewDialog } from "./ReviewDialog";

export function GroundTeamDashboard() {
  const [collectingPayment, setCollectingPayment] = useState<any>(null);
  const [completingJob, setCompletingJob] = useState<any>(null);
  const [reviewingJob, setReviewingJob] = useState<any>(null);
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  // Fetch jobs in progress
  const { data: inProgressJobs = [] } = useQuery({
    queryKey: ["ground-team-in-progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings_with_details")
        .select("*")
        .eq("status", "in_progress")
        .order("requested_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch completed jobs awaiting payment
  const { data: awaitingPayment = [] } = useQuery({
    queryKey: ["ground-team-awaiting-payment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings_with_details")
        .select("*")
        .eq("status", "completed")
        .is("payment_id", null)
        .order("requested_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch paid jobs (today)
  const { data: paidToday = [] } = useQuery({
    queryKey: ["ground-team-paid-today"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("job_complete_details")
        .select("*")
        .eq("payment_date", today)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const totalCollectedToday = paidToday.reduce((sum, job) => sum + (job.balance_amount || 0), 0);

  const handleMarkInProgress = async (booking: any) => {
    const { error: jobError } = await supabase
      .from("job_assignments")
      .update({
        status: "in_progress",
        actual_start: new Date().toISOString(),
      })
      .eq("id", booking.job_assignment_id);

    if (jobError) {
      toast.error("Failed to update job status");
      return;
    }

    const { error: bookingError } = await supabase
      .from("bookings")
      .update({ status: "in_progress" })
      .eq("id", booking.id);

    if (bookingError) {
      toast.error("Failed to update booking status");
      return;
    }

    toast.success("Job marked as in progress");
    queryClient.invalidateQueries({ queryKey: ["ground-team-in-progress"] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Field Operations</h1>
        <p className="text-muted-foreground">Manage ongoing work and collect payments</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inProgressJobs.length}</div>
            <p className="text-xs text-muted-foreground">Active jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Payment</CardTitle>
            <IndianRupee className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{awaitingPayment.length}</div>
            <p className="text-xs text-muted-foreground">Ready to collect</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{(totalCollectedToday / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">{paidToday.length} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Jobs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inProgressJobs.length + awaitingPayment.length}
            </div>
            <p className="text-xs text-muted-foreground">Total scheduled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Jobs In Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              In Progress ({inProgressJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inProgressJobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No jobs in progress
                </p>
              ) : (
                inProgressJobs.map((job) => (
                  <Card key={job.id} className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{job.farmer_name}</h4>
                            <p className="text-sm text-muted-foreground">{job.activity_name}</p>
                          </div>
                          <Badge className="bg-orange-500 text-white">
                            Working
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {job.mukkadam_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.area_acres} acres
                          </div>
                        </div>

                        {job.actual_start && (
                          <p className="text-xs text-muted-foreground">
                            Started: {format(new Date(job.actual_start), "h:mm a")}
                          </p>
                        )}

                        <Button
                          onClick={() => setCompletingJob(job)}
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Completed
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Awaiting Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-green-500" />
              Awaiting Payment ({awaitingPayment.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {awaitingPayment.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending payments
                </p>
              ) : (
                awaitingPayment.map((job) => {
                  const balanceDue = (job.quoted_price || 0) - (job.advance_amount || 0);
                  return (
                    <Card key={job.id} className="border-green-200 bg-green-50 dark:bg-green-950/20">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{job.farmer_name}</h4>
                              <p className="text-sm text-muted-foreground">{job.activity_name}</p>
                            </div>
                            <Badge className="bg-green-500 text-white">
                              Ready
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(job.requested_date), "MMM d")}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.area_acres} acres
                            </div>
                          </div>

                          <div className="bg-white dark:bg-gray-900 p-2 rounded border">
                            <div className="flex justify-between text-sm font-semibold">
                              <span>Balance Due:</span>
                              <span className="text-green-600 flex items-center">
                                <IndianRupee className="h-4 w-4" />
                                {balanceDue.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>

                          <Button
                            onClick={() => setCollectingPayment(job)}
                            size="sm"
                            className="w-full"
                          >
                            <IndianRupee className="h-4 w-4 mr-2" />
                            Collect Payment
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Collections */}
      {paidToday.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Today's Collections
              </span>
              <span className="text-2xl font-bold text-green-600">
                ₹{totalCollectedToday.toLocaleString("en-IN")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {paidToday.map((job) => (
                <div key={job.booking_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{job.farmer_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {job.activity_name} • {job.payment_method}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      ₹{job.balance_amount?.toLocaleString("en-IN")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReviewingJob(job)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <PaymentCollectionDialog
        booking={collectingPayment}
        open={!!collectingPayment}
        onOpenChange={(open) => !open && setCollectingPayment(null)}
      />

      <JobCompletionDialog
        booking={completingJob}
        open={!!completingJob}
        onOpenChange={(open) => !open && setCompletingJob(null)}
      />

      <ReviewDialog
        job={reviewingJob}
        open={!!reviewingJob}
        onOpenChange={(open) => !open && setReviewingJob(null)}
      />
    </div>
  );
}