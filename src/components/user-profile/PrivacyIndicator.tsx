import React from "react";
import { Eye, EyeOff, Users, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UnifiedProfileData } from "@/services/profiles/UnifiedProfileService";

interface PrivacyIndicatorProps {
  field: string;
  profile: UnifiedProfileData;
  showLabel?: boolean;
  className?: string;
}

/**
 * PRIVACY INDICATOR
 * 
 * Shows users exactly how their data sharing settings affect visibility.
 * Helps users understand the privacy implications of their choices.
 */
const PrivacyIndicator: React.FC<PrivacyIndicatorProps> = ({ 
  field, 
  profile, 
  showLabel = false, 
  className 
}) => {
  // Get the privacy setting for this field
  const getPrivacySetting = (fieldName: string) => {
    const settings = profile.data_sharing_settings;
    if (!settings) return 'public'; // Default to public if no settings
    
    return settings[fieldName as keyof typeof settings] || 'public';
  };

  // Check if the field has actual content
  const hasContent = (fieldName: string) => {
    switch (fieldName) {
      case 'bio':
        return Boolean(profile.bio);
      case 'email':
        return Boolean(profile.email);
      case 'location':
        return Boolean((profile as any).location);
      case 'gift_preferences':
        return Boolean(Array.isArray(profile.gift_preferences) && profile.gift_preferences.length > 0);
      case 'shipping_address':
        return Boolean(profile.shipping_address);
      default:
        return false;
    }
  };

  const privacySetting = getPrivacySetting(field);
  const hasFieldContent = hasContent(field);

  // Get appropriate icon and styling
  const getPrivacyDisplay = () => {
    if (!hasFieldContent) {
      return {
        icon: <EyeOff className="h-3 w-3" />,
        text: "Not set",
        variant: "secondary" as const,
        bgColor: "bg-muted",
        textColor: "text-muted-foreground"
      };
    }

    switch (privacySetting) {
      case 'public':
        return {
          icon: <Globe className="h-3 w-3" />,
          text: "Public",
          variant: "default" as const,
          bgColor: "bg-success/10",
          textColor: "text-success"
        };
      case 'friends':
        return {
          icon: <Users className="h-3 w-3" />,
          text: "Friends Only",
          variant: "secondary" as const,
          bgColor: "bg-info/10", 
          textColor: "text-info"
        };
      case 'private':
        return {
          icon: <EyeOff className="h-3 w-3" />,
          text: "Private",
          variant: "outline" as const,
          bgColor: "bg-warning/10",
          textColor: "text-warning"
        };
      default:
        return {
          icon: <Eye className="h-3 w-3" />,
          text: "Visible",
          variant: "default" as const,
          bgColor: "bg-primary/10",
          textColor: "text-primary"
        };
    }
  };

  const display = getPrivacyDisplay();

  const getFieldDisplayName = (fieldName: string) => {
    const names: Record<string, string> = {
      bio: "Bio",
      email: "Email", 
      location: "Location",
      gift_preferences: "Gift Preferences",
      shipping_address: "Shipping Address"
    };
    return names[fieldName] || fieldName;
  };

  if (showLabel) {
    return (
      <div className={cn("flex items-center justify-between py-2", className)}>
        <span className="text-sm font-medium">{getFieldDisplayName(field)}</span>
        <div className={cn("flex items-center gap-2 px-2 py-1 rounded-md text-xs", display.bgColor, display.textColor)}>
          {display.icon}
          <span>{display.text}</span>
        </div>
      </div>
    );
  }

  return (
    <Badge 
      variant={display.variant} 
      className={cn("text-xs flex items-center gap-1", display.textColor, className)}
    >
      {display.icon}
      {display.text}
    </Badge>
  );
};

export default PrivacyIndicator;