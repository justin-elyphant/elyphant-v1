
import React from "react";
import { Switch } from "@/components/ui/switch";

interface PrivacyToggleProps {
  isPublic: boolean;
  onToggle: (isPublic: boolean) => void;
}

const PrivacyToggle = ({ isPublic, onToggle }: PrivacyToggleProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-medium">Make wishlist public</h4>
        <p className="text-sm text-muted-foreground">
          Anyone with the link can view this wishlist
        </p>
      </div>
      <Switch
        checked={isPublic}
        onCheckedChange={onToggle}
        aria-label="Toggle wishlist public/private"
      />
    </div>
  );
};

export default PrivacyToggle;
