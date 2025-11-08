import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, CheckCircle2, Clock, XCircle, Phone } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WhatsAppNotificationsProps {
  bookingId?: string;
}

export function WhatsAppNotifications({ bookingId }: WhatsAppNotificationsProps) {
  const { data: notifications = [] } = useQuery({
    queryKey: ["whatsapp-notifications", bookingId],
    queryFn: async () => {
      let query = supabase
        .from("whatsapp_notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (bookingId) {
        query = query.eq("booking_id", bookingId);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "sent":
        return {
          icon: CheckCircle2,
          color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-200",
          label: "Sent",
        };
      case "delivered":
        return {
          icon: CheckCircle2,
          color: "text-green-500 bg-green-50 dark:bg-green-950/20 border-green-200",
          label: "Delivered",
        };
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200",
          label: "Pending",
        };
      case "failed":
        return {
          icon: XCircle,
          color: "text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200",
          label: "Failed",
        };
      default:
        return {
          icon: MessageSquare,
          color: "text-gray-500 bg-gray-50 dark:bg-gray-950/20 border-gray-200",
          label: "Unknown",
        };
    }
  };

  const getRecipientIcon = (type: string) => {
    switch (type) {
      case "farmer":
        return "👨‍🌾";
      case "mukadam":
        return "👷";
      case "team":
        return "👔";
      default:
        return "📱";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          WhatsApp Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No WhatsApp notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification: any) => {
                const statusConfig = getStatusConfig(notification.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={notification.id} className="border-l-4" style={{ borderLeftColor: statusConfig.color.includes('blue') ? '#3b82f6' : statusConfig.color.includes('green') ? '#10b981' : statusConfig.color.includes('yellow') ? '#f59e0b' : '#ef4444' }}>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getRecipientIcon(notification.recipient_type)}</span>
                            <div>
                              <div className="font-semibold text-sm capitalize">
                                {notification.recipient_type}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {notification.recipient_phone}
                              </div>
                            </div>
                          </div>
                          <Badge className={cn(statusConfig.color, "border")}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>

                        <div className="text-sm bg-secondary/30 p-3 rounded">
                          {notification.message}
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                          {notification.sent_at && (
                            <span>
                              Sent: {format(new Date(notification.sent_at), "h:mm a")}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}