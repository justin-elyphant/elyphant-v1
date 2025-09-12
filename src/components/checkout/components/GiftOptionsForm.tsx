import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

import { GiftOptions } from "@/types/gift-options";

interface LocalGiftOptions {
  giftMessage: string;
  scheduledDeliveryDate: string;
  specialInstructions: string;
}

interface GiftOptionsFormProps {
  giftOptions: LocalGiftOptions;
  onChange: (options: LocalGiftOptions) => void;
  scheduledDate?: Date;
  onScheduledDateChange?: (date: Date | undefined) => void;
}

const GiftOptionsForm: React.FC<GiftOptionsFormProps> = ({
  giftOptions,
  onChange,
  scheduledDate,
  onScheduledDateChange
}) => {
  const handleChange = (field: keyof LocalGiftOptions, value: string) => {
    onChange({
      ...giftOptions,
      [field]: value
    });
  };

  const handleScheduledDateSelect = (date: Date | undefined) => {
    if (onScheduledDateChange) {
      onScheduledDateChange(date);
    }
    handleChange('scheduledDeliveryDate', date ? date.toISOString() : '');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gift Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="giftMessage">Gift Message</Label>
          <Textarea
            id="giftMessage"
            placeholder="Add a personal message (optional)"
            value={giftOptions.giftMessage}
            onChange={(e) => handleChange('giftMessage', e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Scheduled Delivery Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !scheduledDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a delivery date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={scheduledDate}
                onSelect={handleScheduledDateSelect}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialInstructions">Special Delivery Instructions</Label>
          <Textarea
            id="specialInstructions"
            placeholder="Leave at door, ring bell, etc. (optional)"
            value={giftOptions.specialInstructions}
            onChange={(e) => handleChange('specialInstructions', e.target.value)}
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default GiftOptionsForm;