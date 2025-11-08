import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import AddLabourTeamDialog from "@/components/labour/AddLabourTeamDialog";
import EditLabourTeamDialog from "@/components/labour/EditLabourTeamDialog";
import { TeamAvailabilityDialog } from "@/components/TeamAvailabilityDialog";
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
  const queryClient = useQueryClient();
const [selectedTeam, setSelectedTeam] = useState<any>(null);
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

        {isLoading ? (
          <div className="text-center py-12">Loading teams...</div>
        ) : teams && teams.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <CardTitle>{team.mukkadam_name}</CardTitle>
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
                      <Button
  variant="outline"
  size="sm"
  onClick={() => setSelectedTeam(team)}
>
  Manage Availability
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
                      <p className="text-sm text-muted-foreground mb-2">Availability:</p>
                      <div className="space-y-1">
                        {team.team_availability.map((avail: any) => (
                          <div key={avail.id} className="text-sm">
                            {new Date(avail.start_date).toLocaleDateString()} - {new Date(avail.end_date).toLocaleDateString()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
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
