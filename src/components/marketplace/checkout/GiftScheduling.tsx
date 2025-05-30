
import React from "react";
import { FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

export interface GiftSchedulingOptions {
  scheduleDelivery: boolean;
  sendGiftMessage: boolean;
  isSurprise?: boolean;
}

interface GiftSchedulingProps {
  giftScheduling: GiftSchedulingOptions;
  onUpdate: (options: Partial<GiftSchedulingOptions>) => void;
}

const GiftScheduling: React.FC<GiftSchedulingProps> = ({ 
  giftScheduling, 
  onUpdate 
}) => {
  console.log("GiftScheduling component rendered with props:", giftScheduling);

  const handleCheckboxChange = (field: keyof GiftSchedulingOptions) => {
    console.log(`Toggling ${field} from ${giftScheduling[field]} to ${!giftScheduling[field]}`);
    
    // Create a simple update object with just the changed field
    const updates = {
      [field]: !giftScheduling[field]
    };
    
    console.log("Sending updates:", updates);
    onUpdate(updates);
  };

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <h3 className="font-medium text-lg">Gift Scheduling Options</h3>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="scheduleDelivery" 
            checked={Boolean(giftScheduling.scheduleDelivery)}
            onCheckedChange={() => handleCheckboxChange('scheduleDelivery')}
          />
          <FormLabel htmlFor="scheduleDelivery" className="cursor-pointer">
            Schedule delivery for a specific date
          </FormLabel>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="sendGiftMessage" 
            checked={Boolean(giftScheduling.sendGiftMessage)}
            onCheckedChange={() => handleCheckboxChange('sendGiftMessage')}
          />
          <FormLabel htmlFor="sendGiftMessage" className="cursor-pointer">
            Send gift message ahead of delivery
          </FormLabel>
        </div>
        
        {giftScheduling.isSurprise !== undefined && (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isSurprise" 
              checked={Boolean(giftScheduling.isSurprise)}
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
