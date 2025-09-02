import React from "react";
import { cn } from "@/lib/utils";

interface SimpleLoadingIndicatorProps {
  totalItems: number;
  loadedCount: number;
  loadingCount: number;
  className?: string;
}

const SimpleLoadingIndicator: React.FC<SimpleLoadingIndicatorProps> = ({
  totalItems,
  loadedCount,
  loadingCount,
  className
}) => {
  const progressPercentage = (loadedCount / totalItems) * 100;

  if (progressPercentage >= 100) {
    return null;
  }

  return (
    <div className={cn("p-3 bg-background/80 backdrop-blur-sm rounded-lg border", className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {Math.round(progressPercentage)}%
        </span>
      </div>
      <div className="text-xs text-muted-foreground mt-1 text-center">
        Loading categories: {loadedCount}/{totalItems}
        {loadingCount > 0 && ` (${loadingCount} loading...)`}
      </div>
    </div>
  );
};

export default SimpleLoadingIndicator;