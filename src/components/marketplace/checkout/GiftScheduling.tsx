
import React from "react";
import { FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

export interface GiftOptions {
  isGift: boolean;
  giftMessage?: string;
  giftWrapping?: boolean;
  scheduleDelivery?: boolean;
  sendGiftMessage?: boolean;
  isSurprise?: boolean;
}

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
    
    // Create a simple update object with just the changed field
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
          <FormLabel htmlFor="scheduleDelivery" className="cursor-pointer">
            Schedule delivery for a specific date
          </FormLabel>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="sendGiftMessage" 
            checked={Boolean(giftOptions.sendGiftMessage)}
            onCheckedChange={() => handleCheckboxChange('sendGiftMessage')}
          />
          <FormLabel htmlFor="sendGiftMessage" className="cursor-pointer">
            Send gift message ahead of delivery
          </FormLabel>
        </div>
        
        {giftOptions.isSurprise !== undefined && (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isSurprise" 
              checked={Boolean(giftOptions.isSurprise)}
              onCheckedChange={() => handleCheckboxChange('isSurprise')}
            />
            <FormLabel htmlFor="isSurprise" className="cursor-pointer">
              Keep as a surprise (don't notify recipient)
            </FormLabel>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftScheduling;
