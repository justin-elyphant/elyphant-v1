import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface PaymentMethodHealthBadgeProps {
  status: 'valid' | 'expired' | 'expiring_soon' | 'invalid' | 'detached';
  expirationDate?: Date;
  rulesCount?: number;
  className?: string;
}

export const PaymentMethodHealthBadge: React.FC<PaymentMethodHealthBadgeProps> = ({
  status,
  expirationDate,
  rulesCount,
  className
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'valid':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          label: 'Valid',
          show: false // Don't show badge for valid cards
        };
      case 'expired':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3 mr-1" />,
          label: 'Expired',
          show: true
        };
      case 'expiring_soon':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: 'Expiring Soon',
          show: true
        };
      case 'invalid':
        return {
          variant: 'destructive' as const,
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          label: 'Invalid - Update Required',
          show: true
        };
      case 'detached':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3 mr-1" />,
          label: 'Detached from Stripe',
          show: true
        };
      default:
        return {
          variant: 'outline' as const,
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          label: 'Unknown Status',
          show: true
        };
    }
  };

  const config = getBadgeConfig();

  if (!config.show) {
    return null;
  }

  return (
    <Badge variant={config.variant} className={className}>
      {config.icon}
      {config.label}
    </Badge>
  );
};
