import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { ActivityCalendar } from "@/components/dashboard/ActivityCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Search, Calendar as CalendarIcon, User, MapPin } from "lucide-react";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");

  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("scheduled_activities").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const filteredActivities = activities.filter(
    (activity) =>
      activity.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.activity_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activitiesThisMonth = filteredActivities.filter((activity) => {
    const date = parseISO(activity.scheduled_date);
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Activity Calendar</h2>
          <p className="text-muted-foreground mt-1">View all scheduled activities across all plots</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by farmer or activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="outline" className="gap-1">
            <CalendarIcon className="h-3 w-3" />
            {activitiesThisMonth.length} activities this month
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityCalendar activities={filteredActivities} currentDate={currentDate} onDateChange={setCurrentDate} />
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl">Activity Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activitiesThisMonth.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No activities this month</p>
                ) : (
                  activitiesThisMonth
                    .sort((a, b) => parseISO(a.scheduled_date).getTime() - parseISO(b.scheduled_date).getTime())
                    .slice(0, 10)
                    .map((activity, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-semibold text-foreground">{activity.activity_name}</h4>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(parseISO(activity.scheduled_date), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {activity.farmer_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {activity.acres} acres
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
