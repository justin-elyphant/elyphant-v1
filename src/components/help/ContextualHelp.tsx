
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextualHelpProps {
  id: string;
  content: React.ReactNode;
  title?: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  iconSize?: number;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({
  id,
  content,
  title,
  side = "top",
  className,
  iconSize = 16,
}) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button 
            className={cn("text-muted-foreground hover:text-foreground focus:outline-none", className)} 
            aria-label="Help"
            type="button"
          >
            <HelpCircle size={iconSize} />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-xs p-4" 
          sideOffset={8}
        >
          {title && <h3 className="font-medium mb-1">{title}</h3>}
          <div className="text-sm text-muted-foreground">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ContextualHelp;
