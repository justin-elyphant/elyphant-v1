import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface RetryOrderButtonProps {
  orderId: string;
  className?: string;
}

const RetryOrderButton = ({ orderId, className }: RetryOrderButtonProps) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      console.log(`🔄 Retrying order: ${orderId}`);
      
      const { data, error } = await supabase.functions.invoke('retry-failed-order', {
        body: { orderId }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Order retry initiated successfully', {
        description: `Order ${orderId} has been queued for retry processing`
      });

      console.log('✅ Order retry result:', data);
      
      // Refresh the page after 2 seconds to show updated status
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('❌ Order retry failed:', error);
      toast.error('Failed to retry order', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Button 
      onClick={handleRetry}
      disabled={isRetrying}
      variant="outline"
      className={className}
    >
      {isRetrying ? 'Retrying...' : 'Retry Order'}
    </Button>
  );
};

export default RetryOrderButton;