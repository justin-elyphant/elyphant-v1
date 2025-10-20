import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface OrderBackfillButtonProps {
  orderId: string;
}

export const OrderBackfillButton = ({ orderId }: OrderBackfillButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleBackfill = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('backfill-order-tracking', {
        body: { orderId }
      });

      if (error) {
        console.error('Backfill error:', error);
        toast.error('Failed to update tracking data');
      } else {
        toast.success('Order tracking data updated!');
        // Refresh the page to show updates
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      console.error('Backfill exception:', err);
      toast.error('Failed to update tracking data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleBackfill} 
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Updating...' : 'Update Tracking Data'}
    </Button>
  );
};
