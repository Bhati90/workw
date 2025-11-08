import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sprout } from "lucide-react";
import { toast } from "sonner";

const DEMO_USERS = [
  { id: "founder-id", email: "founder@farmops.com", role: "founder", name: "Arjun Founder" },
  { id: "ops-head-id", email: "ops@farmops.com", role: "operations_head", name: "Operations Head" },
  { id: "team-member-id", email: "team1@farmops.com", role: "team_member", name: "Team Member 1" },
  { id: "ground-team-id", email: "ground@farmops.com", role: "ground_team", name: "Ground Team Member" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const handleLogin = () => {
    const user = DEMO_USERS.find(u => u.email === email || u.id === selectedUser);
    
    if (!user) {
      toast.error("Invalid credentials");
      return;
    }

    // Store user info in localStorage
    localStorage.setItem("current_user", JSON.stringify(user));
    toast.success(`Welcome ${user.name}!`);
    
    // Redirect to dashboard
    window.location.href = "/";
  };

  const handleQuickLogin = (userId: string) => {
    const user = DEMO_USERS.find(u => u.id === userId);
    if (user) {
      localStorage.setItem("current_user", JSON.stringify(user));
      toast.success(`Logged in as ${user.name}`);
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-farm">
              <Sprout className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">FarmOps Login</CardTitle>
          <CardDescription>Labor Management System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Manual Login */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              Login
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or quick login as</span>
            </div>
          </div>

          {/* Quick Login Buttons */}
          <div className="space-y-2">
            {DEMO_USERS.map((user) => (
              <Button
                key={user.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickLogin(user.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <div className="font-semibold text-sm">{user.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {user.role.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}