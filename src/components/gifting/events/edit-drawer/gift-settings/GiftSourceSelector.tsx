
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GiftSource } from "../types";

interface GiftSourceSelectorProps {
  giftSource: GiftSource;
  setGiftSource: (value: GiftSource) => void;
}

const GiftSourceSelector = ({ giftSource, setGiftSource }: GiftSourceSelectorProps) => {
  return (
    <div className="space-y-1">
      <Label htmlFor="gift-source" className="text-xs text-muted-foreground">Gift Source</Label>
      <RadioGroup 
        id="gift-source" 
        value={giftSource} 
        onValueChange={(value) => setGiftSource(value as GiftSource)}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="wishlist" id="gift-source-wishlist" />
          <Label htmlFor="gift-source-wishlist" className="text-xs cursor-pointer">Wishlist</Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="ai" id="gift-source-ai" />
          <Label htmlFor="gift-source-ai" className="text-xs cursor-pointer">AI Suggest</Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="both" id="gift-source-both" />
          <Label htmlFor="gift-source-both" className="text-xs cursor-pointer">Both</Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="specific" id="gift-source-specific" />
          <Label htmlFor="gift-source-specific" className="text-xs cursor-pointer">Specific Product</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default GiftSourceSelector;
