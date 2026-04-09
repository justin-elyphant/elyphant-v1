import React from "react";
import { Eye, EyeOff, Users, Globe, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { FieldVisibility } from "@/hooks/usePrivacySettings";
import { UnifiedProfileData } from "@/services/profiles/UnifiedProfileService";

interface PrivacyIndicatorProps {
  field?: string;
  profile?: UnifiedProfileData;
  /** Field visibility from privacy_settings table */
  privacySettings?: {
    dob_visibility?: string;
    interests_visibility?: string;
    shipping_address_visibility?: string;
    email_visibility?: string;
  };
  /** Direct visibility level (use instead of field+profile for simple cases) */
  level?: FieldVisibility;
  showLabel?: boolean;
  /** "badge" (default compact badge) or "alert" (full-width Alert banner, replaces PrivacyNotice) */
  variant?: "badge" | "alert";
  className?: string;
}

/**
 * Unified privacy display component.
 * - variant="badge" (default): compact Badge or labelled row
 * - variant="alert": full-width Alert banner (replaces old PrivacyNotice)
 */
const PrivacyIndicator: React.FC<PrivacyIndicatorProps> = ({ 
  field, 
  profile, 
  privacySettings,
  level: directLevel,
  showLabel = false,
  variant = "badge",
  className 
}) => {
  // Resolve the effective privacy level
  const resolveLevel = (): string => {
    if (directLevel) return directLevel;
    if (!field) return 'public';

    const fieldToColumn: Record<string, string> = {
      dob: 'dob_visibility',
      email: 'email_visibility',
      interests: 'interests_visibility',
      gift_preferences: 'interests_visibility',
      shipping_address: 'shipping_address_visibility',
    };

    const column = fieldToColumn[field];
    if (column && privacySettings) {
      const val = privacySettings[column as keyof typeof privacySettings];
      if (val) return val;
    }

    return 'public';
  };

  // Check if the field has actual content
  const hasContent = (fieldName: string) => {
    if (!profile) return true; // If no profile, assume content exists
    switch (fieldName) {
      case 'bio': return Boolean(profile.bio);
      case 'email': return Boolean(profile.email);
      case 'location': return Boolean((profile as any).location);
      case 'gift_preferences': return Boolean(Array.isArray(profile.gift_preferences) && profile.gift_preferences.length > 0);
      case 'shipping_address': return Boolean(profile.shipping_address);
      default: return true;
    }
  };

  const privacySetting = resolveLevel();
  const hasFieldContent = field ? hasContent(field) : true;

  const getDisplay = () => {
    if (field && !hasFieldContent) {
      return {
        icon: <EyeOff className="h-3 w-3" />,
        alertIcon: <EyeOff className="h-4 w-4 text-muted-foreground" />,
        text: "Not set",
        badgeVariant: "secondary" as const,
        bgColor: "bg-muted",
        textColor: "text-muted-foreground",
        alertBg: "bg-muted",
      };
    }

    switch (privacySetting) {
      case 'public':
        return {
          icon: <Globe className="h-3 w-3" />,
          alertIcon: <Eye className="h-4 w-4 text-warning" />,
          text: "Public",
          alertText: "This information is visible to everyone",
          badgeVariant: "default" as const,
          bgColor: "bg-success/10",
          textColor: "text-success",
          alertBg: "bg-warning/10",
        };
      case 'friends':
        return {
          icon: <Users className="h-3 w-3" />,
          alertIcon: <Users className="h-4 w-4 text-info" />,
          text: "Friends Only",
          alertText: "This information is only visible to your friends",
          badgeVariant: "secondary" as const,
          bgColor: "bg-info/10",
          textColor: "text-info",
          alertBg: "bg-info/10",
        };
      case 'private':
        return {
          icon: <EyeOff className="h-3 w-3" />,
          alertIcon: <EyeOff className="h-4 w-4 text-success" />,
          text: "Private",
          alertText: "This information is private and only visible to you",
          badgeVariant: "outline" as const,
          bgColor: "bg-warning/10",
          textColor: "text-warning",
          alertBg: "bg-success/10",
        };
      default:
        return {
          icon: <Eye className="h-3 w-3" />,
          alertIcon: <AlertCircle className="h-4 w-4" />,
          text: "Visible",
          alertText: "Privacy level not set",
          badgeVariant: "default" as const,
          bgColor: "bg-primary/10",
          textColor: "text-primary",
          alertBg: "bg-muted",
        };
    }
  };

  const display = getDisplay();

  // Alert variant (replaces PrivacyNotice)
  if (variant === "alert") {
    return (
      <Alert className={cn("flex items-center", display.alertBg, className)}>
        <div className="flex items-center gap-2">
          {display.alertIcon}
          <AlertDescription>{display.alertText || display.text}</AlertDescription>
        </div>
      </Alert>
    );
  }

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

  if (showLabel && field) {
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
      variant={display.badgeVariant} 
      className={cn("text-xs flex items-center gap-1", display.textColor, className)}
    >
      {display.icon}
      {display.text}
    </Badge>
  );
};

export default PrivacyIndicator;
