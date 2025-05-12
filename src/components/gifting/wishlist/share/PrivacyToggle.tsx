
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Globe, Lock } from "lucide-react";

interface PrivacyToggleProps {
  isPublic: boolean;
  onToggle: (isPublic: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

const PrivacyToggle = ({ 
  isPublic, 
  onToggle, 
  disabled = false,
  size = "md" 
}: PrivacyToggleProps) => {
  // Size variants for responsive design
  const sizeClasses = {
    sm: {
      container: "space-y-2",
      switch: "h-4 w-7",
      icon: "h-3 w-3",
      heading: "text-sm",
      text: "text-xs"
    },
    md: {
      container: "space-y-3",
      switch: "",
      icon: "h-4 w-4",
      heading: "text-base",
      text: "text-sm"
    },
    lg: {
      container: "space-y-4",
      switch: "scale-110",
      icon: "h-5 w-5",
      heading: "text-lg",
      text: "text-base"
    }
  };
  
  const classes = sizeClasses[size];

  return (
    <div className={classes.container}>
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <Label className={classes.heading}>Wishlist Privacy</Label>
          <p className={`text-muted-foreground ${classes.text}`}>
            Choose who can see your wishlist
          </p>
        </div>
        <Switch
          checked={isPublic}
          onCheckedChange={onToggle}
          disabled={disabled}
          className={classes.switch}
        />
      </div>
      
      <div className="rounded-md bg-muted p-3">
        <div className="flex">
          <div className={`p-2 rounded-full ${isPublic ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            {isPublic ? <Globe className={classes.icon} /> : <Lock className={classes.icon} />}
          </div>
          <div className="ml-3">
            <h5 className={`font-medium ${classes.text}`}>{isPublic ? 'Public' : 'Private'}</h5>
            <p className={`text-muted-foreground mt-0.5 ${size === "sm" ? "text-xs" : "text-xs"}`}>
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
