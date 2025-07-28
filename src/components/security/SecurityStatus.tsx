import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Shield, Clock } from "lucide-react";
import { useSecurityRateLimit } from '@/hooks/useSecurityRateLimit';

interface SecurityStatusProps {
  userId: string;
}

export const SecurityStatus: React.FC<SecurityStatusProps> = ({ userId }) => {
  const { rateLimitStatus } = useSecurityRateLimit();

  if (!rateLimitStatus.isLimited && rateLimitStatus.dailyCount === 0) {
    return null; // Don't show if no rate limit activity
  }

  const dailyLimit = 500;
  const usagePercent = (rateLimitStatus.dailyCount / dailyLimit) * 100;
  const resetTime = rateLimitStatus.resetTime;

  return (
    <div className="space-y-2">
      {/* Rate Limit Status */}
      {rateLimitStatus.isLimited ? (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Message rate limit exceeded. 
            {resetTime && (
              <span className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                Resets at {resetTime.toLocaleTimeString()}
              </span>
            )}
          </AlertDescription>
        </Alert>
      ) : usagePercent > 80 ? (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            High message volume detected. {rateLimitStatus.dailyCount}/{dailyLimit} messages today.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Usage Progress */}
      {usagePercent > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Daily message usage</span>
            <span>{rateLimitStatus.dailyCount}/{dailyLimit}</span>
          </div>
          <Progress 
            value={usagePercent} 
            className="h-2"
            // Change color based on usage level
            style={{
              '--progress-foreground': usagePercent > 90 ? 'hsl(var(--destructive))' : 
                                      usagePercent > 80 ? 'hsl(var(--warning))' : 
                                      'hsl(var(--primary))'
            } as React.CSSProperties}
          />
        </div>
      )}
    </div>
  );
};