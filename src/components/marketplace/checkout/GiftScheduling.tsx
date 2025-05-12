import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, Gift, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ContextualHelp from "@/components/help/ContextualHelp";

interface GiftSchedulingProps {
  onUpdate: (data: GiftSchedulingOptions) => void;
  giftScheduling: GiftSchedulingOptions;
  availableDates?: Date[]; // Optional prop to restrict available dates (e.g., for specific delivery windows)
}

export interface GiftSchedulingOptions {
  scheduleDelivery: boolean;
  deliveryDate?: Date;
  deliveryTime?: string;
  sendGiftMessage: boolean;
  messageDate?: Date;
  isSurprise?: boolean;
}

const GiftScheduling: React.FC<GiftSchedulingProps> = ({ 
  onUpdate, 
  giftScheduling,
  availableDates 
}) => {
  const [showDateAlert, setShowDateAlert] = useState(false);
  
  // Generate time slots for delivery
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const morningHour = i + 8; // Start from 8 AM
    const eveningHour = i + 12; // Afternoon/evening hours
    
    return [
      {
        value: `${morningHour.toString().padStart(2, '0')}:00`,
        label: `${morningHour % 12 || 12}:00 ${morningHour >= 12 ? 'PM' : 'AM'}`
      },
      {
        value: `${eveningHour.toString().padStart(2, '0')}:00`,
        label: `${eveningHour % 12 || 12}:00 PM`
      }
    ];
  }).flat();

  const handleToggleScheduleDelivery = (checked: boolean) => {
    onUpdate({
      ...giftScheduling,
      scheduleDelivery: checked,
      // Reset date and time if turning off scheduling
      deliveryDate: checked ? giftScheduling.deliveryDate : undefined,
      deliveryTime: checked ? giftScheduling.deliveryTime : undefined,
    });
  };

  const handleToggleSendMessage = (checked: boolean) => {
    onUpdate({
      ...giftScheduling,
      sendGiftMessage: checked,
      // Reset message date if turning off message
      messageDate: checked ? giftScheduling.messageDate : undefined,
    });
  };

  const handleToggleSurprise = (checked: boolean) => {
    onUpdate({
      ...giftScheduling,
      isSurprise: checked,
    });
  };

  const handleDateChange = (date?: Date) => {
    // Check if the selected date is at least 2 days in the future
    const today = new Date();
    const minDate = new Date();
    minDate.setDate(today.getDate() + 2);
    
    if (date && date < minDate) {
      setShowDateAlert(true);
    } else {
      setShowDateAlert(false);
    }
    
    onUpdate({
      ...giftScheduling,
      deliveryDate: date,
    });
  };

  const handleTimeChange = (time: string) => {
    onUpdate({
      ...giftScheduling,
      deliveryTime: time,
    });
  };

  const handleMessageDateChange = (date?: Date) => {
    onUpdate({
      ...giftScheduling,
      messageDate: date,
    });
  };

  // Determine if a date should be disabled for selection
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    const minDate = new Date();
    minDate.setDate(today.getDate() + 1); // At least next day
    
    // If availableDates is provided, only those dates are selectable
    if (availableDates && availableDates.length > 0) {
      return !availableDates.some(
        availableDate => 
          availableDate.getDate() === date.getDate() && 
          availableDate.getMonth() === date.getMonth() && 
          availableDate.getFullYear() === date.getFullYear()
      );
    }
    
    // Otherwise just ensure it's not in the past
    return date < minDate;
  };

  return (
    <div className="rounded-lg border p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-medium">Gift Scheduling</h3>
        </div>
        
        <ContextualHelp
          id="gift-scheduling-help"
          title="Gift Scheduling"
          content="Schedule when your gift should be delivered, or when a gift notification should be sent to the recipient. For surprise gifts, we'll keep all details confidential until delivery."
        />
      </div>

      <div className="space-y-6">
        {/* Schedule Delivery Option */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="schedule-delivery"
              checked={giftScheduling.scheduleDelivery}
              onCheckedChange={handleToggleScheduleDelivery}
            />
            <Label htmlFor="schedule-delivery" className="text-base cursor-pointer">
              Schedule Delivery
            </Label>
          </div>

          {giftScheduling.scheduleDelivery && (
            <div className="flex flex-col sm:flex-row gap-4 pl-6 pt-2">
              {/* Date Picker */}
              <div className="flex-1">
                <Label className="mb-2 block">Delivery Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !giftScheduling.deliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {giftScheduling.deliveryDate ? (
                        format(giftScheduling.deliveryDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={giftScheduling.deliveryDate}
                      onSelect={handleDateChange}
                      initialFocus
                      disabled={isDateDisabled}
                    />
                  </PopoverContent>
                </Popover>
                
                {showDateAlert && (
                  <Alert variant="destructive" className="mt-2 py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      For scheduled deliveries, please select a date at least 2 days in advance.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Time Picker */}
              <div className="flex-1">
                <Label className="mb-2 block">Delivery Time</Label>
                <Select
                  value={giftScheduling.deliveryTime}
                  onValueChange={handleTimeChange}
                  disabled={!giftScheduling.deliveryDate}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {giftScheduling.deliveryTime ? (
                          timeSlots.find(slot => slot.value === giftScheduling.deliveryTime)?.label
                        ) : (
                          "Select time"
                        )}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Send Gift Message Option */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="send-gift-message"
              checked={giftScheduling.sendGiftMessage}
              onCheckedChange={handleToggleSendMessage}
            />
            <Label htmlFor="send-gift-message" className="text-base cursor-pointer">
              Schedule Gift Message
            </Label>
          </div>

          {giftScheduling.sendGiftMessage && (
            <div className="pl-6 pt-2">
              <Label className="mb-2 block">Message Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full md:w-[240px] justify-start text-left font-normal",
                      !giftScheduling.messageDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {giftScheduling.messageDate ? (
                      format(giftScheduling.messageDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={giftScheduling.messageDate}
                    onSelect={handleMessageDateChange}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground mt-2">
                The gift recipient will receive a notification on this date.
              </p>
            </div>
          )}
        </div>
        
        {/* Surprise Gift Option */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="surprise-gift"
              checked={giftScheduling.isSurprise ?? false}
              onCheckedChange={handleToggleSurprise}
            />
            <Label htmlFor="surprise-gift" className="text-base cursor-pointer flex items-center">
              Surprise Gift
              <ContextualHelp 
                id="surprise-help"
                title="Surprise Gift"
                content="When enabled, we'll hide all details about this gift from the recipient until delivery date."
                side="right"
                className="ml-1"
              />
            </Label>
          </div>
          {giftScheduling.isSurprise && (
            <p className="text-sm text-muted-foreground pl-6">
              Gift details will be hidden from the recipient until delivery.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftScheduling;
