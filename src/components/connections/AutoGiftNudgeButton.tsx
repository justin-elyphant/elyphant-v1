import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserPlus, Loader2 } from 'lucide-react';
import { Connection } from '@/types/connections';
// autoGiftNudgeService temporarily disabled during migration
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AutoGiftNudgeButtonProps {
  connection: Connection;
  missingData: Array<'shipping' | 'birthday' | 'email'>;
  hasActiveRules: boolean;
  className?: string;
  onNudgeSent?: () => void;
}

export const AutoGiftNudgeButton: React.FC<AutoGiftNudgeButtonProps> = ({
  connection,
  missingData,
  hasActiveRules,
  className,
  onNudgeSent
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const getButtonText = () => {
    if (!hasActiveRules) {
      return 'Set up AI gifting';
    }
    if (missingData.length > 0) {
      return `Request ${missingData.join(' & ')}`;
    }
    return 'Send reminder';
  };

  const getTooltipText = () => {
    if (!hasActiveRules) {
      return `Set up AI-powered gifting for ${connection.name}`;
    }
    if (missingData.length > 0) {
      const dataTypes = missingData.join(' and ');
      return `Ask ${connection.name} to share their ${dataTypes} for AI gifting`;
    }
    return `Send a friendly reminder to ${connection.name}`;
  };

  const handleNudgeClick = async () => {
    try {
      setIsLoading(true);

      if (!hasActiveRules) {
        // Navigate to AI gifting setup for this connection
        toast.info('AI gifting setup coming soon!', {
          description: `We'll help you set up AI-powered gifting for ${connection.name}`
        });
        return;
      }

      // Temporarily disabled during migration
      const result = { success: false, error: 'Feature temporarily unavailable during migration' };

      if (result.success) {
        toast.success('Nudge sent!', {
          description: 'Your nudge was sent successfully'
        });
        onNudgeSent?.();
      } else {
        toast.error('Failed to send nudge', {
          description: result.error || 'Please try again later'
        });
      }
    } catch (error) {
      console.error('Error sending auto-gift nudge:', error);
      toast.error('Failed to send nudge', {
        description: 'Please try again later'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNudgeClick}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-2 text-xs',
              className
            )}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <UserPlus className="h-3 w-3" />
            )}
            {getButtonText()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};