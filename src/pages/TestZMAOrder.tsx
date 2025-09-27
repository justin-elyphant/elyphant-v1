import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TestZMAOrder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testZMAOrder = async () => {
    setIsLoading(true);
    try {
      // Process the stuck order directly through ZMA
      const testOrderId = '40175959-7c4e-498f-92df-f6cd5bf38d28'; // Stuck order from payment_confirmed
      
      console.log('Testing ZMA order processing for order:', testOrderId);
      
      const { data, error } = await supabase.functions.invoke('process-zma-order', {
        body: {
          orderId: testOrderId
        }
      });
      
      if (error) {
        console.error('Function error:', error);
        toast.error('Failed to process ZMA order');
        setResult({ error: error.message });
      } else {
        console.log('ZMA order processing result:', data);
        setResult(data);
        if (data.success) {
          toast.success('ZMA order processed successfully!');
        } else {
          toast.error('ZMA order processing failed');
        }
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error processing ZMA order');
      setResult({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>ZMA Order Processing Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will test the ZMA order processing with our test Sharp Pebble order.
          </p>
          
          <Button 
            onClick={testZMAOrder} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Processing ZMA Order...' : 'Test ZMA Order Processing'}
          </Button>
          
          {result && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestZMAOrder;