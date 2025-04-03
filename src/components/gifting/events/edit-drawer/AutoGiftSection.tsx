
import React from "react";
import { Gift } from "lucide-react";
import { GiftSource } from "./types";
import AutoGiftToggle from "./gift-settings/AutoGiftToggle";
import GiftAmountInput from "./gift-settings/GiftAmountInput";
import GiftSourceSelector from "./gift-settings/GiftSourceSelector";

interface AutoGiftSectionProps {
  autoGiftEnabled: boolean;
  autoGiftAmount: number;
  giftSource: GiftSource;
  setAutoGiftEnabled: (value: boolean) => void;
  setAutoGiftAmount: (value: number) => void;
  setGiftSource: (value: GiftSource) => void;
}

const AutoGiftSection = ({
  autoGiftEnabled,
  autoGiftAmount,
  giftSource,
  setAutoGiftEnabled,
  setAutoGiftAmount,
  setGiftSource,
}: AutoGiftSectionProps) => {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 mb-0">
        <Gift className="h-2.5 w-2.5 text-primary" />
        <h3 className="text-xs font-medium">Auto-Gifting Settings</h3>
      </div>
      
      <AutoGiftToggle 
        enabled={autoGiftEnabled} 
        setEnabled={setAutoGiftEnabled} 
      />
      
      {autoGiftEnabled && (
        <div className="space-y-0.5 animate-in fade-in-50 duration-100">
          <GiftAmountInput 
            amount={autoGiftAmount} 
            setAmount={setAutoGiftAmount} 
          />
          
          <GiftSourceSelector 
            giftSource={giftSource} 
            setGiftSource={setGiftSource} 
          />
        </div>
      )}
    </div>
  );
};

export default AutoGiftSection;
