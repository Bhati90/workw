import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, addDays, isWithinInterval } from "date-fns";
import { Calendar, MapPin, Phone, Users, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function JobSheets() {
  const { data: allocatedActivities = [], isLoading } = useQuery({
    queryKey: ["job-sheets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("allocated_activities")
        .select("*")
        .not("labour_team_id", "is", null)
        .order("scheduled_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Filter activities for the next 7 days
  const today = new Date();
  const nextWeek = addDays(today, 7);
  
  const upcomingActivities = allocatedActivities.filter((activity) => {
    const activityDate = new Date(activity.scheduled_date);
    return isWithinInterval(activityDate, { start: today, end: nextWeek });
  });

  // Group activities by labour team
  const activitiesByTeam = upcomingActivities.reduce((acc, activity) => {
    const teamId = activity.labour_team_id;
    if (!acc[teamId]) {
      acc[teamId] = {
        teamName: activity.mukkadam_name,
        numberOfLabourers: activity.number_of_labourers,
        activities: [],
      };
    }
    acc[teamId].activities.push(activity);
    return acc;
  }, {} as Record<string, { teamName: string; numberOfLabourers: number; activities: any[] }>);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Job Sheets</h1>
            <p className="text-muted-foreground">Upcoming work allocations by labour team</p>
          </div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Job Sheets</h1>
            <p className="text-muted-foreground">
              Upcoming work allocations for the next 7 days
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Calendar className="mr-2 h-4 w-4" />
            {format(today, "MMM d")} - {format(nextWeek, "MMM d, yyyy")}
          </Badge>
        </div>

        {Object.keys(activitiesByTeam).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                No upcoming allocated activities in the next 7 days
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {Object.entries(activitiesByTeam).map(([teamId, team]) => (
              <Card key={teamId} className="overflow-hidden">
                <CardHeader className="bg-gradient-farm text-primary-foreground">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {team.teamName}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      <Users className="mr-1 h-3 w-3" />
                      {team.numberOfLabourers} labourers
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {team.activities.map((activity, index) => (
                      <div key={activity.id}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="grid gap-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-semibold text-foreground flex items-center gap-2">
                                {activity.activity_name}
                                <Badge
                                  variant="outline"
                                  style={{
                                    borderColor: activity.farmer_color,
                                    color: activity.farmer_color,
                                  }}
                                >
                                  {activity.farmer_name}
                                </Badge>
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {activity.variety && `${activity.variety} • `}
                                {activity.acres} acres
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className="whitespace-nowrap"
                            >
                              <Calendar className="mr-1 h-3 w-3" />
                              {format(new Date(activity.scheduled_date), "MMM d, yyyy")}
                            </Badge>
                          </div>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground">
                              {activity.description}
                            </p>
                          )}
                          {activity.rate && (
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">
                                Rate: ₹{activity.rate}/acre
                              </Badge>
                              <Badge variant="outline" className="bg-secondary">
                                Total: ₹{(Number(activity.rate) * Number(activity.acres)).toFixed(2)}
                              </Badge>
                            </div>
                          )}
                          {activity.notes && (
                            <p className="text-sm text-muted-foreground bg-secondary/50 p-2 rounded">
                              <strong>Notes:</strong> {activity.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
