import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Calendar, Users, CheckCircle2, IndianRupee, Star, X, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Calendar className="h-4 w-4" />;
      case "assignment":
        return <Users className="h-4 w-4" />;
      case "completion":
        return <CheckCircle2 className="h-4 w-4" />;
      case "payment":
        return <IndianRupee className="h-4 w-4" />;
      case "review":
        return <Star className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking":
        return "bg-blue-500";
      case "assignment":
        return "bg-purple-500";
      case "completion":
        return "bg-green-500";
      case "payment":
        return "bg-yellow-500";
      case "review":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      toast.error("Failed to mark as read");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["notifications", currentUser?.id] });
  };

  const markAllAsRead = async () => {
    if (!currentUser?.id) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", currentUser.id)
      .eq("read", false);

    if (error) {
      toast.error("Failed to mark all as read");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["notifications", currentUser.id] });
    toast.success("All notifications marked as read");
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      toast.error("Failed to delete notification");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["notifications", currentUser?.id] });
  };

  const clearAll = async () => {
    if (!currentUser?.id) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", currentUser.id);

    if (error) {
      toast.error("Failed to clear notifications");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["notifications", currentUser.id] });
    toast.success("All notifications cleared");
  };

  if (!currentUser) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification: any) => (
                <Card
                  key={notification.id}
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-shadow",
                    !notification.read && "border-l-4 border-l-primary bg-secondary/30"
                  )}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg shrink-0",
                          getTypeColor(notification.type),
                          "text-white"
                        )}
                      >
                        {getIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}