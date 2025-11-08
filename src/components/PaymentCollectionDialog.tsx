import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { IndianRupee, Upload, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PaymentCollectionDialogProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentCollectionDialog({ booking, open, onOpenChange }: PaymentCollectionDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [laborCost, setLaborCost] = useState("");
  const [transportCost, setTransportCost] = useState("");
  const [accommodationCost, setAccommodationCost] = useState("");
  const [otherCost, setOtherCost] = useState("");
  const [notes, setNotes] = useState("");
  const [proofImage, setProofImage] = useState<string>("");
  const queryClient = useQueryClient();

  const totalCost = 
    (parseFloat(laborCost) || 0) +
    (parseFloat(transportCost) || 0) +
    (parseFloat(accommodationCost) || 0) +
    (parseFloat(otherCost) || 0);

  const balanceDue = (booking?.quoted_price || 0) - (booking?.advance_amount || 0);

  const handleSubmit = async () => {
    if (!paymentMethod) {
      toast.error("Please select payment method");
      return;
    }

    if (!laborCost) {
      toast.error("Please enter labor cost");
      return;
    }

    if (Math.abs(totalCost - balanceDue) > 0.01) {
      toast.error(`Total cost (₹${totalCost}) must equal balance due (₹${balanceDue})`);
      return;
    }

    const { error } = await supabase.from("payment_records").insert({
      job_assignment_id: booking.job_assignment_id,
      balance_amount: balanceDue,
      payment_method: paymentMethod,
      payment_date: new Date().toISOString().split('T')[0],
      labor_cost: parseFloat(laborCost),
      transport_cost: parseFloat(transportCost) || 0,
      accommodation_cost: parseFloat(accommodationCost) || 0,
      other_cost: parseFloat(otherCost) || 0,
      notes: notes || null,
      proof_image_url: proofImage || null,
      collected_by: booking.assigned_team_member,
    });

    if (error) {
      toast.error("Failed to record payment");
      return;
    }

    toast.success("Payment recorded successfully!");
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    onOpenChange(false);
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Collect Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Summary */}
          <Card className="bg-secondary/30">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Farmer:</span>
                  <span className="font-semibold">{booking.farmer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Activity:</span>
                  <span className="font-semibold">{booking.activity_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-semibold">
                    {format(new Date(booking.requested_date), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mukadam:</span>
                  <span className="font-semibold">{booking.mukkadam_name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="font-bold flex items-center">
                    <IndianRupee className="h-4 w-4" />
                    {booking.quoted_price?.toLocaleString("en-IN")}
                  </span>
                </div>
                {booking.advance_amount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Advance Paid:</span>
                    <span className="flex items-center">
                      - <IndianRupee className="h-3 w-3" />
                      {booking.advance_amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-green-700 dark:text-green-400 pt-2 border-t">
                  <span>Balance Due:</span>
                  <span className="flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {balanceDue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Cost Breakdown</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Labor Cost *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Transport Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transportCost}
                  onChange={(e) => setTransportCost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Accommodation Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={accommodationCost}
                  onChange={(e) => setAccommodationCost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Other Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={otherCost}
                  onChange={(e) => setOtherCost(e.target.value)}
                />
              </div>
            </div>

            {/* Total Validation */}
            <Card className={totalCost === balanceDue ? "border-green-500" : "border-red-500"}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Cost:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {totalCost.toLocaleString("en-IN")}
                    </span>
                    {totalCost === balanceDue && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
                {totalCost !== balanceDue && (
                  <p className="text-xs text-red-600 mt-2">
                    Must equal balance due: ₹{balanceDue.toLocaleString("en-IN")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Proof */}
          <div className="space-y-2">
            <Label>Payment Proof (Optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload screenshot or photo of payment
              </p>
              <Input
                type="text"
                placeholder="Paste image URL (for demo)"
                value={proofImage}
                onChange={(e) => setProofImage(e.target.value)}
                className="text-center"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about the payment..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button onClick={handleSubmit} className="w-full" size="lg">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Record Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}