import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  status: 'success' | 'error' | 'loading';
  message: string;
  details?: any;
}

export const MarketplaceStatusCheck = () => {
  const [testResults, setTestResults] = useState<{
    zincFunction: TestResult;
    apiKey: TestResult;
    sampleSearch: TestResult;
  }>({
    zincFunction: { status: 'loading', message: 'Not tested' },
    apiKey: { status: 'loading', message: 'Not tested' },
    sampleSearch: { status: 'loading', message: 'Not tested' }
  });

  const testZincFunction = async () => {
    setTestResults(prev => ({
      ...prev,
      zincFunction: { status: 'loading', message: 'Testing zinc-search function...' }
    }));

    try {
      const { data, error } = await supabase.functions.invoke('zinc-search', {
        body: { query: 'test', maxResults: '1' }
      });

      if (error) {
        setTestResults(prev => ({
          ...prev,
          zincFunction: { 
            status: 'error', 
            message: 'Function invoke failed',
            details: error
          }
        }));
        return;
      }

      if (data?.error) {
        setTestResults(prev => ({
          ...prev,
          zincFunction: { 
            status: 'error', 
            message: 'Function returned error',
            details: data.error
          }
        }));
        return;
      }

      setTestResults(prev => ({
        ...prev,
        zincFunction: { 
          status: 'success', 
          message: 'Function responding correctly',
          details: `Returned ${data?.results?.length || 0} results`
        }
      }));

    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        zincFunction: { 
          status: 'error', 
          message: 'Function test failed',
          details: err.message
        }
      }));
    }
  };

  const runAllTests = async () => {
    await testZincFunction();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'loading': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Marketplace System Status</CardTitle>
        <CardDescription>
          Test the current status of the Zinc API integration and marketplace functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runAllTests} className="w-full">
          Run System Tests
        </Button>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.zincFunction.status)}
              <span className="font-medium">Zinc Search Function</span>
            </div>
            <div className="text-right">
              <div className="text-sm">{testResults.zincFunction.message}</div>
              {testResults.zincFunction.details && (
                <div className="text-xs text-muted-foreground">
                  {typeof testResults.zincFunction.details === 'string' 
                    ? testResults.zincFunction.details 
                    : JSON.stringify(testResults.zincFunction.details)}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};