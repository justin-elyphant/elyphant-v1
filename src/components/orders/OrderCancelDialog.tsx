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

interface OrderCancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isProcessing: boolean;
  orderNumber: string;
  orderStatus: string;
  orderAmount: number;
}

const OrderCancelDialog: React.FC<OrderCancelDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  orderNumber,
  orderStatus,
  orderAmount
}) => {
  const [selectedReason, setSelectedReason] = useState("changed_mind");
  const [customReason, setCustomReason] = useState("");

  const predefinedReasons = [
    { value: "changed_mind", label: "Changed my mind" },
    { value: "found_better_price", label: "Found a better price elsewhere" },
    { value: "delivery_too_slow", label: "Delivery taking too long" },
    { value: "wrong_item", label: "Ordered wrong item" },
    { value: "no_longer_needed", label: "No longer needed" },
    { value: "other", label: "Other reason" }
  ];

  const handleConfirm = () => {
    const reason = selectedReason === "other" ? customReason : 
                  predefinedReasons.find(r => r.value === selectedReason)?.label || selectedReason;
    onConfirm(reason);
  };

  const isHighValue = orderAmount > 200;
  const isProcessingStatus = orderStatus === 'processing';
  const isRetryPending = orderStatus === 'retry_pending';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Cancel Order #{orderNumber}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              
              {isProcessingStatus && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> This order is currently being processed. 
                    Cancellation may take some time to complete.
                  </p>
                </div>
              )}

              {isRetryPending && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-800">
                    <strong>Retry Pending:</strong> This order is currently pending retry. 
                    Cancelling will stop all retry attempts and process a refund.
                  </p>
                </div>
              )}

              {isHighValue && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>High Value Order:</strong> This is a ${orderAmount.toFixed(2)} order. 
                    Our team will review the cancellation to ensure proper refund processing.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Please tell us why you're cancelling:
                </Label>
                <RadioGroup 
                  value={selectedReason} 
                  onValueChange={setSelectedReason}
                  className="space-y-2"
                >
                  {predefinedReasons.map((reason) => (
                    <div key={reason.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={reason.value} id={reason.value} />
                      <Label 
                        htmlFor={reason.value} 
                        className="text-sm cursor-pointer"
                      >
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {selectedReason === "other" && (
                  <div className="mt-3">
                    <Label htmlFor="custom-reason" className="text-sm">
                      Please specify:
                    </Label>
                    <Textarea
                      id="custom-reason"
                      placeholder="Please explain why you're cancelling..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Refund Information:</strong> If payment was processed, 
                  your refund will be issued within 3-5 business days.
                </p>
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
            disabled={isProcessing || (selectedReason === "other" && !customReason.trim())}
            className="bg-red-600 hover:bg-red-700"
          >
            {isProcessing ? 'Cancelling...' : 'Cancel Order'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OrderCancelDialog;