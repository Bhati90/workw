import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Dashboard from "./Dashboard";
import Farmers from "./pages/Farmers";
import LabourTeams from "./pages/LabourTeams";
import CalendarPage from "./pages/CalendarPage";
import JobSheets from "./pages/JobSheets";
import Bookings from "./pages/Bookings";
import Login from "./Login";
import NotFound from "./pages/NotFound";
import { useCurrentUser } from "./hooks/useCurrentUser";
import { JobManagementDashboard } from "./components/job-management/JobManagementDashboard";
// import { SimpleJobList } from "./components/job-management/Simple";
import { FarmerProfile } from "./components/farmers/FarmerProflie";
import { FarmersList } from "./components/farmers/FarmerList";
import { CalendarAvailability } from "./pages/Calendar";
import LabourTeamsDjango from "./pages/LabourTeams";

import { MukadamAvailabilityDialog } from "./components/MukadamAvail";
import MukkadamForm from "./Form";
import { AutoPriceDialog } from "./components/job-management/AddPrice";
import MukkadamList from "./MukkadamList";
import AvailabilityUpdate from "./AvailabilityUpdate";
import ProfileUpdateSearch from "./ProfileUpdateSearch";

import AdminProfileView from "./AdminProfileView";
import JobList from "./JobList";
import AssignMukkadamModal from "./AssignMukkadamModal";
const queryClient = new QueryClient();


const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};
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
      <BrowserRouter basename="/react">
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        
        {/* 1. Registration (New Form) */}
        <Route path="/registration" element={
          <ProtectedRoute><MukkadamForm /></ProtectedRoute>
        } />

        <Route path="/job" element={
          <ProtectedRoute><JobList/></ProtectedRoute>
        } />
        {/* <Route path="/assign" element={
          <ProtectedRoute><AssignMukkadamModal /></ProtectedRoute>
        } /> */}
        {/* 2. List View */}
        <Route path="/list" element={
          <ProtectedRoute><MukkadamList /></ProtectedRoute>
        } />
        
        {/* 3. Availability Update */}
        <Route path="/availability-update" element={
          <ProtectedRoute><AvailabilityUpdate /></ProtectedRoute>
        } />
        
        {/* 4. Profile Update Sequence */}
        <Route path="/profile-search" element={
          <ProtectedRoute><ProfileUpdateSearch /></ProtectedRoute>
        } />

        <Route path="/admin-view/:id" element={
    <ProtectedRoute><AdminProfileView /></ProtectedRoute>
  } />
        {/* 3. The Edit Form (Clicking 'Edit' in Admin View goes here) */}
  <Route path="/update-form/:id" element={
    <ProtectedRoute><MukkadamForm /></ProtectedRoute>
  } />

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;