import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressiveLoadingIndicatorProps {
  totalItems: number;
  loadedCount: number;
  loadingCount: number;
  erroredCount: number;
  averageLoadTime: number;
  className?: string;
  showDetails?: boolean;
}

const ProgressiveLoadingIndicator: React.FC<ProgressiveLoadingIndicatorProps> = ({
  totalItems,
  loadedCount,
  loadingCount,
  erroredCount,
  averageLoadTime,
  className,
  showDetails = false
}) => {
  const progressPercentage = (loadedCount / totalItems) * 100;
  const pendingCount = totalItems - loadedCount - loadingCount - erroredCount;

  if (!showDetails && progressPercentage >= 100) {
    return null; // Hide when complete and details not requested
  }

  return (
    <div className={cn("space-y-2 p-3 bg-background/80 backdrop-blur-sm rounded-lg border", className)}>
      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <Progress value={progressPercentage} className="flex-1 h-2" />
        <span className="text-xs font-medium text-muted-foreground min-w-[3rem]">
          {Math.round(progressPercentage)}%
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-xs">
        {/* Loaded */}
        <Badge variant="secondary" className="gap-1">
          <CheckCircle className="w-3 h-3" />
          {loadedCount}
        </Badge>

        {/* Loading */}
        {loadingCount > 0 && (
          <Badge variant="outline" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            {loadingCount}
          </Badge>
        )}

        {/* Errors */}
        {erroredCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            {erroredCount}
          </Badge>
        )}

        {/* Average Load Time */}
        {averageLoadTime > 0 && (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            {Math.round(averageLoadTime)}ms
          </Badge>
        )}
      </div>

      {/* Detailed Stats (if enabled) */}
      {showDetails && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Categories loaded:</span>
            <span>{loadedCount}/{totalItems}</span>
          </div>
          {pendingCount > 0 && (
            <div className="flex justify-between">
              <span>Pending:</span>
              <span>{pendingCount}</span>
            </div>
          )}
          {averageLoadTime > 0 && (
            <div className="flex justify-between">
              <span>Avg load time:</span>
              <span>{Math.round(averageLoadTime)}ms</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressiveLoadingIndicator;