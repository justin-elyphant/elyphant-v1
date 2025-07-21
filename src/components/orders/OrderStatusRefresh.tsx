
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
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
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

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
      const stuckCount = results.filter((r: any) => 
        r.status === 'placed' && !r.updated
      ).length;

      console.log('Order status refresh results:', data);

      // Provide detailed feedback
      if (successCount > 0) {
        toast.success(`Updated ${successCount} order(s) successfully`);
      }
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} order(s) could not be updated`);
      }

      if (stuckCount > 0) {
        toast.info(`${stuckCount} order(s) still in "placed" status`, {
          description: "These orders may be waiting for Zinc account verification"
        });
      }

      setLastRefresh(new Date());
      
      // Call the callback to refresh the parent component
      onRefreshComplete?.();

    } catch (error) {
      console.error('Error refreshing order status:', error);
      toast.error('Failed to refresh order status');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getTimeSinceLastRefresh = () => {
    if (!lastRefresh) return null;
    
    const minutes = Math.floor((Date.now() - lastRefresh.getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  return (
    <div className="flex flex-col items-end gap-1">
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
      
      {lastRefresh && (
        <span className="text-xs text-muted-foreground">
          Last updated {getTimeSinceLastRefresh()}
        </span>
      )}
      
      {orderIds.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Monitoring {orderIds.length} processing order{orderIds.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default OrderStatusRefresh;
