import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Users, Search, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarAvailability } from "./Calendar";
import { MukadamAvailabilityDialog } from "@/components/MukadamAvail";
interface ActivityRate {
  id: string;
  activity_name: string;
  rate_per_acre: number;
}

interface Mukadam {
  id: string;
  mukkadam_name: string;
  contact: string;
  location: string;
  number_of_labourers: number;
  is_active: boolean;
  activity_rates: ActivityRate[];
  is_currently_available?: boolean;
  busy_dates?: Array<{
    date: string;
    farmer: string;
    activity: string;
    status: string;
  }>;
}

// Add to interface
interface AvailabilityPeriod {
  id: string;
  start_date: string;
  end_date: string;
  notes: string;
}

interface Mukadam {
  id: string;
  mukkadam_name: string;
  contact: string;
  location: string;
  number_of_labourers: number;
  is_active: boolean;
  activity_rates: ActivityRate[];
  availability_periods: AvailabilityPeriod[];  // ✅ ADD
  is_currently_available?: boolean;
  busy_dates?: Array<{
    date: string;
    farmer: string;
    activity: string;
    status: string;
  }>;
}


const LabourTeamsDjango = () => {
  const [searchDate, setSearchDate] = useState<Date | undefined>();
  const [searchEndDate, setSearchEndDate] = useState<Date | undefined>();
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [selectedMukadam, setSelectedMukadam] = useState<Mukadam | null>(null);

  const queryClient = useQueryClient();

  // Fetch all mukadams
  const { data: allMukadams, isLoading } = useQuery({
    queryKey: ["mukadams-list"],
    queryFn: async (): Promise<Mukadam[]> => {
      const response = await fetch("http://127.0.0.1:8000/api/mukadams/list_with_availability/");
      if (!response.ok) throw new Error("Failed to fetch mukadams");
      return response.json();
    },
  });

  // Fetch filtered mukadams when date filter is active
  const { data: filteredData, isLoading: isFilterLoading } = useQuery({
    queryKey: ["mukadams-filtered", searchDate, searchEndDate],
    queryFn: async () => {
      if (!searchDate) return null;
      
      const startDate = format(searchDate, "yyyy-MM-dd");
      const endDate = searchEndDate ? format(searchEndDate, "yyyy-MM-dd") : startDate;
      
      const response = await fetch(
        `http://127.0.0.1:8000/api/mukadams/available_for_date_range/?start_date=${startDate}&end_date=${endDate}`
      );
      if (!response.ok) throw new Error("Failed to fetch filtered mukadams");
      return response.json();
    },
    enabled: showAvailableOnly && !!searchDate,
  });

  const displayedMukadams = showAvailableOnly && filteredData 
    ? filteredData.available_mukadams 
    : allMukadams || [];

  const availableCount = filteredData?.available_count || allMukadams?.filter(m => m.is_currently_available).length || 0;
  const totalCount = allMukadams?.length || 0;

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
            <h1 className="text-3xl font-bold text-foreground">Labour Teams (Mukadams)</h1>
            <p className="text-muted-foreground mt-1">Manage your labour teams and their availability</p>
          </div>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
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

                  <Button onClick={handleSearch} disabled={!searchDate || isFilterLoading}>
                    <Search className="mr-2 h-4 w-4" />
                    {isFilterLoading ? "Searching..." : "Search Available"}
                  </Button>

                  {showAvailableOnly && (
                    <Button variant="outline" onClick={clearSearch}>
                      Clear Filter
                    </Button>
                  )}

                  <Badge variant="secondary" className="ml-auto">
                    {availableCount} / {totalCount} teams available
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {isLoading ? (
              <div className="text-center py-12">Loading teams...</div>
            ) : displayedMukadams && displayedMukadams.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {displayedMukadams.map((mukadam: Mukadam) => (
                  <Card 
                    key={mukadam.id}
                    className={cn(
                      showAvailableOnly && "border-green-500 border-2"
                    )}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          <CardTitle>{mukadam.mukkadam_name}</CardTitle>
                          {showAvailableOnly && (
                            <Badge className="bg-green-500">Available</Badge>
                          )}
                          {!showAvailableOnly && mukadam.is_currently_available && (
                            <Badge variant="outline" className="bg-green-100">Free</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Labourers:</span>
                          <p className="font-medium">{mukadam.number_of_labourers}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Contact:</span>
                          <p className="font-medium">{mukadam.contact}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Location:</span>
                          <p className="font-medium">{mukadam.location}</p>
                        </div>
                        
                      </div>

                      {mukadam.activity_rates && mukadam.activity_rates.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Activity Rates:</p>
                          <div className="space-y-1">
                            {mukadam.activity_rates.map((rate) => (
                              <div key={rate.id || rate.activity_name} className="flex justify-between text-sm">
                                <span>{rate.activity_name}</span>
                                <span className="font-medium">₹{rate.rate_per_acre}/acre</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {mukadam.busy_dates && mukadam.busy_dates.length > 0 && (
                        <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded">
                          <p className="text-sm font-medium text-orange-600 mb-2">Busy on:</p>
                          <div className="space-y-1">
                            {mukadam.busy_dates.map((busy, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="font-medium">{format(new Date(busy.date), "MMM d")}</span>
                                {" - "}
                                <span>{busy.farmer}</span>
                                {" - "}
                                <span className="text-muted-foreground">{busy.activity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
{/* ✅ ADD Availability Periods Display */}
  {mukadam.availability_periods && mukadam.availability_periods.length > 0 && (
    <div>
      <p className="text-sm text-muted-foreground mb-2">Availability Periods:</p>
      <div className="space-y-1">
        {mukadam.availability_periods.map((period) => (
          <div 
            key={period.id} 
            className="text-sm p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200"
          >
            <p className="font-medium text-green-700 dark:text-green-300">
              {format(new Date(period.start_date), "MMM d")} - {format(new Date(period.end_date), "MMM d, yyyy")}
            </p>
            {period.notes && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {period.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )}

  {/* Show message if no availability periods */}
  {(!mukadam.availability_periods || mukadam.availability_periods.length === 0) && (
    <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200">
      <p className="text-sm text-orange-600 dark:text-orange-400">
        ⚠️ No availability periods set
      </p>
    </div>
  )}

  <Button
    variant="outline"
    size="sm"
    onClick={() => setSelectedMukadam(mukadam)}
    className="w-full"
  >
    <CalendarIcon className="mr-2 h-4 w-4" />
    Manage Availability
  </Button>
</CardContent>
                  </Card>
                ))}
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
                  <p className="text-muted-foreground">No labour teams found.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarAvailability />
          </TabsContent>
        </Tabs>
      </div>

      <MukadamAvailabilityDialog
  mukadam={selectedMukadam}
  open={!!selectedMukadam}
  onOpenChange={(open) => !open && setSelectedMukadam(null)}
/>
    </Layout>
  );
};

export default LabourTeamsDjango;