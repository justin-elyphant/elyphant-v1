
import React from "react";
import { Globe, Lock, Eye } from "lucide-react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ShareStatusBadgeProps extends Omit<BadgeProps, "children"> {
  isPublic: boolean;
  viewCount?: number;
  showIcon?: boolean;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const ShareStatusBadge = ({ 
  isPublic, 
  viewCount, 
  showIcon = true, 
  showText = true, 
  size = "md",
  className,
  variant = "outline",
  ...props
}: ShareStatusBadgeProps) => {
  // Size classes
  const sizeClasses = {
    sm: "text-xs py-0 px-1.5",
    md: "text-xs py-0.5 px-2",
    lg: "text-sm py-1 px-2.5"
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-4 w-4"
  };

  // Get appropriate styling based on status
  const badgeStyles = cn(
    sizeClasses[size],
    isPublic 
      ? "text-green-600 border-green-200 bg-green-50 hover:bg-green-100" 
      : "text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100",
    className
  );

  const tooltipText = isPublic 
    ? "This wishlist is public and can be shared" 
    : "This wishlist is private";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className={badgeStyles} {...props}>
            <div className="flex items-center gap-1">
              {showIcon && (
                isPublic ? (
                  <Globe className={iconSizeClasses[size]} />
                ) : (
                  <Lock className={iconSizeClasses[size]} />
                )
              )}
              
              {showText && (
                <span>{isPublic ? "Public" : "Private"}</span>
              )}
              
              {isPublic && viewCount !== undefined && viewCount > 0 && (
                <div className="flex items-center ml-1">
                  <Eye className={iconSizeClasses[size]} />
                  <span className="ml-0.5">{viewCount}</span>
                </div>
              )}
            </div>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ShareStatusBadge;
