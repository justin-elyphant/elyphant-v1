import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth';

export default function SyncZincOrdersButton() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  const handleSync = async () => {
    if (!user) {
      toast.error('Authentication required');
      return;
    }

    setIsSyncing(true);
    setLastSyncResult(null);

    try {
      console.log('🔄 Triggering manual Zinc order sync...');

      const { data, error } = await supabase.functions.invoke('sync-zinc-orders', {
        body: {
          syncType: 'manual',
          triggeredBy: user.id
        }
      });

      if (error) {
        throw error;
      }

      setLastSyncResult(data);

      if (data.success) {
        const { ordersChecked, ordersUpdated, ordersFailed } = data;
        
        if (ordersChecked === 0) {
          toast.info('No pending orders to sync', {
            description: 'All orders are up to date'
          });
        } else {
          toast.success(`Sync completed: ${ordersUpdated} updated`, {
            description: ordersFailed > 0 
              ? `${ordersFailed} failed to sync` 
              : `${ordersChecked} orders checked`
          });
        }
      } else {
        toast.error('Sync failed', {
          description: data.error || 'Unknown error'
        });
      }

    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('Failed to sync orders', {
        description: error.message || 'Unknown error occurred'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        variant="outline"
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Sync All Pending Orders'}
      </Button>

      {lastSyncResult && !isSyncing && (
        <div className="flex items-center gap-2 text-sm">
          {lastSyncResult.success ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">
                {lastSyncResult.ordersUpdated} updated, {lastSyncResult.ordersFailed} failed
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-muted-foreground">Sync failed</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
