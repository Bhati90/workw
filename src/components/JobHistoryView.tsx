import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  Users, 
  IndianRupee, 
  CheckCircle2, 
  Clock,
  Star,
  MapPin,
  Phone,
  MessageSquare,
  Wrench,
  TrendingUp,
  AlertCircle,
  Image as ImageIcon
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface JobHistoryViewProps {
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobHistoryView({ bookingId, open, onOpenChange }: JobHistoryViewProps) {
  const { data: jobDetails, isLoading } = useQuery({
    queryKey: ["job-complete-details", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_complete_details")
        .select("*")
        .eq("booking_id", bookingId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId && open,
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ["job-reviews", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId && open,
  });

  const { data: whatsappMessages = [] } = useQuery({
    queryKey: ["job-whatsapp", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_notifications")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId && open,
  });

  if (!jobDetails) return null;

  const timeline = [
    {
      title: "Booking Created",
      date: jobDetails.booking_created_at,
      icon: Calendar,
      color: "bg-blue-500",
      details: [
        { label: "Requested Date", value: format(new Date(jobDetails.requested_date), "MMMM d, yyyy") },
        { label: "Area", value: `${jobDetails.area_acres} acres` },
        { label: "Quoted Price", value: `₹${jobDetails.quoted_price?.toLocaleString("en-IN")}` },
      ],
    },
    jobDetails.team_member_name && {
      title: "Team Member Assigned",
      date: jobDetails.booking_created_at,
      icon: Users,
      color: "bg-purple-500",
      details: [
        { label: "Assigned To", value: jobDetails.team_member_name },
        { label: "Contact", value: jobDetails.team_member_phone },
      ],
    },
    jobDetails.mukkadam_name && {
      title: "Mukadam Allocated",
      date: jobDetails.approved_at,
      icon: Users,
      color: "bg-green-500",
      details: [
        { label: "Mukadam", value: jobDetails.mukkadam_name },
        { label: "Team Size", value: `${jobDetails.number_of_labourers} labourers` },
        { label: "Location", value: jobDetails.mukadam_location || "N/A" },
        { label: "Approved By", value: jobDetails.approved_by_name },
      ],
    },
    jobDetails.actual_start && {
      title: "Work Started",
      date: jobDetails.actual_start,
      icon: Clock,
      color: "bg-orange-500",
      details: [
        { label: "Start Time", value: format(new Date(jobDetails.actual_start), "h:mm a") },
      ],
    },
    jobDetails.completed_at && {
      title: "Work Completed",
      date: jobDetails.completed_at,
      icon: CheckCircle2,
      color: "bg-green-500",
      details: [
        { label: "Completed At", value: format(new Date(jobDetails.completed_at), "h:mm a") },
        { label: "Duration", value: `${jobDetails.actual_hours_worked || 'N/A'} hours` },
        { label: "Area Covered", value: `${jobDetails.actual_area_covered || jobDetails.area_acres} acres` },
        { label: "Quality Score", value: `${jobDetails.work_quality_score || 'N/A'}/5` },
      ],
    },
    jobDetails.payment_date && {
      title: "Payment Collected",
      date: jobDetails.payment_date,
      icon: IndianRupee,
      color: "bg-green-600",
      details: [
        { label: "Amount", value: `₹${jobDetails.balance_amount?.toLocaleString("en-IN")}` },
        { label: "Method", value: jobDetails.payment_method },
        { label: "Collected By", value: jobDetails.collected_by_name },
      ],
    },
  ].filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Complete Job History</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Header Summary */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20">
              <CardHeader>
                <CardTitle className="text-2xl">{jobDetails.farmer_name}</CardTitle>
                <p className="text-muted-foreground">{jobDetails.activity_name}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{jobDetails.farmer_village}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{format(new Date(jobDetails.requested_date), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      jobDetails.booking_status === 'completed' ? 'bg-green-500' :
                      jobDetails.booking_status === 'in_progress' ? 'bg-orange-500' :
                      'bg-blue-500'
                    )}>
                      {jobDetails.booking_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((event: any, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn("p-2 rounded-full", event.color)}>
                          <event.icon className="h-4 w-4 text-white" />
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <h4 className="font-semibold">{event.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {format(new Date(event.date), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {event.details.map((detail: any, i: number) => (
                            <div key={i}>
                              <span className="text-muted-foreground">{detail.label}: </span>
                              <span className="font-medium">{detail.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Work Summary */}
            {jobDetails.work_summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Work Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{jobDetails.work_summary}</p>
                  {jobDetails.had_issues && (
                    <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-orange-700 dark:text-orange-400">
                            Issues Encountered
                          </p>
                          <p className="text-sm text-orange-600 dark:text-orange-300">
                            {jobDetails.issue_description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Breakdown */}
            {jobDetails.payment_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Labor Cost:</span>
                      <span className="font-semibold">₹{jobDetails.labor_cost?.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transport:</span>
                      <span className="font-semibold">₹{jobDetails.transport_cost?.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accommodation:</span>
                      <span className="font-semibold">₹{jobDetails.accommodation_cost?.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Other:</span>
                      <span className="font-semibold">₹{jobDetails.other_cost?.toLocaleString("en-IN")}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-bold">Total Paid:</span>
                      <span className="font-bold text-green-600">
                        ₹{jobDetails.balance_amount?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {allReviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Reviews & Ratings
                    </span>
                    {jobDetails.average_rating && (
                      <Badge className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {jobDetails.average_rating.toFixed(1)}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allReviews.map((review: any) => (
                      <Card key={review.id} className="bg-secondary/30">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge variant="outline" className="capitalize">
                                {review.reviewer_type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-4 w-4",
                                    i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          {review.feedback && (
                            <p className="text-sm">{review.feedback}</p>
                          )}
                          <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-muted-foreground">
                            <div>Punctuality: {review.punctuality_rating}/5</div>
                            <div>Quality: {review.quality_rating}/5</div>
                            <div>Communication: {review.communication_rating}/5</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* WhatsApp Messages */}
            {whatsappMessages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    WhatsApp Communications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {whatsappMessages.map((msg: any) => (
                      <div key={msg.id} className="border-l-4 border-green-500 pl-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="capitalize">
                            To: {msg.recipient_type}
                          </Badge>
                          <Badge className={cn(
                            msg.status === 'delivered' ? 'bg-green-500' :
                            msg.status === 'sent' ? 'bg-blue-500' :
                            msg.status === 'pending' ? 'bg-yellow-500' :
                            'bg-red-500'
                          )}>
                            {msg.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          <Phone className="h-3 w-3 inline mr-1" />
                          {msg.recipient_phone}
                        </p>
                        <p className="text-sm bg-secondary/30 p-2 rounded whitespace-pre-wrap">
                          {msg.message.substring(0, 200)}
                          {msg.message.length > 200 && '...'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(msg.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Photos */}
            {(jobDetails.before_work_photos || jobDetails.after_work_photos) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Work Photos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {jobDetails.before_work_photos && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Before</h4>
                        <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    {jobDetails.after_work_photos && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">After</h4>
                        <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}