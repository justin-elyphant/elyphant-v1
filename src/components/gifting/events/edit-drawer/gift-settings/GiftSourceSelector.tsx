
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
    <div className="space-y-0.5 py-1">
      <Label className="text-xs font-medium">Gift Selection Source</Label>
      <RadioGroup 
        value={giftSource} 
        onValueChange={(value: GiftSource) => setGiftSource(value)}
        className="flex flex-col gap-1 mt-0.5"
      >
        <div className="flex items-center space-x-2 py-0.5 px-2 rounded hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
          <RadioGroupItem value="wishlist" id="wishlist" className="h-3 w-3 text-primary border-primary/50" />
          <Label htmlFor="wishlist" className="cursor-pointer text-xs leading-none">From wishlist</Label>
        </div>
        <div className="flex items-center space-x-2 py-0.5 px-2 rounded hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
          <RadioGroupItem value="ai" id="ai" className="h-3 w-3 text-primary border-primary/50" />
          <Label htmlFor="ai" className="cursor-pointer text-xs leading-none">AI selected</Label>
        </div>
        <div className="flex items-center space-x-2 py-0.5 px-2 rounded hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
          <RadioGroupItem value="both" id="both" className="h-3 w-3 text-primary border-primary/50" />
          <Label htmlFor="both" className="cursor-pointer text-xs leading-none">Wishlist + AI</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default GiftSourceSelector;
