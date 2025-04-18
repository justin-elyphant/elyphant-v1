
import React from "react";
import { Gift } from "lucide-react";
import { GiftSource } from "./types";
import AutoGiftToggle from "./gift-settings/AutoGiftToggle";
import GiftAmountInput from "./gift-settings/GiftAmountInput";
import GiftSourceSelector from "./gift-settings/GiftSourceSelector";
import PaymentMethodSelector from "./gift-settings/PaymentMethodSelector";

interface AutoGiftSectionProps {
  autoGiftEnabled: boolean;
  autoGiftAmount: number;
  giftSource: GiftSource;
  paymentMethodId?: string;
  setAutoGiftEnabled: (value: boolean) => void;
  setAutoGiftAmount: (value: number) => void;
  setGiftSource: (value: GiftSource) => void;
  setPaymentMethodId: (value: string) => void;
}

const AutoGiftSection = ({
  autoGiftEnabled,
  autoGiftAmount,
  giftSource,
  paymentMethodId,
  setAutoGiftEnabled,
  setAutoGiftAmount,
  setGiftSource,
  setPaymentMethodId,
}: AutoGiftSectionProps) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Gift className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-sm font-medium">Auto-Gifting</h3>
      </div>
      
      <AutoGiftToggle 
        enabled={autoGiftEnabled} 
        setEnabled={setAutoGiftEnabled} 
      />
      
      {autoGiftEnabled && (
        <div className="space-y-1 animate-in fade-in-50 duration-75">
          <GiftAmountInput 
            amount={autoGiftAmount} 
            setAmount={setAutoGiftAmount} 
          />
          
          <GiftSourceSelector 
            giftSource={giftSource} 
            setGiftSource={setGiftSource} 
          />

          <PaymentMethodSelector
            selectedPaymentMethodId={paymentMethodId}
            onSelect={setPaymentMethodId}
          />
        </div>
      )}
    </div>
  );
};

export default AutoGiftSection;
