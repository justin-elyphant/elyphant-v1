
import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";

interface AutoGiftToggleProps {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}

const AutoGiftToggle = ({ enabled, setEnabled }: AutoGiftToggleProps) => {
  return (
    <Card className="py-1 px-2 border border-primary/20 bg-gradient-to-r from-purple-50/50 to-white dark:from-purple-900/10 dark:to-transparent">
      <div className="flex items-center justify-between gap-1">
        <div>
          <Label htmlFor="auto-gift" className="text-xs font-medium">Enable Auto-Gifting</Label>
          <p className="text-[10px] text-muted-foreground leading-none">
            Automatically send a gift
          </p>
        </div>
        <Switch
          id="auto-gift"
          checked={enabled}
          onCheckedChange={setEnabled}
          className="h-3.5 w-6 data-[state=checked]:bg-primary"
        />
      </div>
    </Card>
  );
};

export default AutoGiftToggle;
