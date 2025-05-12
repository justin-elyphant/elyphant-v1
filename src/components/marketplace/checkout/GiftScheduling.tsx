
import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, Gift } from "lucide-react";
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
import ContextualHelp from "@/components/help/ContextualHelp";

interface GiftSchedulingProps {
  onUpdate: (data: GiftSchedulingOptions) => void;
  giftScheduling: GiftSchedulingOptions;
}

export interface GiftSchedulingOptions {
  scheduleDelivery: boolean;
  deliveryDate?: Date;
  deliveryTime?: string;
  sendGiftMessage: boolean;
  messageDate?: Date;
}

const GiftScheduling: React.FC<GiftSchedulingProps> = ({ onUpdate, giftScheduling }) => {
  // Generate time slots for delivery
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return {
      value: `${hour.toString().padStart(2, '0')}:00`,
      label: `${hour12}:00 ${ampm}`
    };
  });

  const handleToggleScheduleDelivery = (checked: boolean) => {
    onUpdate({
      ...giftScheduling,
      scheduleDelivery: checked,
    });
  };

  const handleToggleSendMessage = (checked: boolean) => {
    onUpdate({
      ...giftScheduling,
      sendGiftMessage: checked,
    });
  };

  const handleDateChange = (date?: Date) => {
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

  return (
    <div className="rounded-lg border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-medium">Gift Scheduling</h3>
        </div>
        
        <ContextualHelp
          id="gift-scheduling-help"
          title="Gift Scheduling"
          content="Schedule when your gift should be delivered, or when a gift notification should be sent to the recipient."
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
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
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
                      "w-[240px] justify-start text-left font-normal",
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
      </div>
    </div>
  );
};

export default GiftScheduling;
