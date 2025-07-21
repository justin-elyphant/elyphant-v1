
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StuckOrder {
  id: string;
  order_number: string;
  zinc_order_id: string;
  status: string;
  zinc_status: string;
  created_at: string;
  hoursStuck: number;
}

const OrderMonitoring: React.FC = () => {
  const [stuckOrders, setStuckOrders] = useState<StuckOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchStuckOrders = async () => {
    try {
      // Get orders that are stuck in processing/placed status for more than 6 hours
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, zinc_order_id, status, zinc_status, created_at')
        .or('status.eq.processing,zinc_status.eq.placed')
        .lt('created_at', sixHoursAgo)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stuck orders:', error);
        return;
      }

      const ordersWithHours: StuckOrder[] = (data || []).map(order => ({
        ...order,
        hoursStuck: Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60))
      }));

      setStuckOrders(ordersWithHours);
    } catch (error) {
      console.error('Error fetching stuck orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStuckOrders = async () => {
    if (stuckOrders.length === 0) return;
    
    const zincOrderIds = stuckOrders
      .filter(order => order.zinc_order_id)
      .map(order => order.zinc_order_id);

    if (zincOrderIds.length === 0) return;

    try {
      console.log('Refreshing stuck orders:', zincOrderIds);
      
      const { data, error } = await supabase.functions.invoke('check-zinc-order-status', {
        body: {
          orderIds: zincOrderIds
        }
      });

      if (error) {
        throw error;
      }

      const results = data.results || [];
      const successCount = results.filter((r: any) => r.updated).length;
      
      if (successCount > 0) {
        toast.success(`Updated ${successCount} stuck order(s)`);
        await fetchStuckOrders(); // Refresh the list
      } else {
        toast.info('No updates available for stuck orders');
      }

    } catch (error) {
      console.error('Error refreshing stuck orders:', error);
      toast.error('Failed to refresh stuck orders');
    }
  };

  const getStatusBadgeVariant = (hoursStuck: number) => {
    if (hoursStuck < 12) return 'secondary';
    if (hoursStuck < 24) return 'destructive';
    return 'destructive';
  };

  const getStatusIcon = (hoursStuck: number) => {
    if (hoursStuck < 12) return <Clock className="h-4 w-4" />;
    if (hoursStuck < 24) return <AlertTriangle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  useEffect(() => {
    fetchStuckOrders();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchStuckOrders();
      }, 5 * 60 * 1000); // Check every 5 minutes
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Order Monitoring
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStuckOrders}
              disabled={stuckOrders.length === 0}
            >
              Refresh Stuck Orders
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : stuckOrders.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-muted-foreground">No stuck orders found</p>
            <p className="text-sm text-muted-foreground">All orders are processing normally</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Found {stuckOrders.length} order(s) stuck for more than 6 hours
            </p>
            {stuckOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.hoursStuck)}
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      Zinc ID: {order.zinc_order_id || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {order.status} / Zinc: {order.zinc_status || 'unknown'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={getStatusBadgeVariant(order.hoursStuck)}>
                    {order.hoursStuck}h stuck
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Since {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Monitoring Rules:</strong>
          </p>
          <ul className="text-xs text-amber-700 mt-1 space-y-1">
            <li>• Orders stuck 6-12h: Normal processing time</li>
            <li>• Orders stuck 12-24h: Needs attention</li>
            <li>• Orders stuck 24h+: Likely requires manual intervention</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderMonitoring;
