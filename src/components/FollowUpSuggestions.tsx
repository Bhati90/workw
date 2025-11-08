import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Calendar, 
  Phone, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight
} from "lucide-react";
import { format, differenceInDays, isPast, isFuture } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CreateBookingDialog } from "./CreateBookingDialog";

export function FollowUpSuggestions() {
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["follow-up-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suggested_activities")
        .select("*")
        .order("suggested_date", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Group suggestions by urgency
  const overdue = suggestions.filter(s => s.suggested_date && isPast(new Date(s.suggested_date)));
  const upcomingThisWeek = suggestions.filter(s => {
    if (!s.suggested_date) return false;
    const days = differenceInDays(new Date(s.suggested_date), new Date());
    return days >= 0 && days <= 7;
  });
  const upcomingLater = suggestions.filter(s => {
    if (!s.suggested_date) return false;
    const days = differenceInDays(new Date(s.suggested_date), new Date());
    return days > 7;
  });

  const handleCallFarmer = (suggestion: any) => {
    // In production, this could trigger a call or open phone dialer
    toast.info(`Calling ${suggestion.farmer_name}...`);
    window.open(`tel:${suggestion.farmer_phone}`);
  };

  const handleBookNow = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
  };

  const getUrgencyColor = (suggestedDate: string) => {
    if (!suggestedDate) return "bg-gray-500";
    const days = differenceInDays(new Date(suggestedDate), new Date());
    if (days < 0) return "bg-red-500"; // Overdue
    if (days <= 3) return "bg-orange-500"; // Very soon
    if (days <= 7) return "bg-yellow-500"; // This week
    return "bg-green-500"; // Future
  };

  const SuggestionCard = ({ suggestion, showUrgency = false }: any) => {
    const daysUntil = suggestion.suggested_date 
      ? differenceInDays(new Date(suggestion.suggested_date), new Date())
      : null;

    return (
      <Card className={cn(
        "hover:shadow-md transition-shadow",
        showUrgency && daysUntil !== null && daysUntil < 0 && "border-red-300 bg-red-50 dark:bg-red-950/20"
      )}>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-lg">{suggestion.farmer_name}</h4>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {suggestion.farmer_phone}
                </p>
              </div>
              {daysUntil !== null && (
                <Badge className={cn(getUrgencyColor(suggestion.suggested_date), "text-white")}>
                  {daysUntil < 0 
                    ? `${Math.abs(daysUntil)} days overdue!` 
                    : daysUntil === 0
                    ? "Today"
                    : `${daysUntil} days`}
                </Badge>
              )}
            </div>

            {/* Activity Flow */}
            <div className="flex items-center gap-2 text-sm bg-secondary/30 p-3 rounded-lg">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Last Activity</div>
                <div className="font-semibold">{suggestion.last_activity_name}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(suggestion.last_activity_date), "MMM d, yyyy")}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Suggested Next</div>
                <div className="font-semibold text-primary">{suggestion.suggested_activity_name}</div>
                <div className="text-xs text-muted-foreground">
                  {suggestion.suggested_date && format(new Date(suggestion.suggested_date), "MMM d, yyyy")}
                </div>
              </div>
            </div>

            {/* Schedule Info */}
            <div className="text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 inline mr-1" />
              Day {suggestion.last_activity_day} → Day {suggestion.suggested_activity_day} after pruning
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCallFarmer(suggestion)}
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Farmer
              </Button>
              <Button
                size="sm"
                onClick={() => handleBookNow(suggestion)}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Book Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading suggestions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Smart Follow-up Suggestions
        </h2>
        <p className="text-muted-foreground">
          Proactive booking opportunities based on completed activities
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Badge className="bg-red-500 text-white">{overdue.length}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Should have been booked already</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Badge className="bg-yellow-500 text-white">{upcomingThisWeek.length}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Call farmers soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Future</CardTitle>
            <Badge className="bg-green-500 text-white">{upcomingLater.length}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Plan ahead</p>
          </CardContent>
        </Card>
      </div>

      {/* No Suggestions */}
      {suggestions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">
              No follow-up activities needed at this time.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Overdue - URGENT */}
      {overdue.length > 0 && (
        <Card className="border-red-300">
          <CardHeader className="bg-red-50 dark:bg-red-950/20">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-400">
              <Clock className="h-5 w-5" />
              🚨 Overdue - Call Immediately ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              {overdue.map((suggestion) => (
                <SuggestionCard key={suggestion.last_booking_id} suggestion={suggestion} showUrgency />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* This Week */}
      {upcomingThisWeek.length > 0 && (
        <Card className="border-yellow-300">
          <CardHeader className="bg-yellow-50 dark:bg-yellow-950/20">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <Calendar className="h-5 w-5" />
              📅 This Week - Priority Calls ({upcomingThisWeek.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              {upcomingThisWeek.map((suggestion) => (
                <SuggestionCard key={suggestion.last_booking_id} suggestion={suggestion} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Future */}
      {upcomingLater.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              📊 Upcoming Opportunities ({upcomingLater.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {upcomingLater.slice(0, 10).map((suggestion) => (
                <SuggestionCard key={suggestion.last_booking_id} suggestion={suggestion} />
              ))}
            </div>
            {upcomingLater.length > 10 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                And {upcomingLater.length - 10} more...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Booking Dialog */}
      {selectedSuggestion && (
        <CreateBookingDialog
          open={!!selectedSuggestion}
          onOpenChange={(open) => !open && setSelectedSuggestion(null)}
          prefilledData={{
            farmerId: selectedSuggestion.farmer_id,
            farmerName: selectedSuggestion.farmer_name,
            activityTypeId: selectedSuggestion.suggested_activity_id,
            activityName: selectedSuggestion.suggested_activity_name,
            requestedDate: selectedSuggestion.suggested_date,
          }}
        />
      )}
    </div>
  );
}