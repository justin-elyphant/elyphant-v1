import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const TestEmailSystem = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [emailType, setEmailType] = useState('user_welcomed');

  const emailTypes = [
    { value: 'user_welcomed', label: 'Welcome Email' },
    { value: 'order_confirmed', label: 'Order Confirmation' },
    { value: 'payment_confirmed', label: 'Payment Confirmation' }, 
    { value: 'order_status_updated', label: 'Order Status Update' },
    { value: 'order_cancelled', label: 'Order Cancellation' },
    { value: 'cart_abandoned', label: 'Abandoned Cart Recovery' },
    { value: 'post_purchase_followup', label: 'Post-Purchase Followup' },
    { value: 'auto_gift_approval', label: 'Auto-Gift Approval' },
    { value: 'gift_invitation', label: 'Gift Invitation' }
  ];

  const testEmailSystem = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log(`Testing email system with type: ${emailType}`);
      
      const { data, error } = await supabase.functions.invoke('test-email-system', {
        body: { emailType }
      });

      if (error) {
        console.error('Email test error:', error);
        toast.error(`Error: ${error.message}`);
        setResult({ error: error.message });
      } else {
        console.log('Email test result:', data);
        toast.success('Email system test completed');
        setResult(data);
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('Unexpected error occurred');
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Email System</CardTitle>
          <CardDescription>
            Test the comprehensive e-commerce email system with different email types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Type</label>
            <Select value={emailType} onValueChange={setEmailType}>
              <SelectTrigger>
                <SelectValue placeholder="Select email type" />
              </SelectTrigger>
              <SelectContent>
                {emailTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={testEmailSystem}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test Email System'}
          </Button>
          
          {result && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Result:</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestEmailSystem;