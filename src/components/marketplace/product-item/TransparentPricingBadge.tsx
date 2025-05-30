
import React from "react";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TransparentPricingBadge = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="text-xs bg-blue-50 text-blue-700 border-blue-200 cursor-help"
          >
            <Info className="h-3 w-3 mr-1" />
            Transparent Pricing
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm max-w-xs">
            Final price includes itemized fees shown at checkout.
            No hidden costs or surprise charges.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TransparentPricingBadge;
