
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
    <Card className="p-2 border border-primary/20 bg-gradient-to-r from-purple-50/50 to-white dark:from-purple-900/10 dark:to-transparent">
      <div className="flex items-center justify-between">
        <div className="space-y-0">
          <Label htmlFor="auto-gift" className="font-medium">Enable Auto-Gifting</Label>
          <p className="text-xs text-muted-foreground">
            Automatically send a gift for this occasion
          </p>
        </div>
        <Switch
          id="auto-gift"
          checked={enabled}
          onCheckedChange={setEnabled}
          className="data-[state=checked]:bg-primary"
        />
      </div>
    </Card>
  );
};

export default AutoGiftToggle;
