
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OrderStatusRefreshProps {
  orderIds: string[];
  onRefreshComplete?: () => void;
}

const OrderStatusRefresh: React.FC<OrderStatusRefreshProps> = ({ 
  orderIds, 
  onRefreshComplete 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshStatus = async () => {
    if (orderIds.length === 0) {
      toast.error('No orders to refresh');
      return;
    }

    setIsRefreshing(true);
    
    try {
      console.log('Refreshing status for orders:', orderIds);
      
      const { data, error } = await supabase.functions.invoke('check-zinc-order-status', {
        body: {
          orderIds
        }
      });

      if (error) {
        throw error;
      }

      const results = data.results || [];
      const successCount = results.filter((r: any) => r.updated).length;
      const errorCount = results.filter((r: any) => !r.updated).length;

      if (successCount > 0) {
        toast.success(`Updated ${successCount} order(s) successfully`);
      }
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} order(s) could not be updated`);
      }

      console.log('Order status refresh results:', data);
      
      // Call the callback to refresh the parent component
      onRefreshComplete?.();

    } catch (error) {
      console.error('Error refreshing order status:', error);
      toast.error('Failed to refresh order status');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      onClick={handleRefreshStatus}
      disabled={isRefreshing || orderIds.length === 0}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
    </Button>
  );
};

export default OrderStatusRefresh;
