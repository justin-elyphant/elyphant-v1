
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
    <div className="space-y-4">
      <div>
        <h3 className="text-md font-medium flex items-center">
          <Shield className="h-4 w-4 mr-2" />
          Privacy Settings
        </h3>
        <p className="text-sm text-muted-foreground">
          Control who can see this event
        </p>
      </div>
      
      <RadioGroup 
        value={privacyLevel}
        onValueChange={(value: PrivacyLevel) => setPrivacyLevel(value)}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="private" id="private" />
          <Label htmlFor="private">Private (Only visible to you)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="shared" id="shared" />
          <Label htmlFor="shared">Shared (Visible to connected users)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="public" id="public" />
          <Label htmlFor="public">Public (Visible to everyone)</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default PrivacySection;
