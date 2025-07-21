
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OrderStatusCheckerProps {
  orderId?: string;
}

const OrderStatusChecker: React.FC<OrderStatusCheckerProps> = ({ 
  orderId = "c5526964e99a6214ad309b2bd4dbc184" // Your specific order ID
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [orderStatus, setOrderStatus] = useState<any>(null);

  const checkSpecificOrder = async () => {
    setIsChecking(true);
    
    try {
      console.log(`Checking specific Zinc order status for: ${orderId}`);
      
      const { data, error } = await supabase.functions.invoke('check-zinc-order-status', {
        body: {
          orderIds: [orderId]
        }
      });

      if (error) {
        throw error;
      }

      console.log('Order status check results:', data);
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        setOrderStatus(result);
        setLastCheck(new Date());
        
        if (result.updated) {
          toast.success(`Order status updated: ${result.status}`);
        } else {
          toast.warning(`Status check completed but no updates available`);
        }
      } else {
        toast.warning('No status information available for this order');
      }

    } catch (error) {
      console.error('Error checking order status:', error);
      toast.error('Failed to check order status');
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'shipped':
      case 'delivered':
        return 'text-green-600';
      case 'processing':
      case 'placed':
        return 'text-yellow-600';
      case 'cancelled':
      case 'failed':
      case 'not_found':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'shipped':
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
      case 'placed':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
      case 'failed':
      case 'not_found':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Order Status Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p><strong>Zinc Order ID:</strong> {orderId}</p>
          <p><strong>Order placed:</strong> Yesterday at 5:20 PM</p>
        </div>

        {orderStatus && (
          <div className={`flex items-center gap-2 p-3 rounded-md border ${getStatusColor(orderStatus.status)}`}>
            {getStatusIcon(orderStatus.status)}
            <div>
              <p className="font-medium">Status: {orderStatus.status}</p>
              {orderStatus.trackingNumber && (
                <p className="text-sm">Tracking: {orderStatus.trackingNumber}</p>
              )}
              {orderStatus.error && (
                <p className="text-sm text-red-600">Error: {orderStatus.error}</p>
              )}
            </div>
          </div>
        )}

        {lastCheck && (
          <p className="text-xs text-muted-foreground">
            Last checked: {lastCheck.toLocaleTimeString()}
          </p>
        )}

        <Button 
          onClick={checkSpecificOrder}
          disabled={isChecking}
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking Status...' : 'Check Order Status'}
        </Button>

        <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
          <p><strong>Note:</strong> If order shows "account_locked_verification_required", 
          your Zinc account may need verification. Check your Zinc dashboard.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderStatusChecker;
