
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
  align?: "center" | "start" | "end";
  responsive?: boolean;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({
  id,
  content,
  title,
  side = "top",
  className,
  iconSize = 16,
  align = "center",
  responsive = true,
}) => {
  // Adjust side for mobile devices if responsive is true
  const responsiveSide = React.useMemo(() => {
    if (!responsive) return side;
    
    // On mobile, prefer top or bottom positioning for better UX
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile && (side === "left" || side === "right")) {
      return "bottom";
    }
    return side;
  }, [side, responsive]);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button 
            className={cn("text-muted-foreground hover:text-foreground focus:outline-none transition-colors", className)} 
            aria-label={title || "Help"}
            type="button"
            data-testid={`contextual-help-${id}`}
          >
            <HelpCircle size={iconSize} />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side={responsiveSide} 
          align={align}
          className="max-w-xs p-4 z-50 shadow-lg" 
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
