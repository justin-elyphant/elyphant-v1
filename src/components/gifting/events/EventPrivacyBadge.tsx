
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EventPrivacyBadgeProps {
  privacyLevel: string;
  isVerified?: boolean;
  small?: boolean;
}

const EventPrivacyBadge = ({ privacyLevel, isVerified, small = false }: EventPrivacyBadgeProps) => {
  const iconSize = small ? 3 : 4;
  
  let badgeClass = "border ";
  let icon = <Shield className={`h-${iconSize} w-${iconSize} mr-1`} />;
  let label = "Private";
  let tooltip = "Only visible to you";
  
  if (privacyLevel === "shared") {
    badgeClass += "border-blue-300 ";
    icon = isVerified ? 
      <ShieldCheck className={`h-${iconSize} w-${iconSize} mr-1 text-blue-500`} /> :
      <ShieldAlert className={`h-${iconSize} w-${iconSize} mr-1 text-blue-500`} />;
    label = "Shared";
    tooltip = isVerified ? 
      "Verified and shared with connected users" : 
      "Shared with connected users (not verified)";
  } else if (privacyLevel === "public") {
    badgeClass += "border-green-300 ";
    icon = <Shield className={`h-${iconSize} w-${iconSize} mr-1 text-green-500`} />;
    label = "Public";
    tooltip = "Visible to everyone";
  } else {
    badgeClass += "border-gray-300 ";
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={badgeClass + (small ? "text-xs px-1 py-0" : "")}>
            {icon}
            {!small && <span>{label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default EventPrivacyBadge;
