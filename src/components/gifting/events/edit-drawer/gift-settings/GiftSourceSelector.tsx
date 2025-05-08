
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
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="specific" id="specific" />
          <Label htmlFor="specific">Specific product</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default GiftSourceSelector;
