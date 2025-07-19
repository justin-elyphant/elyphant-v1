import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TestZinc = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testZincConnection = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-zinc-connection', {
        body: {}
      });
      
      if (error) {
        console.error('Function error:', error);
        toast.error('Failed to test Zinc connection');
        setResult({ error: error.message });
      } else {
        console.log('Zinc test result:', data);
        setResult(data);
        if (data.success) {
          toast.success('Zinc API connection successful!');
        } else {
          toast.error('Zinc API connection failed');
        }
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error testing connection');
      setResult({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Zinc API Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testZincConnection} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test Zinc Connection'}
          </Button>
          
          {result && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestZinc;