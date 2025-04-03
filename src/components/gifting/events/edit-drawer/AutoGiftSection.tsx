
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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        <h3 className="text-md font-medium">Auto-Gifting Settings</h3>
      </div>
      
      <AutoGiftToggle 
        enabled={autoGiftEnabled} 
        setEnabled={setAutoGiftEnabled} 
      />
      
      {autoGiftEnabled && (
        <div className="space-y-3 animate-in fade-in-50 slide-in-from-top-5 duration-300">
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
