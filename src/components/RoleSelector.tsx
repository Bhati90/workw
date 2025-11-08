import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const roles = [
  { value: "founder", label: "Founder" },
  { value: "operations_head", label: "Operations Head" },
  { value: "team_member", label: "Team Member" },
  { value: "ground_team", label: "Ground Team" },
];

export function RoleSelector() {
  const queryClient = useQueryClient();
  const currentRole = localStorage.getItem("mock_user_role") || "founder";

  const handleRoleChange = (role: string) => {
    localStorage.setItem("mock_user_role", role);
    queryClient.invalidateQueries({ queryKey: ["current-user"] });
    queryClient.invalidateQueries(); // Refresh all queries
    window.location.reload(); // Force refresh for demo
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          {roles.find(r => r.value === currentRole)?.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {roles.map((role) => (
          <DropdownMenuItem
            key={role.value}
            onClick={() => handleRoleChange(role.value)}
            className={currentRole === role.value ? "bg-secondary" : ""}
          >
            {role.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}