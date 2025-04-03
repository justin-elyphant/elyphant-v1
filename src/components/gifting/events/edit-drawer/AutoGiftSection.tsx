
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DollarSign, Plus, Minus, Gift } from "lucide-react";
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
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        <h3 className="text-md font-medium">Auto-Gifting Settings</h3>
      </div>
      
      <Card className="p-4 border border-primary/20 bg-gradient-to-r from-purple-50/50 to-white dark:from-purple-900/10 dark:to-transparent">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-gift" className="font-medium">Enable Auto-Gifting</Label>
            <p className="text-sm text-muted-foreground">
              Automatically send a gift for this occasion
            </p>
          </div>
          <Switch
            id="auto-gift"
            checked={autoGiftEnabled}
            onCheckedChange={setAutoGiftEnabled}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </Card>
      
      {autoGiftEnabled && (
        <div className="space-y-4 animate-in fade-in-50 slide-in-from-top-5 duration-300 pl-2">
          <div className="space-y-2">
            <Label htmlFor="gift-amount" className="flex items-center text-sm font-medium">
              <DollarSign className="h-4 w-4 mr-1 text-primary" />
              Gift Amount
            </Label>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                type="button" 
                onClick={decrementAmount}
                className="h-8 w-8 border-primary/20 text-primary"
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
                  className="pl-8 text-center focus-visible:ring-primary/50 border-primary/20"
                  min={0}
                  max={500}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                type="button" 
                onClick={incrementAmount}
                className="h-8 w-8 border-primary/20 text-primary"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
              <span>Min: $0</span>
              <span>Max: $500</span>
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <Label className="text-sm font-medium">Gift Selection Source</Label>
            <RadioGroup 
              value={giftSource} 
              onValueChange={(value: GiftSource) => setGiftSource(value)}
              className="space-y-2 mt-1"
            >
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                <RadioGroupItem value="wishlist" id="wishlist" className="text-primary border-primary/50" />
                <Label htmlFor="wishlist" className="cursor-pointer">From wishlist</Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                <RadioGroupItem value="ai" id="ai" className="text-primary border-primary/50" />
                <Label htmlFor="ai" className="cursor-pointer">AI selected</Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                <RadioGroupItem value="both" id="both" className="text-primary border-primary/50" />
                <Label htmlFor="both" className="cursor-pointer">Wishlist + AI</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoGiftSection;
