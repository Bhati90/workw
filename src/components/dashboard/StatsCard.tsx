import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "success" | "warning";
}

export function StatsCard({ title, value, icon: Icon, description, variant = "default" }: StatsCardProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div
          className={cn(
            "rounded-lg p-2",
            variant === "success" && "bg-success/10",
            variant === "warning" && "bg-warning/10",
            variant === "default" && "bg-primary/10"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              variant === "success" && "text-success",
              variant === "warning" && "text-warning",
              variant === "default" && "text-primary"
            )}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}
