/**
 * TrunklineCancelDialog
 * 
 * Admin-only order cancellation dialog for Trunkline.
 * Triggers Zinc API cancellation via cancel-zinc-order edge function.
 * 
 * Only accessible by Elyphant.com employees through Trunkline interface.
 */
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle } from "lucide-react";

interface TrunklineCancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isProcessing: boolean;
  orderNumber: string;
  orderStatus: string;
  orderAmount: number;
}

const TrunklineCancelDialog: React.FC<TrunklineCancelDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  orderNumber,
  orderStatus,
  orderAmount,
}) => {
  const [selectedReason, setSelectedReason] = useState("admin_request");
  const [customReason, setCustomReason] = useState("");

  const predefinedReasons = [
    { value: "admin_request", label: "Admin cancellation request" },
    { value: "customer_request", label: "Customer requested cancellation" },
    { value: "fraud_prevention", label: "Fraud prevention" },
    { value: "inventory_issue", label: "Inventory/fulfillment issue" },
    { value: "payment_issue", label: "Payment issue" },
    { value: "other", label: "Other reason" }
  ];

  const handleConfirm = () => {
    const reason = selectedReason === "other" ? customReason : 
                  predefinedReasons.find(r => r.value === selectedReason)?.label || selectedReason;
    onConfirm(reason);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Cancel Order with Zinc #{orderNumber}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                This will send a cancellation request to Zinc for order fulfillment.
              </p>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Zinc Cancellation Policy:</strong>
                </p>
                <ul className="text-sm text-blue-800 list-disc list-inside mt-2 space-y-1">
                  <li>Pre-shipment cancellation only</li>
                  <li>~50% enter "attempting_to_cancel" state</li>
                  <li>Webhook will update status when resolved</li>
                </ul>
              </div>

              {orderStatus === 'cancellation_pending' && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-800">
                    <strong>Note:</strong> This order is already pending cancellation.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Label>Cancellation Reason</Label>
                <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                  {predefinedReasons.map((reason) => (
                    <div key={reason.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={reason.value} id={reason.value} />
                      <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {selectedReason === 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="customReason">Specify Reason</Label>
                    <Textarea
                      id="customReason"
                      placeholder="Enter cancellation reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Order Amount:</span>
                  <span className="font-medium text-slate-900">${orderAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>
            Keep Order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isProcessing || (selectedReason === 'other' && !customReason.trim())}
            className="bg-red-600 hover:bg-red-700"
          >
            {isProcessing ? 'Cancelling...' : 'Cancel Order with Zinc'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TrunklineCancelDialog;
