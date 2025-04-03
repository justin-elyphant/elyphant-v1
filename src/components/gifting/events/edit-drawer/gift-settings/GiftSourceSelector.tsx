
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
    <div className="space-y-0.5">
      <Label className="text-[10px] font-medium">Gift Selection Source</Label>
      <RadioGroup 
        value={giftSource} 
        onValueChange={(value: GiftSource) => setGiftSource(value)}
        className="flex flex-col gap-0"
      >
        <div className="flex items-center space-x-1.5 py-0 px-1 rounded hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
          <RadioGroupItem value="wishlist" id="wishlist" className="h-2.5 w-2.5 text-primary border-primary/50" />
          <Label htmlFor="wishlist" className="cursor-pointer text-[10px]">From wishlist</Label>
        </div>
        <div className="flex items-center space-x-1.5 py-0 px-1 rounded hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
          <RadioGroupItem value="ai" id="ai" className="h-2.5 w-2.5 text-primary border-primary/50" />
          <Label htmlFor="ai" className="cursor-pointer text-[10px]">AI selected</Label>
        </div>
        <div className="flex items-center space-x-1.5 py-0 px-1 rounded hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
          <RadioGroupItem value="both" id="both" className="h-2.5 w-2.5 text-primary border-primary/50" />
          <Label htmlFor="both" className="cursor-pointer text-[10px]">Wishlist + AI</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default GiftSourceSelector;
