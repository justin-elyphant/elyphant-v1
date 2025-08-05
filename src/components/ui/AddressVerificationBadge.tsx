import React from 'react';
import { Check, AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

interface AddressVerificationBadgeProps {
  verified?: boolean;
  verificationMethod?: string;
  verifiedAt?: string;
  lastUpdated?: string;
  size?: 'sm' | 'default';
  showText?: boolean;
}

export const AddressVerificationBadge: React.FC<AddressVerificationBadgeProps> = ({
  verified = false,
  verificationMethod = 'profile_setup',
  verifiedAt,
  lastUpdated,
  size = 'default',
  showText = true
}) => {
  console.log(`🔍 [AddressVerificationBadge] Rendering badge:`, {
    verified,
    verificationMethod,
    verifiedAt,
    lastUpdated
  });
  
  const getVerificationStatus = () => {
    if (!verified) {
      return {
        variant: 'outline' as const,
        icon: AlertTriangle,
        text: 'Unverified',
        tooltip: 'This address has not been verified'
      };
    }

    // Check if address was updated after verification
    const isOutdated = lastUpdated && verifiedAt && new Date(lastUpdated) > new Date(verifiedAt);
    
    if (isOutdated) {
      return {
        variant: 'secondary' as const,
        icon: Clock,
        text: 'Needs Verification',
        tooltip: 'Address was updated after verification'
      };
    }

    return {
      variant: 'default' as const,
      icon: Check,
      text: 'Verified',
      tooltip: `Address verified via ${verificationMethod?.replace('_', ' ')}${verifiedAt ? ` on ${new Date(verifiedAt).toLocaleDateString()}` : ''}`
    };
  };

  const status = getVerificationStatus();
  const Icon = status.icon;

  const badge = (
    <Badge 
      variant={status.variant} 
      className={size === 'sm' ? 'text-xs px-1.5 py-0.5' : ''}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {showText && <span className="ml-1">{status.text}</span>}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p>{status.tooltip}</p>
            {lastUpdated && (
              <p className="text-muted-foreground mt-1">
                Last updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AddressVerificationBadge;