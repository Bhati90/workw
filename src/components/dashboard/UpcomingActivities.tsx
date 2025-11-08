import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, User, MapPin, Users, CheckCircle2 } from "lucide-react";

interface Activity {
  plot_id: string;
  farmer_id?: string;
  farmer_name: string;
  farmer_color: string;
  acres: number;
  variety: string;
  activity_name: string;
  activity_type_id: string;
  scheduled_date: string;
  days_after_pruning?: number;
  description: string;
  labour_team_id?: string;
  mukkadam_name?: string;
  status?: string;
}

interface UpcomingActivitiesProps {
  activities: Activity[];
}

export function UpcomingActivities({ activities }: UpcomingActivitiesProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  return (
    <>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">Upcoming Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming activities</p>
            ) : (
              activities.slice(0, 8).map((activity, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedActivity(activity)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left relative"
                >
                  {activity.labour_team_id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                  <div className="mt-1">
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: activity.farmer_color }}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between pr-6">
                      <h4 className="text-sm font-semibold text-foreground">{activity.activity_name}</h4>
                      {activity.days_after_pruning && (
                        <Badge variant="outline" className="text-xs">
                          Day {activity.days_after_pruning}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(activity.scheduled_date), "MMM d, yyyy")}
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
                    {activity.labour_team_id && activity.mukkadam_name && (
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Users className="h-3 w-3" />
                        {activity.mukkadam_name}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: selectedActivity.farmer_color }}
                />
                <h3 className="text-lg font-semibold">{selectedActivity.activity_name}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Farmer:</span>
                  <span className="font-medium">{selectedActivity.farmer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scheduled Date:</span>
                  <span className="font-medium">{format(new Date(selectedActivity.scheduled_date), "MMMM d, yyyy")}</span>
                </div>
                {selectedActivity.days_after_pruning && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Days After Pruning:</span>
                    <span className="font-medium">Day {selectedActivity.days_after_pruning}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plot Size:</span>
                  <span className="font-medium">{selectedActivity.acres} acres</span>
                </div>
                {selectedActivity.variety && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variety:</span>
                    <span className="font-medium">{selectedActivity.variety}</span>
                  </div>
                )}
                {selectedActivity.description && (
                  <div className="pt-2">
                    <span className="text-muted-foreground">Description:</span>
                    <p className="mt-1 text-foreground">{selectedActivity.description}</p>
                  </div>
                )}
                {selectedActivity.labour_team_id && selectedActivity.mukkadam_name && (
                  <div className="pt-2 flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 p-2 rounded">
                    <CheckCircle2 className="h-4 w-4" />
                    <div>
                      <span className="font-medium">Allocated to: {selectedActivity.mukkadam_name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
