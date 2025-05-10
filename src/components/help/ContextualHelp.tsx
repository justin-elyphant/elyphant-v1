
import React, { useState } from "react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextualHelpProps {
  id: string;
  content: React.ReactNode | string;
  title?: string;
  children?: React.ReactNode;
  icon?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  iconClassName?: string;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({
  id,
  content,
  title,
  children,
  icon = true,
  side = "top",
  className,
  iconClassName
}) => {
  const [viewed, setViewed] = useState(() => {
    const viewedTips = JSON.parse(localStorage.getItem("viewedHelpTips") || "{}");
    return !!viewedTips[id];
  });

  const handleTooltipOpen = () => {
    if (!viewed) {
      const viewedTips = JSON.parse(localStorage.getItem("viewedHelpTips") || "{}");
      viewedTips[id] = true;
      localStorage.setItem("viewedHelpTips", JSON.stringify(viewedTips));
      setViewed(true);
    }
  };
  
  const tooltipTrigger = children ? (
    <TooltipTrigger asChild>
      <div className="inline-flex cursor-help">{children}</div>
    </TooltipTrigger>
  ) : (
    <TooltipTrigger asChild>
      <div className={cn(
        "inline-flex cursor-help",
        !viewed && "animate-pulse",
        iconClassName
      )}>
        <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
      </div>
    </TooltipTrigger>
  );

  return (
    <TooltipProvider>
      <Tooltip onOpenChange={(open) => open && handleTooltipOpen()}>
        {tooltipTrigger}
        <TooltipContent 
          side={side} 
          sideOffset={5} 
          className={cn("max-w-xs p-3", className)}
        >
          {title && <h4 className="font-medium mb-1">{title}</h4>}
          <div className="text-sm">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ContextualHelp;
