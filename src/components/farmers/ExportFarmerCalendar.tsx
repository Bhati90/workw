import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Activity {
  activity_name: string;
  scheduled_date: string;
  days_after_pruning: number;
  acres: number;
  variety: string;
}

interface ExportFarmerCalendarProps {
  farmerName: string;
  activities: Activity[];
}

export function ExportFarmerCalendar({ farmerName, activities }: ExportFarmerCalendarProps) {
  const handleExport = () => {
    if (activities.length === 0) {
      toast.error("No activities to export");
      return;
    }

    // Sort activities by date
    const sortedActivities = [...activities].sort(
      (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    );

    // Create CSV content
    const headers = ["Activity", "Scheduled Date", "Days After Pruning", "Acres", "Variety"];
    const rows = sortedActivities.map((activity) => [
      activity.activity_name,
      format(new Date(activity.scheduled_date), "MMM d, yyyy"),
      activity.days_after_pruning.toString(),
      activity.acres.toString(),
      activity.variety || "N/A"
    ]);

    const csvContent = [
      [`Calendar for ${farmerName}`],
      [],
      headers,
      ...rows
    ].map(row => row.join(",")).join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${farmerName.replace(/\s+/g, "_")}_calendar.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Calendar exported successfully");
  };

  return (
    <Button onClick={handleExport} variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      Export Calendar
    </Button>
  );
}
