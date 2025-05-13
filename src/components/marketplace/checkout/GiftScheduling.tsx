
import React from "react";
import { FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

export interface GiftSchedulingOptions {
  scheduleDelivery: boolean;
  sendGiftMessage: boolean;
  isSurprise?: boolean; // Optional field to maintain compatibility
}

interface GiftSchedulingProps {
  giftScheduling: GiftSchedulingOptions;
  onUpdate: (options: GiftSchedulingOptions) => void;
}

const GiftScheduling: React.FC<GiftSchedulingProps> = ({ 
  giftScheduling, 
  onUpdate 
}) => {
  const handleCheckboxChange = (field: keyof GiftSchedulingOptions) => {
    // Create a copy of the current options and toggle the selected field
    const updatedOptions = {
      ...giftScheduling,
      [field]: !Boolean(giftScheduling[field])
    };
    onUpdate(updatedOptions);
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
