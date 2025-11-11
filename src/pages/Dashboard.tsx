import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Layout } from "@/components/Layout";
import { FounderDashboard } from "@/components/FounderDashboard";
import { OperationsHeadDashboard } from "@/components/OperationHeadDashboard";
import { TeamMemberDashboard } from "@/components/TeamMemberDashboard";
import { GroundTeamDashboard } from "@/components/GroundTeamDashboard";
import { JobManagementDashboard } from "@/components/job-management/JobManagementDashboard";
import { FollowUpSuggestions } from "@/components/FollowUpSuggestions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useRealtimeUpdates } from "@/hooks/useRealUpdates";

export default function Dashboard() {
  const { data: currentUser, isLoading } = useCurrentUser();
  
  // Enable real-time updates
  useRealtimeUpdates();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // if (!currentUser) {
  //   return (
  //     <Layout>
  //       <Card>
  //         <CardContent className="py-12 text-center">
  //           <p className="text-muted-foreground">Please log in to continue</p>
  //         </CardContent>
  //       </Card>
  //     </Layout>
  //   );
  // }

  return (
    <Layout>
      {/* FOUNDER - Can see everything including job management */}
      {/* {currentUser.role === "founder" && ( */}
        <Tabs defaultValue="overview">
          <TabsList>
            {/* <TabsTrigger value="overview">Overview</TabsTrigger> */}
            <TabsTrigger value="jobs">Job Management</TabsTrigger>
            {/* <TabsTrigger value="followups">Follow-ups</TabsTrigger> */}
          </TabsList>
          <TabsContent value="jobs">
            <JobManagementDashboard />
          </TabsContent>
          {/* <TabsContent value="overview">
            <FounderDashboard />
          </TabsContent>
          
          <TabsContent value="followups">
            <FollowUpSuggestions />
          </TabsContent> */}
        </Tabs>
      {/* )} */}

{/*       
      {currentUser.role === "operations_head" && (
        <Tabs defaultValue="operations">
          <TabsList>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="jobs">Job Management</TabsTrigger>
            <TabsTrigger value="followups">Follow-ups</TabsTrigger>
          </TabsList>
          <TabsContent value="operations">
            <OperationsHeadDashboard />
          </TabsContent>
          <TabsContent value="jobs">
            <JobManagementDashboard />
          </TabsContent>
          <TabsContent value="followups">
            <FollowUpSuggestions />
          </TabsContent>
        </Tabs>
      )}

      {currentUser.role === "team_member" && <TeamMemberDashboard />}

      {currentUser.role === "ground_team" && <GroundTeamDashboard />}

     
      {currentUser.role === "accounts" && (
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Accounts Dashboard</h2>
            <p className="text-muted-foreground">Financial overview coming soon</p>
          </CardContent>
        </Card>
      )} */}
    </Layout>
  );
}
// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { Layout } from "@/components/Layout";
// import { StatsCard } from "@/components/dashboard/StatsCard";
// import { ActivityCalendar } from "@/components/dashboard/ActivityCalendar";
// import { BookingCalendar } from "@/components/BookingCalender";
// import { UpcomingActivities } from "@/components/dashboard/UpcomingActivities";
// import { UpcomingBookings } from "@/components/UpcomingBooking";
// import { Users, Calendar, Briefcase, TrendingUp } from "lucide-react";
// import { supabase } from "@/integrations/supabase/client";
// import { addMonths, format } from "date-fns";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { AddBookingDialog } from "@/components/AddBookingDialog";
// import { useCurrentUser } from "@/hooks/useCurrentUser";
// import { FounderDashboard } from "@/components/FounderDashboard";
// import { OperationsHeadDashboard } from "@/components/OperationHeadDashboard";
// import { TeamMemberDashboard } from "@/components/TeamMemberDashboard";
// import { Card, CardContent } from "@/components/ui/card";
// import { Loader2 } from "lucide-react";
// import { PaymentCollectionDialog } from "@/components/PaymentCollectionDialog";

// export default function Dashboard() {
//   const [currentDate, setCurrentDate] = useState(new Date());

//   // --- ALL HOOKS MUST BE CALLED AT THE TOP ---

//   const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();

//   // Activities query
//   const { data: activities = [] } = useQuery({
//     queryKey: ["activities", format(currentDate, "yyyy-MM")],
//     queryFn: async () => {
//       const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
//       const monthEnd = addMonths(monthStart, 1);
//       const { data, error } = await supabase
//         .from("scheduled_activities")
//         .select("*")
//         .gte("scheduled_date", format(monthStart, "yyyy-MM-dd"))
//         .lt("scheduled_date", format(monthEnd, "yyyy-MM-dd"))
//         .order("scheduled_date");
//       if (error) throw error;
//       return data || [];
//     },
//     // This query can run whether you are logged in or not
//   });

//   // Bookings query
//   const { data: bookings = [], isLoading: isBookingsLoading } = useQuery({
//     queryKey: ["bookings", format(currentDate, "yyyy-MM")],
//     queryFn: async () => {
//       const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
//       const monthEnd = addMonths(monthStart, 1);
//       const { data, error } = await supabase
//         .from("bookings_with_details")
//         .select("*")
//         .gte("requested_date", format(monthStart, "yyyy-MM-dd"))
//         .lt("requested_date", format(monthEnd, "yyyy-MM-dd"))
//         .order("requested_date");
//       if (error) throw error;
//       return data || [];
//     },
//     // ✅ Only run this query *after* we know who the user is
//     enabled: !!currentUser,
//   });

//   // Farmers query
//   const { data: farmers = [], isLoading: isFarmersLoading } = useQuery({
//     queryKey: ["farmers"],
//     queryFn: async () => {
//       const { data, error } = await supabase.from("farmers").select("*");
//       if (error) throw error;
//       return data || [];
//     },
//     // ✅ Only run this query *after* we know who the user is
//     enabled: !!currentUser,
//   });

