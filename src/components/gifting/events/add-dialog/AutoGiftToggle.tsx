
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AutoGiftToggleProps {
  autoGift: boolean;
  onAutoGiftChange: (value: boolean) => void;
}

const AutoGiftToggle = ({ autoGift, onAutoGiftChange }: AutoGiftToggleProps) => {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <Label className="text-base">Automated Gifting</Label>
        <div className="text-sm text-muted-foreground">
          Automatically send a gift when this event occurs
        </div>
      </div>
      <Switch
        checked={autoGift}
        onCheckedChange={onAutoGiftChange}
      />
    </div>
  );
};

export default AutoGiftToggle;
