import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface Activity {
  id?: string;
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
  labour_team_id?: string;
  mukkadam_name?: string;
  status?: string;
}

interface ActivityCalendarProps {
  activities: Activity[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function ActivityCalendar({ activities, currentDate, onDateChange }: ActivityCalendarProps) {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [allocatingActivity, setAllocatingActivity] = useState<Activity | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [newDate, setNewDate] = useState("");
  const queryClient = useQueryClient();

  const { data: labourTeams = [] } = useQuery({
    queryKey: ["labour-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labour_teams")
        .select("*, team_activity_rates(activity_type_id, rate)")
        .order("mukkadam_name");
      if (error) throw error;
      return data || [];
    },
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const activitiesByDate = useMemo(() => {
    const map = new Map<string, Activity[]>();
    activities.forEach((activity) => {
      const dateKey = activity.scheduled_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(activity);
    });
    return map;
  }, [activities]);

  const previousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const nextMonth = () => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + 1);
    onDateChange(date);
  };

  const handleActivityClick = (activity: Activity, action: 'reschedule' | 'allocate') => {
    if (action === 'reschedule') {
      setEditingActivity(activity);
      setNewDate(activity.scheduled_date);
    } else {
      setAllocatingActivity(activity);
      setSelectedTeamId(activity.labour_team_id || "");
    }
  };

  const handleAllocateTeam = async () => {
    if (!allocatingActivity) return;

    const teamId = selectedTeamId === "none" ? null : selectedTeamId;

    // First, check if an allocation record exists
    const { data: existingAllocation } = await supabase
      .from("activity_allocations")
      .select("id")
      .eq("plot_id", allocatingActivity.plot_id)
      .eq("activity_type_id", allocatingActivity.activity_type_id)
      .eq("scheduled_date", allocatingActivity.scheduled_date)
      .maybeSingle();

    if (existingAllocation) {
      // Update existing allocation
      const { error } = await supabase
        .from("activity_allocations")
        .update({
          labour_team_id: teamId,
          status: teamId ? "allocated" : "pending",
        })
        .eq("id", existingAllocation.id);

      if (error) {
        toast.error("Failed to allocate team");
        return;
      }
    } else {
      // Create new allocation
      const { error } = await supabase
        .from("activity_allocations")
        .insert({
          plot_id: allocatingActivity.plot_id,
          activity_type_id: allocatingActivity.activity_type_id,
          scheduled_date: allocatingActivity.scheduled_date,
          labour_team_id: teamId,
          status: teamId ? "allocated" : "pending",
        });

      if (error) {
        toast.error("Failed to allocate team");
        return;
      }
    }

    toast.success(teamId ? "Team allocated successfully" : "Team removed successfully");
    setAllocatingActivity(null);
    setSelectedTeamId("");
    queryClient.invalidateQueries({ queryKey: ["activities"] });
  };

  const handleDateChange = async () => {
    if (!editingActivity || !newDate) return;

    // Calculate new days_after_pruning based on the new date
    const { data: plot } = await supabase
      .from("plots")
      .select("pruning_date")
      .eq("id", editingActivity.plot_id)
      .single();

    if (!plot) {
      toast.error("Failed to update activity");
      return;
    }

    const pruningDate = new Date(plot.pruning_date);
    const scheduledDate = new Date(newDate);
    const daysDiff = Math.floor((scheduledDate.getTime() - pruningDate.getTime()) / (1000 * 60 * 60 * 24));

    // Update the activity_type days_after_pruning for this specific plot
    // Since we can't modify the view directly, we need to update the underlying data
    // This requires updating the pruning_date to match the new schedule
    const newPruningDate = new Date(scheduledDate);
    newPruningDate.setDate(newPruningDate.getDate() - editingActivity.days_after_pruning);

    const { error } = await supabase
      .from("plots")
      .update({ pruning_date: format(newPruningDate, "yyyy-MM-dd") })
      .eq("id", editingActivity.plot_id);

    if (error) {
      toast.error("Failed to reschedule activity");
      return;
    }

    toast.success("Activity rescheduled successfully");
    setEditingActivity(null);
    queryClient.invalidateQueries({ queryKey: ["activities"] });
  };

  // Group activities by date and calculate total acres per activity
  const activityAcresByDate = useMemo(() => {
    const map = new Map<string, Map<string, { total: number; activities: Activity[] }>>();
    activities.forEach((activity) => {
      const dateKey = activity.scheduled_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, new Map());
      }
      const dateMap = map.get(dateKey)!;
      if (!dateMap.has(activity.activity_name)) {
        dateMap.set(activity.activity_name, { total: 0, activities: [] });
      }
      const activityData = dateMap.get(activity.activity_name)!;
      activityData.total += activity.acres;
      activityData.activities.push(activity);
    });
    return map;
  }, [activities]);

  return (
    <>
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Activity Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {days.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayActivityAcres = activityAcresByDate.get(dateKey);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "min-h-[120px] rounded-lg border p-2",
                    isCurrentMonth ? "bg-card border-border" : "bg-muted/30 border-muted",
                    isToday && "ring-2 ring-primary"
                  )}
                >
                  <div className={cn("text-sm font-medium mb-1", isCurrentMonth ? "text-foreground" : "text-muted-foreground")}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayActivityAcres && Array.from(dayActivityAcres.entries()).map(([activityName, data], idx) => {
                      const allAllocated = data.activities.every(a => a.labour_team_id);
                      const someAllocated = data.activities.some(a => a.labour_team_id);
                      
                      return (
                        <Popover key={idx}>
                          <PopoverTrigger asChild>
                            <button className="w-full">
                              <div className="space-y-0.5">
                                <div className="flex flex-wrap gap-0.5 mb-0.5">
                                  {data.activities.map((activity, i) => (
                                    <div
                                      key={i}
                                      className={cn(
                                        "h-1.5 rounded-sm transition-opacity hover:opacity-70",
                                        activity.labour_team_id && "ring-1 ring-green-500"
                                      )}
                                      style={{ 
                                        backgroundColor: activity.farmer_color,
                                        width: `${(activity.acres / data.total) * 100}%`
                                      }}
                                      title={`${activity.farmer_name} - ${activity.acres} acres${activity.labour_team_id ? ' (Allocated)' : ''}`}
                                    />
                                  ))}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-between text-[10px] px-1 py-0 h-5",
                                    allAllocated && "bg-green-500/10 border-green-500/50",
                                    someAllocated && !allAllocated && "bg-yellow-500/10 border-yellow-500/50"
                                  )}
                                >
                                  <span className="truncate flex items-center gap-1">
                                    {allAllocated && <CheckCircle2 className="h-2.5 w-2.5 text-green-600" />}
                                    {activityName}
                                  </span>
                                  <span className="font-semibold ml-1">{data.total}ac</span>
                                </Badge>
                              </div>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80" align="start">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm">{activityName}</h4>
                              {data.activities.map((activity, i) => (
                                <div key={i} className="border rounded-lg p-2 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activity.farmer_color }} />
                                    <span className="text-sm font-medium">{activity.farmer_name}</span>
                                    <span className="text-xs text-muted-foreground ml-auto">{activity.acres} acres</span>
                                  </div>
                                  {activity.labour_team_id && (
                                    <div className="flex items-center gap-1 text-xs text-green-600">
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span>Allocated to {activity.mukkadam_name}</span>
                                    </div>
                                  )}
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7 flex-1"
                                      onClick={() => handleActivityClick(activity, 'allocate')}
                                    >
                                      <Users className="h-3 w-3 mr-1" />
                                      {activity.labour_team_id ? 'Change Team' : 'Allocate Team'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs h-7"
                                      onClick={() => handleActivityClick(activity, 'reschedule')}
                                    >
                                      Reschedule
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Activity</DialogTitle>
          </DialogHeader>
          {editingActivity && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm"><span className="font-semibold">Activity:</span> {editingActivity.activity_name}</p>
                <p className="text-sm"><span className="font-semibold">Farmer:</span> {editingActivity.farmer_name}</p>
                <p className="text-sm"><span className="font-semibold">Plot Size:</span> {editingActivity.acres} acres</p>
                {editingActivity.variety && (
                  <p className="text-sm"><span className="font-semibold">Variety:</span> {editingActivity.variety}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newDate">New Date</Label>
                <Input
                  id="newDate"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <Button onClick={handleDateChange} className="w-full">Update Schedule</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!allocatingActivity} onOpenChange={(open) => !open && setAllocatingActivity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Labour Team</DialogTitle>
          </DialogHeader>
          {allocatingActivity && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm"><span className="font-semibold">Activity:</span> {allocatingActivity.activity_name}</p>
                <p className="text-sm"><span className="font-semibold">Farmer:</span> {allocatingActivity.farmer_name}</p>
                <p className="text-sm"><span className="font-semibold">Plot Size:</span> {allocatingActivity.acres} acres</p>
                <p className="text-sm"><span className="font-semibold">Date:</span> {format(new Date(allocatingActivity.scheduled_date), "MMM d, yyyy")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="labourTeam">Select Labour Team</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No team (Unallocate)</SelectItem>
                    {labourTeams.map((team) => {
                      const hasRate = team.team_activity_rates?.some(
                        (rate: any) => rate.activity_type_id === allocatingActivity.activity_type_id
                      );
                      return (
                        <SelectItem key={team.id} value={team.id}>
                          {team.mukkadam_name} ({team.number_of_labourers} labourers)
                          {hasRate && " ✓"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">✓ indicates team has a rate set for this activity</p>
              </div>
              <Button onClick={handleAllocateTeam} className="w-full">
                {selectedTeamId && selectedTeamId !== "none" ? 'Allocate Team' : 'Remove Allocation'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
