import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { addMonths} from "date-fns";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  DollarSign,
  Calendar,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ActivityCalendar } from "@/components/dashboard/ActivityCalendar";
import { BookingCalendar } from "@/components/BookingCalender";
import { UpcomingActivities } from "@/components/dashboard/UpcomingActivities";
import { UpcomingBookings } from "@/components/UpcomingBooking";


export function FounderDashboard() {
  const [timeRange, setTimeRange] = useState("today");
    const [currentDate, setCurrentDate] = useState(new Date());

  // --- ALL HOOKS MUST BE CALLED AT THE TOP ---

  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();

  // Activities query
  const { data: activities = [] } = useQuery({
    queryKey: ["activities", format(currentDate, "yyyy-MM")],
    queryFn: async () => {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = addMonths(monthStart, 1);
      const { data, error } = await supabase
        .from("scheduled_activities")
        .select("*")
        .gte("scheduled_date", format(monthStart, "yyyy-MM-dd"))
        .lt("scheduled_date", format(monthEnd, "yyyy-MM-dd"))
        .order("scheduled_date");
      if (error) throw error;
      return data || [];
    },
    // This query can run whether you are logged in or not
  });

  // Bookings query
  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery({
    queryKey: ["bookings", format(currentDate, "yyyy-MM")],
    queryFn: async () => {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = addMonths(monthStart, 1);
      const { data, error } = await supabase
        .from("bookings_with_details")
        .select("*")
        .gte("requested_date", format(monthStart, "yyyy-MM-dd"))
        .lt("requested_date", format(monthEnd, "yyyy-MM-dd"))
        .order("requested_date");
      if (error) throw error;
      return data || [];
    },
    // ✅ Only run this query *after* we know who the user is
    enabled: !!currentUser,
  });

  // Farmers query
  const { data: farmers = [], isLoading: isFarmersLoading } = useQuery({
    queryKey: ["farmers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("farmers").select("*");
      if (error) throw error;
      return data || [];
    },
    // ✅ Only run this query *after* we know who the user is
    enabled: !!currentUser,
  });

  // Teams query
  const { data: teams = [], isLoading: isTeamsLoading } = useQuery({
    queryKey: ["labour-teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("labour_teams").select("*");
      if (error) throw error;
      return data || [];
    },
    // ✅ Only run this query *after* we know who the user is
    enabled: !!currentUser,
  });

  // Fetch all bookings with details
  const { data: allBookings = [] } = useQuery({
    queryKey: ["founder-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings_with_details")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch team performance
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-performance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["operations_head", "team_member", "ground_team"]);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch mukadams
  const { data: mukadams = [] } = useQuery({
    queryKey: ["mukadams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labour_teams")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate metrics
  const metrics = {
    totalBookings: allBookings.length,
    pendingAssignment: allBookings.filter(b => b.status === 'pending').length,
    awaitingApproval: allBookings.filter(b => b.status === 'assigned' && b.job_assignment_id && !b.approved_at).length,
    inProgress: allBookings.filter(b => b.status === 'in_progress').length,
    completed: allBookings.filter(b => b.status === 'completed').length,
    totalRevenue: allBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.quoted_price || 0), 0),
    teamUtilization: teamMembers.length > 0 
      ? Math.round((allBookings.filter(b => b.assigned_team_member).length / allBookings.length) * 100)
      : 0,
  };

  // Bookings by status
  const bookingsByStatus = {
    pending: allBookings.filter(b => b.status === 'pending'),
    assigned: allBookings.filter(b => b.status === 'assigned'),
    allocated: allBookings.filter(b => b.status === 'allocated'),
    in_progress: allBookings.filter(b => b.status === 'in_progress'),
    completed: allBookings.filter(b => b.status === 'completed'),
  };

  // Team performance
  const teamPerformance = teamMembers.map(member => ({
    ...member,
    assignedJobs: allBookings.filter(b => b.assigned_team_member === member.id).length,
    completedJobs: allBookings.filter(b => b.assigned_team_member === member.id && b.status === 'completed').length,
  }));

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      assigned: "bg-blue-500",
      allocated: "bg-purple-500",
      in_progress: "bg-orange-500",
      completed: "bg-green-500",
    };
    return colors[status] || "bg-gray-500";
  };

  
  const upcomingActivities = activities
    .filter((a) => new Date(a.scheduled_date) >= new Date())
    .slice(0, 8);

  const upcomingBookings = bookings
    .filter((b) => new Date(b.requested_date) >= new Date())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Founder Dashboard</h1>
        <p className="text-muted-foreground">Complete business overview and metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {metrics.pendingAssignment + metrics.awaitingApproval}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingAssignment} pending, {metrics.awaitingApproval} awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (MTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{(metrics.totalRevenue / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground">{metrics.completed} completed jobs</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Booking Pipeline</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="mukadams">Mukadam Overview</TabsTrigger>
        </TabsList>

        {/* Pipeline View */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Pending Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Pending Assignment</span>
                  <Badge variant="secondary">{bookingsByStatus.pending.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {bookingsByStatus.pending.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="p-2 border rounded-lg">
                    <div className="font-semibold text-sm">{booking.farmer_name}</div>
                    <div className="text-xs text-muted-foreground">{booking.activity_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(booking.requested_date), "MMM d")}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Awaiting Approval */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Awaiting Approval</span>
                  <Badge variant="secondary" className="bg-blue-500 text-white">
                    {bookingsByStatus.assigned.filter(b => b.job_assignment_id && !b.approved_at).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {bookingsByStatus.assigned
                  .filter(b => b.job_assignment_id && !b.approved_at)
                  .slice(0, 5)
                  .map((booking) => (
                    <div key={booking.id} className="p-2 border rounded-lg">
                      <div className="font-semibold text-sm">{booking.farmer_name}</div>
                      <div className="text-xs text-muted-foreground">{booking.activity_name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {booking.team_member_name}
                      </div>
                      {booking.mukkadam_name && (
                        <div className="text-xs text-green-600">→ {booking.mukkadam_name}</div>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* In Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>In Progress</span>
                  <Badge variant="secondary" className="bg-orange-500 text-white">
                    {bookingsByStatus.in_progress.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {bookingsByStatus.in_progress.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="p-2 border rounded-lg">
                    <div className="font-semibold text-sm">{booking.farmer_name}</div>
                    <div className="text-xs text-muted-foreground">{booking.activity_name}</div>
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {booking.mukkadam_name}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Performance */}
        <TabsContent value="team" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamPerformance.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{member.full_name}</CardTitle>
                  <Badge variant="outline">{member.role.replace('_', ' ')}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Assigned Jobs:</span>
                      <span className="font-semibold">{member.assignedJobs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="font-semibold text-green-600">{member.completedJobs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate:</span>
                      <span className="font-semibold">
                        {member.assignedJobs > 0
                          ? Math.round((member.completedJobs / member.assignedJobs) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>


        {/* Mukadam Overview */}
        <TabsContent value="mukadams" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mukadams.map((mukadam) => {
              const jobs = allBookings.filter(b => b.labour_team_id === mukadam.id);
              const activeJobs = jobs.filter(b => b.status === 'in_progress');
              
              return (
                <Card key={mukadam.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{mukadam.mukkadam_name}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {mukadam.number_of_labourers} labourers • {mukadam.location}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Jobs:</span>
                        <span className="font-semibold">{jobs.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Active Now:</span>
                        <span className="font-semibold text-orange-600">{activeJobs.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="font-semibold text-xs">{mukadam.contact || 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">📋 Bookings Calendar</TabsTrigger>
            <TabsTrigger value="activities">📅 Plot Activities Calendar</TabsTrigger>
         </TabsList>

        <TabsContent value="bookings" className="space-y-4">
             <div className="grid gap-6 lg:grid-cols-3">
               <div className="lg:col-span-2">
                <BookingCalendar
                  bookings={bookings}
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                />
              </div>
              <div>
                <UpcomingBookings bookings={upcomingBookings} />
              </div>
            </div>
          </TabsContent>

           <TabsContent value="activities" className="space-y-4">
             <div className="grid gap-6 lg:grid-cols-3">
               <div className="lg:col-span-2">
                 <ActivityCalendar
                   activities={activities}
                   currentDate={currentDate}
                  onDateChange={setCurrentDate}
                />
              </div>
               <div>
                 <UpcomingActivities activities={upcomingActivities} />
              </div>
             </div>
          </TabsContent>
         </Tabs>
      
    </div>
  );
}