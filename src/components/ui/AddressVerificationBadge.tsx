import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';
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
    // Consider it pending only when explicitly unverified or marked pending
    const pending = !verified || verificationMethod === 'pending_verification';
    if (pending) {
      return {
        variant: 'outline' as const,
        icon: AlertTriangle,
        text: 'Needs Verification',
        tooltip: 'Verify your address to ensure successful delivery'
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
          <div className="text-sm space-y-1">
            <p>{status.tooltip}</p>
            {lastUpdated && (
              <p className="text-muted-foreground">
                Last updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
              </p>
            )}
            <p className="text-xs text-muted-foreground border-t pt-1 mt-1">
              Full address details are securely stored and will be shared with our delivery partner when you place your order.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AddressVerificationBadge;