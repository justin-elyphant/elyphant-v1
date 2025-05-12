
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Globe, Lock } from "lucide-react";

interface PrivacyToggleProps {
  isPublic: boolean;
  onToggle: (isPublic: boolean) => void;
  disabled?: boolean;
}

const PrivacyToggle = ({ isPublic, onToggle, disabled = false }: PrivacyToggleProps) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <Label className="text-base">Wishlist Privacy</Label>
          <p className="text-sm text-muted-foreground">
            Choose who can see your wishlist
          </p>
        </div>
        <Switch
          checked={isPublic}
          onCheckedChange={onToggle}
          disabled={disabled}
        />
      </div>
      
      <div className="rounded-md bg-muted p-3">
        <div className="flex">
          <div className={`p-2 rounded-full ${isPublic ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </div>
          <div className="ml-3">
            <h5 className="text-sm font-medium">{isPublic ? 'Public' : 'Private'}</h5>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isPublic 
                ? 'Anyone with the link can view this wishlist.' 
                : 'Only you can see this wishlist.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyToggle;
