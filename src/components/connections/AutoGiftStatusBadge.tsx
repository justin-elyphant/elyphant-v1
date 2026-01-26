import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Settings, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutoGiftPermissionStatus } from '@/services/autoGiftPermissionService';

interface AutoGiftStatusBadgeProps {
  status: AutoGiftPermissionStatus;
  className?: string;
}

export const AutoGiftStatusBadge: React.FC<AutoGiftStatusBadgeProps> = ({
  status,
  className
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'ready':
        return {
          icon: CheckCircle,
          text: 'Recurring Gifts Active',
          variant: 'default' as const,
          className: 'bg-success text-success-foreground border-success'
        };
      case 'setup_needed':
        return {
          icon: Settings,
          text: 'Setup Needed',
          variant: 'secondary' as const,
          className: 'bg-warning text-warning-foreground border-warning'
        };
      case 'disabled':
        return {
          icon: Ban,
          text: 'Recurring Gifts Disabled',
          variant: 'secondary' as const,
          className: 'bg-muted text-muted-foreground border-muted'
        };
      default:
        return {
          icon: Settings,
          text: 'Unknown',
          variant: 'secondary' as const,
          className: 'bg-muted text-muted-foreground border-muted'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'flex items-center gap-1 text-xs font-medium px-2 py-1',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.text}
    </Badge>
  );
};