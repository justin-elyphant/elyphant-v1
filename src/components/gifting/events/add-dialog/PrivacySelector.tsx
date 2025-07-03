
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PrivacySelectorProps {
  value: "public" | "private" | "shared";
  onChange: (value: "public" | "private" | "shared") => void;
}

const PrivacySelector = ({ value, onChange }: PrivacySelectorProps) => {
  return (
    <div className="space-y-2">
      <Label>Privacy Level</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select privacy level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="private">
            Private (Only you can see)
          </SelectItem>
          <SelectItem value="shared">
            Shared (Only with connected users)
          </SelectItem>
          <SelectItem value="public">
            Public (Visible to all)
          </SelectItem>
        </SelectContent>
      </Select>
      <div className="text-sm text-muted-foreground">
        Controls who can see this event. Shared events are verified with connected users.
      </div>
      {value === "shared" && (
        <div className="text-sm text-amber-600">
          Only the event type and date will be shared. Person's name remains private.
        </div>
      )}
    </div>
  );
};

export default PrivacySelector;
