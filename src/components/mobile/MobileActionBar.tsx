import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileActionBarProps {
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'outline' | 'ghost';
    disabled?: boolean;
    primary?: boolean;
  }>;
  className?: string;
  fixed?: boolean;
}

export const MobileActionBar: React.FC<MobileActionBarProps> = ({
  actions,
  className,
  fixed = true,
}) => {
  const primaryAction = actions.find(action => action.primary);
  const secondaryActions = actions.filter(action => !action.primary);

  return (
    <div 
      className={cn(
        "bg-background border-t border-border",
        fixed && "fixed bottom-0 left-0 right-0 z-40",
        "safe-area-bottom",
        className
      )}
    >
      <div className="flex items-center gap-2 p-3 max-w-6xl mx-auto">
        {/* Secondary Actions */}
        {secondaryActions.length > 0 && (
          <div className="flex gap-2 flex-1">
            {secondaryActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className="touch-target-44 text-xs flex-1"
              >
                {action.icon && (
                  <span className="mr-1">{action.icon}</span>
                )}
                {action.label}
              </Button>
            ))}
          </div>
        )}
        
        {/* Primary Action */}
        {primaryAction && (
          <Button
            variant={primaryAction.variant || 'default'}
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            className={cn(
              "touch-target-44 text-sm font-medium",
              !secondaryActions.length ? "flex-1" : "min-w-[120px]"
            )}
          >
            {primaryAction.icon && (
              <span className="mr-2">{primaryAction.icon}</span>
            )}
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};