import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Farmers from "./pages/Farmers";
import LabourTeams from "./pages/LabourTeams";
import CalendarPage from "./pages/CalendarPage";
import JobSheets from "./pages/JobSheets";
import Bookings from "./pages/Bookings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { useCurrentUser } from "./hooks/useCurrentUser";
import { JobManagementDashboard } from "./components/job-management/JobManagementDashboard";
import { SimpleJobList } from "./components/job-management/Simple";
import { FarmerProfile } from "./components/farmers/FarmerProflie";
import { FarmersList } from "./components/farmers/FarmerList";
import { CalendarAvailability } from "./pages/Calendar";
import LabourTeamsDjango from "./pages/LabourTeams";

import { MukadamAvailabilityDialog } from "./components/MukadamAvail";
import MukkadamForm from "./pages/Form";
import { AutoPriceDialog } from "./components/job-management/AddPrice";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: currentUser, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// wrapper to read the route param and pass it to FarmerProfile
function FarmerProfileWrapper() {
  const params = useParams();
  const farmerId = params?.farmerId;
  return <FarmerProfile farmerId={farmerId} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter >
        <Routes>
          {/* <Route path="/login" element={<Login />} /> */}
<Route path="/"
            element={
              <SimpleJobList />
            }
          />

          <Route path="/form"
            element={
              <MukkadamForm />
            }
          />

          
         
<Route path="/farmers" element={<FarmersList />} />
<Route path="/farmers/:farmerId" element={<FarmerProfileWrapper />} />

          <Route
            path="/labour-teams"
            element={
              
                <LabourTeamsDjango />
              
            }
          />
           
          <Route
            path="/calendar"
            element={
              
                <CalendarAvailability />
              
            }
          />{/*
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-sheets"
            element={
              <ProtectedRoute>
                <JobSheets />
              </ProtectedRoute>
            }
          /> */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;