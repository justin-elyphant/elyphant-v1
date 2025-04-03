
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
      <div className="flex items-center gap-1.5 mb-1">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Privacy Settings</h3>
      </div>
      <p className="text-xs text-muted-foreground -mt-1 mb-1">
        Control who can see this event
      </p>
      
      <RadioGroup 
        value={privacyLevel}
        onValueChange={(value: PrivacyLevel) => setPrivacyLevel(value)}
        className="space-y-0.5"
      >
        <div className="flex items-center space-x-2 py-1 px-1.5 rounded-md hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
          <RadioGroupItem value="private" id="private" />
          <Label htmlFor="private" className="text-sm">Private (Only visible to you)</Label>
        </div>
        <div className="flex items-center space-x-2 py-1 px-1.5 rounded-md hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
          <RadioGroupItem value="shared" id="shared" />
          <Label htmlFor="shared" className="text-sm">Shared (Visible to connected users)</Label>
        </div>
        <div className="flex items-center space-x-2 py-1 px-1.5 rounded-md hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
          <RadioGroupItem value="public" id="public" />
          <Label htmlFor="public" className="text-sm">Public (Visible to everyone)</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default PrivacySection;
