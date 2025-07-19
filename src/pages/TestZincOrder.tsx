import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TestZincOrder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testZincOrder = async () => {
    setIsLoading(true);
    try {
      // Create a minimal test order
      const testOrderRequest = {
        retailer: "amazon",
        products: [{
          product_id: "B001E4KFG0",  // A basic product for testing
          quantity: 1
        }],
        shipping_address: {
          first_name: "Test",
          last_name: "User",
          address_line1: "123 Main St",
          address_line2: "",
          zip_code: "90210",
          city: "Beverly Hills",
          state: "CA",
          country: "US",
          phone_number: "5551234567"
        },
        billing_address: {
          first_name: "Test",
          last_name: "User",
          address_line1: "123 Main St",
          address_line2: "",
          zip_code: "90210",
          city: "Beverly Hills",
          state: "CA",
          country: "US",
          phone_number: "5551234567"
        },
        payment_method: {
          name_on_card: "Test User",
          type: "credit",
          number: "4111111111111111",
          security_code: "123",
          expiration_month: 12,
          expiration_year: 2025,
          use_gift: false
        },
        shipping_method: "cheapest",
        is_gift: false,
        is_test: true
      };

      const { data, error } = await supabase.functions.invoke('process-zinc-order', {
        body: {
          orderRequest: testOrderRequest,
          orderId: 'test-order-' + Date.now(),
          paymentIntentId: 'test-payment-intent'
        }
      });
      
      if (error) {
        console.error('Function error:', error);
        toast.error('Failed to test Zinc order processing');
        setResult({ error: error.message });
      } else {
        console.log('Zinc order test result:', data);
        setResult(data);
        if (data.success) {
          toast.success('Zinc order processing test successful!');
        } else {
          toast.error('Zinc order processing test failed');
        }
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error testing order processing');
      setResult({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Zinc Order Processing Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will test the complete order processing flow with Zinc API using test data.
          </p>
          
          <Button 
            onClick={testZincOrder} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing Order Processing...' : 'Test Zinc Order Processing'}
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

export default TestZincOrder;