
import React from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Info } from "lucide-react";

interface PaymentSectionProps {
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onPlaceOrder: () => void;
  isProcessing: boolean;
  canPlaceOrder: boolean;
  onPrevious: () => void;
}

const PaymentSection = ({
  paymentMethod,
  onPaymentMethodChange,
  onPlaceOrder,
  isProcessing,
  canPlaceOrder,
  onPrevious
}: PaymentSectionProps) => {
  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-medium mb-4">Payment Method</h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input 
            type="radio" 
            id="card-payment" 
            name="payment-method"
            checked={paymentMethod === "card"}
            onChange={() => onPaymentMethodChange("card")}
            className="mr-2"
          />
          <label htmlFor="card-payment" className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Credit/Debit Card
          </label>
        </div>
        
        {/* Card payment form would go here in a real implementation */}
        <div className="pl-6 text-sm text-muted-foreground flex items-center">
          <Info className="h-4 w-4 mr-2" />
          For demo purposes, clicking "Place Order" will simulate payment
        </div>
      </div>
      
      {/* Additional payment methods would be added here */}
      
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onPrevious}>
          Back to Scheduling
        </Button>
        <Button 
          onClick={onPlaceOrder}
          disabled={isProcessing || !canPlaceOrder}
        >
          {isProcessing ? "Processing..." : "Place Order"}
        </Button>
      </div>
    </div>
  );
};

export default PaymentSection;
