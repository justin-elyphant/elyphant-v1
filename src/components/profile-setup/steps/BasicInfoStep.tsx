
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BasicInfoStepProps {
  value: string;
  onChange: (name: string) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Tell us about yourself</h3>
        <p className="text-sm text-muted-foreground">
          This information helps personalize your gifting experience
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your full name"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
