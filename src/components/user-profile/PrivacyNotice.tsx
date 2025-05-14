
import React from "react";
import { AlertCircle, Eye, EyeOff, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { PrivacyLevel } from "@/utils/privacyUtils";

interface PrivacyNoticeProps {
  level: PrivacyLevel;
  className?: string;
}

const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ level, className }) => {
  const getIcon = () => {
    switch (level) {
      case "public":
        return <Eye className="h-4 w-4 text-warning" />;
      case "friends":
        return <Users className="h-4 w-4 text-info" />;
      case "private":
        return <EyeOff className="h-4 w-4 text-success" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getText = () => {
    switch (level) {
      case "public":
        return "This information is visible to everyone";
      case "friends":
        return "This information is only visible to your friends";
      case "private":
        return "This information is private and only visible to you";
      default:
        return "Privacy level not set";
    }
  };

  const getBgColor = () => {
    switch (level) {
      case "public":
        return "bg-warning/10";
      case "friends":
        return "bg-info/10";
      case "private":
        return "bg-success/10";
      default:
        return "bg-muted";
    }
  };

  return (
    <Alert className={cn("flex items-center", getBgColor(), className)}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <AlertDescription>{getText()}</AlertDescription>
      </div>
    </Alert>
  );
};

export default PrivacyNotice;
