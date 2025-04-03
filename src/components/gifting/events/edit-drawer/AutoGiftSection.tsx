
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DollarSign } from "lucide-react";
import { GiftSource } from "./types";

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
    <div className="space-y-4">
      <h3 className="text-md font-medium">Auto-Gifting Settings</h3>
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="auto-gift">Enable Auto-Gifting</Label>
          <p className="text-sm text-muted-foreground">
            Automatically send a gift for this occasion
          </p>
        </div>
        <Switch
          id="auto-gift"
          checked={autoGiftEnabled}
          onCheckedChange={setAutoGiftEnabled}
        />
      </div>
      
      {autoGiftEnabled && (
        <>
          <div className="space-y-2">
            <Label htmlFor="gift-amount">
              <DollarSign className="h-4 w-4 mr-2 inline-block" />
              Gift Amount
            </Label>
            <Input
              id="gift-amount"
              type="number"
              value={autoGiftAmount}
              onChange={(e) => setAutoGiftAmount(Number(e.target.value))}
              placeholder="Gift budget in dollars"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Gift Selection Source</Label>
            <RadioGroup 
              value={giftSource} 
              onValueChange={(value: GiftSource) => setGiftSource(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wishlist" id="wishlist" />
                <Label htmlFor="wishlist">From wishlist</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ai" id="ai" />
                <Label htmlFor="ai">AI selected</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both">Wishlist + AI</Label>
              </div>
            </RadioGroup>
          </div>
        </>
      )}
    </div>
  );
};

export default AutoGiftSection;