//   // Teams query
//   const { data: teams = [], isLoading: isTeamsLoading } = useQuery({
//     queryKey: ["labour-teams"],
//     queryFn: async () => {
//       const { data, error } = await supabase.from("labour_teams").select("*");
//       if (error) throw error;
//       return data || [];
//     },
//     // ✅ Only run this query *after* we know who the user is
//     enabled: !!currentUser,
//   });

//   // --- CONDITIONAL LOGIC & RETURNS GO *AFTER* ALL HOOKS ---

//   // A combined loading state
//   const isDataLoading = isBookingsLoading || isFarmersLoading || isTeamsLoading;

//   if (isUserLoading) {
//     return (
//       <Layout>
//         <div className="flex items-center justify-center h-[60vh]">
//           <Loader2 className="h-8 w-8 animate-spin text-primary" />
//         </div>
//       </Layout>
//     );
//   }

//   if (!currentUser) {
//     return (
//       <Layout>
//         <Card>
//           <CardContent className="py-12 text-center">
//             <p className="text-muted-foreground">Please log in to continue</p>
//           </CardContent>
//         </Card>
//       </Layout>
//     );
//   }

//   // If we get here, currentUser exists.
//   // We can show a loader while the *rest* of the data loads.
//   if (isDataLoading) {
//      return (
//       <Layout>
//         <div className="flex items-center justify-center h-[60vh]">
//           <Loader2 className="h-8 w-8 animate-spin text-primary" />
//           <p className="ml-2">Loading dashboard data...</p>
//         </div>
//       </Layout>
//     );
//   }

//   // --- CALCULATIONS & RENDER (SAFE TO RUN NOW) ---

//   const pendingBookings = bookings.filter((b) => b.status === "pending").length;
//   const completedBookings = bookings.filter((b) => b.status === "completed").length;
//   const totalRevenue = bookings
//     .filter((b) => b.status === "completed")
//     .reduce((sum, b) => sum + (b.quoted_price || 0), 0);

//   const upcomingActivities = activities
//     .filter((a) => new Date(a.scheduled_date) >= new Date())
//     .slice(0, 8);

//   const upcomingBookings = bookings
//     .filter((b) => new Date(b.requested_date) >= new Date())
//     .slice(0, 8);

//   return (
//     <Layout>
//       {/* Role-based dashboards */}
//       {currentUser.role === "founder" && <FounderDashboard />}
//       {currentUser.role === "operations_head" && <OperationsHeadDashboard />}
//       {currentUser.role === "team_member" && <TeamMemberDashboard />}
//       {currentUser.role === "ground_team" && (
//         <Card>
//           <CardContent className="py-12 text-center">
//             <h2 className="text-xl font-semibold mb-2">Ground Team Dashboard</h2>
//             {/* <PaymentCollectionDialog/> */}
//             {/* <p className="text-muted-foreground">Payment collection interface coming soon</p> */}
//           </CardContent>
//         </Card>
//       )}
//       {currentUser.role === "accounts" && (
//         <Card>
//           <CardContent className="py-12 text-center">
//             <h2 className="text-xl font-semibold mb-2">Accounts Dashboard</h2>
//             <p className="text-muted-foreground">Financial overview coming soon</p>
//           </CardContent>
//         </Card>
//       )}

//       <div className="space-y-8">
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
//             <p className="text-muted-foreground">Overview of your farm operations</p>
//           </div>
//           <AddBookingDialog />
//         </div>

//         {/* Stats Grid */}
//         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//           <StatsCard
//             title="Total Farmers"
//             value={farmers.length}
//             icon={Users}
//             description="Active farmers in system"
//           />
//           <StatsCard
//             title="Labour Teams"
//             value={teams.length}
//             icon={Briefcase}
//             description="Available mukkadam teams"
//           />
//           <StatsCard
//             title="Pending Bookings"
//             value={pendingBookings}
//             icon={Calendar}
//             variant="warning"
//             description="Awaiting assignment"
//           />
//           <StatsCard
//             title="Revenue (MTD)"
//             value={`₹${(totalRevenue / 1000).toFixed(0)}K`}
//             icon={TrendingUp}
//             variant="success"
//             description="Completed jobs this month"
//           />
//         </div>

//         {/* Tabs for Bookings vs Activities */}
//         <Tabs defaultValue="bookings" className="space-y-4">
//           <TabsList>
//             <TabsTrigger value="bookings">📋 Bookings Calendar</TabsTrigger>
//             <TabsTrigger value="activities">📅 Plot Activities Calendar</TabsTrigger>
//           </TabsList>

//           <TabsContent value="bookings" className="space-y-4">
//             <div className="grid gap-6 lg:grid-cols-3">
//               <div className="lg:col-span-2">
//                 <BookingCalendar
//                   bookings={bookings}
//                   currentDate={currentDate}
//                   onDateChange={setCurrentDate}
//                 />
//               </div>
//               <div>
//                 <UpcomingBookings bookings={upcomingBookings} />
//               </div>
//             </div>
//           </TabsContent>

//           <TabsContent value="activities" className="space-y-4">
//             <div className="grid gap-6 lg:grid-cols-3">
//               <div className="lg:col-span-2">
//                 <ActivityCalendar
//                   activities={activities}
//                   currentDate={currentDate}
//                   onDateChange={setCurrentDate}
//                 />
//               </div>
//               <div>
//                 <UpcomingActivities activities={upcomingActivities} />
//               </div>
//             </div>
//           </TabsContent>
//         </Tabs>
//       </div>
//     </Layout>
//   );
// }