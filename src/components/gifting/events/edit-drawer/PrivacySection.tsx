
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield } from "lucide-react";
import { PrivacyLevel } from "./types";

interface PrivacySectionProps {
  privacyLevel: PrivacyLevel;
  setPrivacyLevel: (value: PrivacyLevel) => void;
}

const PrivacySection = ({
  privacyLevel,
  setPrivacyLevel,
}: PrivacySectionProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Privacy Settings</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Control who can see this event
      </p>
      
      <RadioGroup 
        value={privacyLevel}
        onValueChange={(value: PrivacyLevel) => setPrivacyLevel(value)}
        className="space-y-1 mt-1"
      >
        <div className="flex items-center space-x-2 py-1.5 px-2 rounded-md hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
          <RadioGroupItem value="private" id="private" />
          <Label htmlFor="private" className="cursor-pointer text-sm">Private (Only visible to you)</Label>
        </div>
        <div className="flex items-center space-x-2 py-1.5 px-2 rounded-md hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
          <RadioGroupItem value="shared" id="shared" />
          <Label htmlFor="shared" className="cursor-pointer text-sm">Shared (Visible to connected users)</Label>
        </div>
        <div className="flex items-center space-x-2 py-1.5 px-2 rounded-md hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
          <RadioGroupItem value="public" id="public" />
          <Label htmlFor="public" className="cursor-pointer text-sm">Public (Visible to everyone)</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default PrivacySection;
