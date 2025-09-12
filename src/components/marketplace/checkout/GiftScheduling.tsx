
import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { GiftOptions } from "@/types/gift-options";

interface GiftSchedulingProps {
  giftOptions: GiftOptions;
  onChange: (options: Partial<GiftOptions>) => void;
}

const GiftScheduling: React.FC<GiftSchedulingProps> = ({ 
  giftOptions, 
  onChange 
}) => {
  console.log("GiftScheduling component rendered with props:", giftOptions);

  const handleCheckboxChange = (field: keyof GiftOptions) => {
    console.log(`Toggling ${field} from ${giftOptions[field]} to ${!giftOptions[field]}`);
    
    const updates = {
      [field]: !giftOptions[field]
    };
    
    console.log("Sending updates:", updates);
    onChange(updates);
  };

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <h3 className="font-medium text-lg">Gift Scheduling Options</h3>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="scheduleDelivery" 
            checked={Boolean(giftOptions.scheduleDelivery)}
            onCheckedChange={() => handleCheckboxChange('scheduleDelivery')}
          />
          <Label htmlFor="scheduleDelivery" className="cursor-pointer">
            Schedule delivery for a specific date
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="sendGiftMessage" 
            checked={Boolean(giftOptions.sendGiftMessage)}
            onCheckedChange={() => handleCheckboxChange('sendGiftMessage')}
          />
          <Label htmlFor="sendGiftMessage" className="cursor-pointer">
            Send gift message ahead of delivery
          </Label>
        </div>
        
        {(giftOptions.isSurprise !== undefined || giftOptions.isSurpriseGift !== undefined) && (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isSurprise" 
              checked={Boolean(giftOptions.isSurprise || giftOptions.isSurpriseGift)}
              onCheckedChange={() => handleCheckboxChange(giftOptions.isSurprise !== undefined ? 'isSurprise' : 'isSurpriseGift')}
            />
            <Label htmlFor="isSurprise" className="cursor-pointer">
              Keep as a surprise (don't notify recipient)
            </Label>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftScheduling;
