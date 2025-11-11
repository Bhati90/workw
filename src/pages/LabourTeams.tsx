import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Users, Search, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import AddLabourTeamDialog from "@/components/labour/AddLabourTeamDialog";
import EditLabourTeamDialog from "@/components/labour/EditLabourTeamDialog";
import { TeamAvailabilityDialog } from "@/components/TeamAvailabilityDialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LabourTeams = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  
  // Date filter states
  const [searchDate, setSearchDate] = useState<Date | undefined>();
  const [searchEndDate, setSearchEndDate] = useState<Date | undefined>();
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: teams, isLoading } = useQuery({
    queryKey: ["labour-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labour_teams")
        .select("*, team_activity_rates(*, activity_types(*)), team_availability(*)")
        .order("mukkadam_name");
      
      if (error) throw error;
      return data;
    },
  });

  // Check if a team is available for the selected date range
  const isTeamAvailable = (team: any) => {
    if (!searchDate) return true; // No filter, show all
    
    if (!team.team_availability || team.team_availability.length === 0) {
      return false; // No availability records = not available
    }

    const searchStart = searchDate;
    const searchEnd = searchEndDate || searchDate; // If no end date, use same as start

    // Check if ANY availability record overlaps with search range
    return team.team_availability.some((avail: any) => {
      const availStart = new Date(avail.start_date);
      const availEnd = new Date(avail.end_date);
      
      // Check for overlap
      return (
        (searchStart >= availStart && searchStart <= availEnd) || // Search start is within availability
        (searchEnd >= availStart && searchEnd <= availEnd) ||     // Search end is within availability
        (searchStart <= availStart && searchEnd >= availEnd)      // Search range contains availability
      );
    });
  };

  // Filter teams based on availability
  const filteredTeams = teams?.filter(team => {
    if (!showAvailableOnly || !searchDate) return true;
    return isTeamAvailable(team);
  });

  const availableCount = teams?.filter(isTeamAvailable).length || 0;

  const deleteMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from("labour_teams")
        .delete()
        .eq("id", teamId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labour-teams"] });
      toast.success("Labour team deleted successfully");
      setDeletingTeamId(null);
    },
    onError: (error) => {
      toast.error("Failed to delete team: " + error.message);
    },
  });

  const handleSearch = () => {
    if (!searchDate) {
      toast.error("Please select a date");
      return;
    }
    setShowAvailableOnly(true);
  };

  const clearSearch = () => {
    setSearchDate(undefined);
    setSearchEndDate(undefined);
    setShowAvailableOnly(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Labour Teams</h1>
            <p className="text-muted-foreground mt-1">Manage your labour teams and their availability</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Labour Team
          </Button>
        </div>

        {/* Date Search Filter */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Available Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !searchDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {searchDate ? format(searchDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={searchDate}
                      onSelect={setSearchDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Date (Optional)</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !searchEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {searchEndDate ? format(searchEndDate, "PPP") : <span>Same as start</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={searchEndDate}
                      onSelect={setSearchEndDate}
                      disabled={(date) => searchDate ? date < searchDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button onClick={handleSearch} disabled={!searchDate}>
                <Search className="mr-2 h-4 w-4" />
                Search Available
              </Button>

              {showAvailableOnly && (
                <Button variant="outline" onClick={clearSearch}>
                  Clear Filter
                </Button>
              )}

              {searchDate && (
                <Badge variant="secondary" className="ml-auto">
                  {availableCount} / {teams?.length || 0} teams available
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">Loading teams...</div>
        ) : filteredTeams && filteredTeams.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredTeams.map((team) => {
              const available = isTeamAvailable(team);
              return (
                <Card 
                  key={team.id}
                  className={cn(
                    showAvailableOnly && available && "border-green-500 border-2"
                  )}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <CardTitle>{team.mukkadam_name}</CardTitle>
                        {showAvailableOnly && available && (
                          <Badge className="bg-green-500">Available</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setEditingTeam(team)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setDeletingTeamId(team.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Labourers:</span>
                        <p className="font-medium">{team.number_of_labourers}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Contact:</span>
                        <p className="font-medium">{team.contact || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location:</span>
                        <p className="font-medium">{team.location || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transport:</span>
                        <p className="font-medium">{team.transport_situation || "N/A"}</p>
                      </div>
                    </div>

                    {team.team_activity_rates && team.team_activity_rates.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Activity Rates:</p>
                        <div className="space-y-1">
                          {team.team_activity_rates.map((rate: any) => (
                            <div key={rate.id} className="flex justify-between text-sm">
                              <span>{rate.activity_types?.name}</span>
                              <span className="font-medium">₹{rate.rate}/acre</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {team.team_availability && team.team_availability.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Availability Periods:
                        </p>
                        <div className="space-y-1">
                          {team.team_availability.map((avail: any) => {
                            const availStart = new Date(avail.start_date);
                            const availEnd = new Date(avail.end_date);
                            const isInRange = searchDate && (
                              (searchDate >= availStart && searchDate <= availEnd) ||
                              (searchEndDate && searchEndDate >= availStart && searchEndDate <= availEnd)
                            );
                            
                            return (
                              <div 
                                key={avail.id} 
                                className={cn(
                                  "text-sm p-2 rounded",
                                  isInRange && "bg-green-100 dark:bg-green-950 font-medium"
                                )}
                              >
                                {format(availStart, "MMM d")} - {format(availEnd, "MMM d, yyyy")}
                                {isInRange && " ✓"}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTeam(team)}
                      className="w-full"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Manage Availability
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : showAvailableOnly ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">No teams available</p>
              <p className="text-muted-foreground">
                No labour teams are available for {searchDate && format(searchDate, "MMM d, yyyy")}
                {searchEndDate && ` - ${format(searchEndDate, "MMM d, yyyy")}`}
              </p>
              <Button variant="outline" onClick={clearSearch} className="mt-4">
                Clear Filter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No labour teams yet. Add your first team to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AddLabourTeamDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      
      {editingTeam && (
        <EditLabourTeamDialog
          team={editingTeam}
          open={!!editingTeam}
          onOpenChange={(open) => !open && setEditingTeam(null)}
        />
      )}
      
      <TeamAvailabilityDialog
        team={selectedTeam}
        open={!!selectedTeam}
        onOpenChange={(open) => !open && setSelectedTeam(null)}
      />

      <AlertDialog open={!!deletingTeamId} onOpenChange={() => setDeletingTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Labour Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this labour team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingTeamId && deleteMutation.mutate(deletingTeamId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default LabourTeams;