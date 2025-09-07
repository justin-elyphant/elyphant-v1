import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const TestRetryFunction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testRetryFunction = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log('Testing retry function...');
      
      const { data, error } = await supabase.functions.invoke('process-retry-pending-orders', {
        body: { test: true }
      });

      if (error) {
        console.error('Retry function error:', error);
        toast.error(`Error: ${error.message}`);
        setResult({ error: error.message });
      } else {
        console.log('Retry function result:', data);
        toast.success('Retry function executed successfully');
        setResult(data);
      }
    } catch (error) {
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
          <CardTitle>Test Retry Function</CardTitle>
          <CardDescription>
            Manually trigger the process-retry-pending-orders function to test our payment verification fix
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testRetryFunction}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test Retry Function'}
          </Button>
          
          {result && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Result:</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestRetryFunction;