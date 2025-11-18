import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Users, MapPin, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

interface TeamInfo {
  id: string;
  name: string;
  phone: string;
  location: string;
  team_size: number;
  activity_rates: Array<{
    activity: string;
    rate_per_acre: number;
  }>;
}

interface DayAvailability {
  date: string;
  day_name: string;
  day_number: number;
  available_count: number;
  teams: TeamInfo[];
}

export function CalendarAvailability() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<DayAvailability | null>(null);
  
  const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-availability", startDate, endDate],
    queryFn: async () => {
      const response = await fetch(
        `http://127.0.0.1:8000/api/mukadams/calendar_availability/?start_date=${startDate}&end_date=${endDate}`
      );
      if (!response.ok) throw new Error("Failed to fetch calendar");
      return response.json();
    },
  });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getAvailabilityColor = (count: number, total: number) => {
    const percentage = (count / total) * 100;
    if (percentage >= 75) return "bg-green-100 dark:bg-green-950 border-green-500";
    if (percentage >= 50) return "bg-yellow-100 dark:bg-yellow-950 border-yellow-500";
    if (percentage >= 25) return "bg-orange-100 dark:bg-orange-950 border-orange-500";
    return "bg-red-100 dark:bg-red-950 border-red-500";
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading calendar...</div>;
  }

  const totalTeams = data?.summary?.total_teams || 0;

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Team Availability Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold min-w-[150px] text-center">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-secondary/20 rounded">
              <p className="text-sm text-muted-foreground">Total Teams</p>
              <p className="text-2xl font-bold">{totalTeams}</p>
            </div>
            <div className="text-center p-3 bg-secondary/20 rounded">
              <p className="text-sm text-muted-foreground">Avg Available/Day</p>
              <p className="text-2xl font-bold">
                {data?.summary?.avg_available_per_day?.toFixed(1) || 0}
              </p>
            </div>
            <div className="text-center p-3 bg-green-100 dark:bg-green-950/20 rounded">
              <p className="text-sm text-muted-foreground">Peak Availability</p>
              <p className="text-2xl font-bold text-green-600">
                {data?.summary?.peak_availability || 0}
              </p>
            </div>
            <div className="text-center p-3 bg-orange-100 dark:bg-orange-950/20 rounded">
              <p className="text-sm text-muted-foreground">Low Availability Days</p>
              <p className="text-2xl font-bold text-orange-600">
                {data?.summary?.low_availability_days || 0}
              </p>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-sm p-2">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {data?.calendar?.map((day: DayAvailability) => {
              const dayDate = new Date(day.date);
              const isToday = format(dayDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    min-h-[100px] p-2 rounded-lg border-2 transition-all
                    ${getAvailabilityColor(day.available_count, totalTeams)}
                    ${isToday ? "ring-2 ring-primary" : ""}
                    hover:scale-105 hover:shadow-lg
                  `}
                >
                  <div className="text-left">
                    <div className="font-semibold">{day.day_number}</div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {day.day_name.substring(0, 3)}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge 
                      variant="secondary" 
                      className="w-full justify-center"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {day.available_count}/{totalTeams}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>High (75%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span>Medium (50-75%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500"></div>
              <span>Low (25-50%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>Critical (&lt;25%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Details Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Available Teams - {selectedDate && format(new Date(selectedDate.date), "MMMM d, yyyy")}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedDate?.available_count} teams available out of {totalTeams}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDate?.teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <Badge>{team.team_size} workers</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{team.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{team.phone}</span>
                    </div>
                  </div>

                  {team.activity_rates.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Activity Rates:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {team.activity_rates.map((rate, idx) => (
                          <div 
                            key={idx}
                            className="flex justify-between text-sm p-2 bg-secondary/20 rounded"
                          >
                            <span>{rate.activity}</span>
                            <span className="font-semibold">₹{rate.rate_per_acre}/acre</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {selectedDate?.teams.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No teams available on this date</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}