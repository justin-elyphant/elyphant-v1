
import React from "react";
import { Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface EventPrivacyBadgeProps {
  privacyLevel: string;
  isVerified?: boolean;
}

const EventPrivacyBadge = ({ privacyLevel, isVerified }: EventPrivacyBadgeProps) => {
  let icon = null;
  let label = "";
  let variant = "outline";
  
  switch(privacyLevel) {
    case "private":
      icon = <ShieldOff className="h-3 w-3 mr-1" />;
      label = "Private";
      break;
    case "shared":
      icon = isVerified 
        ? <ShieldCheck className="h-3 w-3 mr-1 text-green-500" /> 
        : <Shield className="h-3 w-3 mr-1 text-amber-500" />;
      label = isVerified ? "Verified" : "Shared";
      variant = isVerified ? "success" : "warning";
      break;
    case "public":
      icon = <Shield className="h-3 w-3 mr-1" />;
      label = "Public";
      break;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant as any} className="ml-2 cursor-help">
            {icon}
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {privacyLevel === "private" && "Only visible to you"}
          {privacyLevel === "shared" && isVerified && "Event has been verified by the other person"}
          {privacyLevel === "shared" && !isVerified && "Shared but awaiting verification"}
          {privacyLevel === "public" && "Visible to everyone"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default EventPrivacyBadge;
