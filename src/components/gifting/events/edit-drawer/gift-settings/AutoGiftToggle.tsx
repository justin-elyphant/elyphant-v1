
import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface AutoGiftToggleProps {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}

const AutoGiftToggle = ({ enabled, setEnabled }: AutoGiftToggleProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="auto-gift">Enable Auto-Gifting</Label>
        <p className="text-sm text-muted-foreground">
          Automatically send a gift for this occasion
        </p>
      </div>
      <Switch
        id="auto-gift"
        checked={enabled}
        onCheckedChange={setEnabled}
      />
    </div>
  );
};

export default AutoGiftToggle;
