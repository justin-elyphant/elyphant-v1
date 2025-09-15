
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, TruckIcon, Clock, CheckCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";
import { toast } from "sonner";

interface OrderStatusBadgeProps {
  status: string;
  orderId?: string;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  createdAt?: string;
  onStatusUpdate?: (newStatus: string) => void;
}

const OrderStatusBadge = ({ 
  status, 
  orderId, 
  stripePaymentIntentId, 
  stripeSessionId, 
  createdAt, 
  onStatusUpdate 
}: OrderStatusBadgeProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { verifyPayment } = usePaymentVerification();

  // Calculate time since order creation for payment_verification_failed status
  const getTimeSinceCreation = () => {
    if (!createdAt) return 0;
    return Date.now() - new Date(createdAt).getTime();
  };

  // Enhanced status logic for payment verification states
  const getEnhancedStatus = () => {
    const timeSinceCreation = getTimeSinceCreation();
    const minutesSinceCreation = timeSinceCreation / (1000 * 60);

    if (status.toLowerCase() === 'payment_verification_failed') {
      if (minutesSinceCreation < 10) {
        return {
          displayText: 'Verifying Payment',
          variant: 'secondary' as const,
          style: { 
            backgroundColor: 'hsl(var(--blue-500))', 
            color: 'white',
            border: 'none'
          },
          icon: <Clock className="h-3 w-3 mr-1" />,
          showRefresh: true,
          message: 'Your payment is being verified...'
        };
      } else {
        return {
          displayText: 'Needs Review',
          variant: 'destructive' as const,
          style: { 
            backgroundColor: 'hsl(var(--amber-500))', 
            color: 'white',
            border: 'none'
          },
          icon: <AlertTriangle className="h-3 w-3 mr-1" />,
          showRefresh: true,
          message: 'Payment verification is taking longer than usual'
        };
      }
    }

    // Default status handling for all other statuses
    return {
      displayText: status.charAt(0).toUpperCase() + status.slice(1),
      variant: getVariant(),
      style: getCustomStyle(),
      icon: getIcon(),
      showRefresh: false,
      message: null
    };
  };

  const getVariant = () => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "default" as const;
      case "shipped":
        return "secondary" as const;
      case "processing":
        return "outline" as const;
      case "cancelled":
      case "failed":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const getCustomStyle = () => {
    switch (status.toLowerCase()) {
      case "delivered":
        return { 
          backgroundColor: "hsl(var(--status-delivered))", 
          color: "white",
          border: "none"
        };
      case "shipped":
        return { 
          backgroundColor: "hsl(var(--status-shipped))", 
          color: "white",
          border: "none"
        };
      case "processing":
        return { 
          backgroundColor: "hsl(var(--status-processing))", 
          color: "white",
          border: "none"
        };
      case "pending":
        return { 
          backgroundColor: "hsl(var(--status-pending))", 
          color: "white",
          border: "none"
        };
      case "cancelled":
      case "failed":
        return { 
          backgroundColor: "hsl(var(--status-cancelled))", 
          color: "white",
          border: "none"
        };
      default:
        return {};
    }
  };

  const getIcon = () => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case "shipped":
        return <TruckIcon className="h-3 w-3 mr-1" />;
      case "processing":
        return <Clock className="h-3 w-3 mr-1" />;
      case "cancelled":
      case "failed":
        return <Clock className="h-3 w-3 mr-1" />;
      default:
        return <Package className="h-3 w-3 mr-1" />;
    }
  };

  const handleRefreshPaymentStatus = async () => {
    if (!orderId || (!stripePaymentIntentId && !stripeSessionId)) {
      toast.error('Unable to refresh payment status: missing payment information');
      return;
    }

    setIsRefreshing(true);
    
    try {
      const result = await verifyPayment(stripeSessionId, stripePaymentIntentId, true);
      
      if (result.success && result.payment_status === 'succeeded') {
        toast.success('Payment verified successfully!');
        onStatusUpdate?.('payment_confirmed');
      } else if (result.payment_status === 'pending') {
        toast.info('Payment is still being processed. Please try again in a few minutes.');
      } else {
        toast.warning('Payment verification completed, but status unchanged.');
      }
    } catch (error) {
      console.error('Payment refresh failed:', error);
      toast.error('Failed to refresh payment status. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const enhancedStatus = getEnhancedStatus();

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={enhancedStatus.variant} 
        className="flex items-center"
        style={enhancedStatus.style}
        title={enhancedStatus.message || undefined}
      >
        {enhancedStatus.icon}
        {enhancedStatus.displayText}
      </Badge>
      
      {enhancedStatus.showRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshPaymentStatus}
          disabled={isRefreshing}
          className="h-6 w-6 p-0"
          title="Refresh payment status"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
};

export default OrderStatusBadge;
