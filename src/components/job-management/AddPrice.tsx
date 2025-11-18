import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { IndianRupee, TrendingUp, Users, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

interface AutoPriceDialogProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPriced: () => void;
}

export function AutoPriceDialog({ job, open, onOpenChange, onPriced }: AutoPriceDialogProps) {
  const [selectedMukadams, setSelectedMukadams] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Auto-price mutation
  const autoPriceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `http://127.0.0.1:8000/api/jobs/${job.id}/auto_price/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to set price");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Price set at ₹${data.pricing.your_price_per_acre}/acre`);
      queryClient.invalidateQueries({ queryKey: ["simple-jobs"] });
      // Trigger recommendations fetch
      recommendationsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // Get recommendations
  const recommendationsQuery = useQuery({
    queryKey: ["job-recommendations", job?.id],
    queryFn: async () => {
      if (!job?.id) return null;
      const response = await fetch(
        `http://127.0.0.1:8000/api/jobs/${job.id}/recommended_mukadams/`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get recommendations");
      }
      return response.json();
    },
    enabled: open && !!job?.id && job?.status === 'priced'
  });

  // Notify mukadams mutation
  const notifyMutation = useMutation({
    mutationFn: async (mukadamIds: string[]) => {
      const response = await fetch(
        `http://127.0.0.1:8000/api/jobs/${job.id}/notify_mukadams/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mukadam_ids: mukadamIds })
        }
      );
      if (!response.ok) throw new Error("Failed to notify");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Notified ${selectedMukadams.length} mukadams!`);
      queryClient.invalidateQueries({ queryKey: ["simple-jobs"] });
      onPriced();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleAutoPriceAndContinue = async () => {
    await autoPriceMutation.mutateAsync();
  };

  const handleNotifySelected = () => {
    if (selectedMukadams.length === 0) {
      toast.error("Please select at least one mukadam");
      return;
    }
    notifyMutation.mutate(selectedMukadams);
  };

  const toggleMukadam = (mukadamId: string) => {
    setSelectedMukadams(prev =>
      prev.includes(mukadamId)
        ? prev.filter(id => id !== mukadamId)
        : [...prev, mukadamId]
    );
  };

  if (!job) return null;

  const recommendations = recommendationsQuery.data?.recommendations || [];
  const isPrice = job.status === 'priced';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Auto-Price & Notify Mukadams</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {job.farmer.name} - {job.activity.name} - {job.farm_size_acres} acres
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Auto-Price */}
          {!isPrice && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Step 1: Set Your Price</h3>
                    <p className="text-sm text-muted-foreground">
                      Auto-price based on your activity rates
                    </p>
                  </div>
                  <Badge>Farmer Budget: ₹{job.farmer_price_per_acre}/acre</Badge>
                </div>

                <Button
                  onClick={handleAutoPriceAndContinue}
                  disabled={autoPriceMutation.isPending}
                  size="lg"
                  className="w-full"
                >
                  {autoPriceMutation.isPending ? "Setting Price..." : "Auto-Price This Job"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Recommended Mukadams */}
          {isPrice && (
            <>
              <Card className="bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">Price Set Successfully!</h3>
                  </div>
                  <p className="text-sm">
                    Your rate: ₹{job.your_price_per_acre}/acre • 
                    Your margin: ₹{((job.farmer_price_per_acre - job.your_price_per_acre) * job.farm_size_acres).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Step 2: Select Mukadams to Notify</h3>
                    <p className="text-sm text-muted-foreground">
                      Recommendations based on rates, availability & performance
                    </p>
                  </div>
                  {selectedMukadams.length > 0 && (
                    <Badge variant="secondary">{selectedMukadams.length} selected</Badge>
                  )}
                </div>

                {recommendationsQuery.isLoading && (
                  <div className="text-center py-12">Loading recommendations...</div>
                )}

                {recommendations.length === 0 && !recommendationsQuery.isLoading && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No mukadams found matching criteria. Please check mukadam rates and availability.
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recommendations.map((rec: any, index: number) => (
                    <Card
                      key={rec.mukadam.id}
                      className={`cursor-pointer transition-all ${
                        selectedMukadams.includes(rec.mukadam.id)
                          ? 'border-primary border-2 bg-primary/5'
                          : 'hover:border-primary/50'
                      } ${
                        index === 0 ? 'border-green-500 border-2' : ''
                      }`}
                      onClick={() => toggleMukadam(rec.mukadam.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedMukadams.includes(rec.mukadam.id)}
                            onCheckedChange={() => toggleMukadam(rec.mukadam.id)}
                            onClick={(e) => e.stopPropagation()}
                          />

                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{rec.mukadam.name}</p>
                                  {index === 0 && (
                                    <Badge className="bg-green-600">Top Pick</Badge>
                                  )}
                                  {rec.is_available && (
                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                      Available
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {rec.mukadam.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {rec.mukadam.team_size} workers
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  ₹{rec.cost_estimate.rate_per_acre}/acre
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Margin: ₹{rec.cost_estimate.your_margin.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {/* Reasons */}
                            <div className="flex flex-wrap gap-1">
                              {rec.reasons.map((reason: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {reason}
                                </Badge>
                              ))}
                            </div>

                            {/* Flags */}
                            {rec.flags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {rec.flags.map((flag: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs text-orange-600 border-orange-300">
                                    ⚠️ {flag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Match Score */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    rec.score >= 60 ? 'bg-green-500' :
                                    rec.score >= 40 ? 'bg-yellow-500' : 'bg-orange-500'
                                  }`}
                                  style={{ width: `${Math.min(rec.score, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">{rec.score}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNotifySelected}
                    disabled={selectedMukadams.length === 0 || notifyMutation.isPending}
                    className="flex-1"
                  >
                    {notifyMutation.isPending
                      ? "Notifying..."
                      : `Notify ${selectedMukadams.length} Mukadam${selectedMukadams.length !== 1 ? 's' : ''}`
                    }
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}