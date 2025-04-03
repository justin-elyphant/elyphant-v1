
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DollarSign, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  // Function to increment the gift amount
  const incrementAmount = () => {
    setAutoGiftAmount(Math.min(autoGiftAmount + 5, 500)); // Cap at $500
  };

  // Function to decrement the gift amount
  const decrementAmount = () => {
    setAutoGiftAmount(Math.max(autoGiftAmount - 5, 0)); // Minimum $0
  };

  // Handle direct input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      // Ensure the value is between 0 and 500
      setAutoGiftAmount(Math.min(Math.max(value, 0), 500));
    }
  };

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
            <Label htmlFor="gift-amount" className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Gift Amount
            </Label>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                type="button" 
                onClick={decrementAmount}
                className="h-8 w-8"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="gift-amount"
                  type="number"
                  value={autoGiftAmount}
                  onChange={handleAmountChange}
                  className="pl-8 text-center"
                  min={0}
                  max={500}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                type="button" 
                onClick={incrementAmount}
                className="h-8 w-8"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Minimum: $0</span>
              <span>Maximum: $500</span>
            </div>
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
