import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Booking {
  id: string;
  farmer_name: string;
  farmer_color: string;
  activity_name: string;
  area_acres: number;
  requested_date: string;
  status: string;
  quoted_price: number | null;
  call_notes: string | null;
  mukkadam_name: string | null;
  farmer_contact: string | null;
  farmer_village: string | null;
}

interface BookingCalendarProps {
  bookings: Booking[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function BookingCalendar({ bookings, currentDate, onDateChange }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((booking) => {
      const dateKey = booking.requested_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(booking);
    });
    return map;
  }, [bookings]);

  const previousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const nextMonth = () => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + 1);
    onDateChange(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'assigned': return 'bg-blue-500';
      case 'allocated': return 'bg-purple-500';
      case 'in_progress': return 'bg-orange-500';
      case 'completed': return 'bg-green-500';
      case 'invoiced': return 'bg-teal-500';
      case 'reviewed': return 'bg-emerald-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <>
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Booking Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {days.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayBookings = bookingsByDate.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toString()}
                  onClick={() => dayBookings.length > 0 && setSelectedDate(dateKey)}
                  className={cn(
                    "min-h-[100px] rounded-lg border p-2 transition-colors",
                    isCurrentMonth ? "bg-card border-border" : "bg-muted/30 border-muted",
                    isToday && "ring-2 ring-primary",
                    dayBookings.length > 0 && "cursor-pointer hover:bg-secondary/50"
                  )}
                >
                  <div className={cn("text-sm font-medium mb-2", isCurrentMonth ? "text-foreground" : "text-muted-foreground")}>
                    {format(day, "d")}
                  </div>
                  {dayBookings.length > 0 && (
                    <div className="space-y-1">
                      <Badge variant="secondary" className="w-full text-xs">
                        {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                      </Badge>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dayBookings.slice(0, 3).map((booking, idx) => (
                          <div
                            key={idx}
                            className="h-1.5 rounded-full flex-1"
                            style={{ backgroundColor: booking.farmer_color }}
                            title={booking.farmer_name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Bookings List Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Bookings for {selectedDate && format(new Date(selectedDate), "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3">
              {selectedDate && bookingsByDate.get(selectedDate)?.map((booking) => (
                <button
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className="w-full p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-16 rounded-full" style={{ backgroundColor: booking.farmer_color }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold">{booking.farmer_name}</h4>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{booking.activity_name} • {booking.area_acres} acres</p>
                      {booking.quoted_price && (
                        <p className="text-sm font-medium mt-1">₹{booking.quoted_price.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedBooking.farmer_color }} />
                <div>
                  <h3 className="font-semibold text-lg">{selectedBooking.farmer_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedBooking.farmer_village}</p>
                </div>
                <Badge className={cn("ml-auto", getStatusColor(selectedBooking.status))}>
                  {getStatusLabel(selectedBooking.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Activity</p>
                  <p className="font-medium">{selectedBooking.activity_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Area</p>
                  <p className="font-medium">{selectedBooking.area_acres} acres</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedBooking.requested_date), "MMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quoted Price</p>
                  <p className="font-medium">₹{selectedBooking.quoted_price?.toLocaleString() || 'N/A'}</p>
                </div>
                {selectedBooking.farmer_contact && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{selectedBooking.farmer_contact}</p>
                  </div>
                )}
                {selectedBooking.mukkadam_name && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Allocated To</p>
                    <p className="font-medium">{selectedBooking.mukkadam_name}</p>
                  </div>
                )}
              </div>

              {selectedBooking.call_notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Call Notes</p>
                  <p className="text-sm bg-secondary/30 p-3 rounded-lg">{selectedBooking.call_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}