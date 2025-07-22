
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ZincOrderDebugger = () => {
  const [orderInput, setOrderInput] = useState('c5526964e99a6214ad309b2bd4dbc184');
  const [isChecking, setIsChecking] = useState(false);
  const [debugResult, setDebugResult] = useState<any>(null);
  const [logs, setLogs] = useState<string>('');

  const checkOrderStatus = async () => {
    if (!orderInput.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    setIsChecking(true);
    setDebugResult(null);
    setLogs('Starting order status check...\n');

    try {
      console.log('Checking order status for:', orderInput);
      
      const { data, error } = await supabase.functions.invoke('check-zinc-order-status', {
        body: { 
          orderRequestId: orderInput.trim(),
          debug: true 
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        setLogs(prev => prev + `Error: ${error.message}\n`);
        setDebugResult({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        });
        toast.error('Failed to check order status');
        return;
      }

      console.log('Order status response:', data);
      setLogs(prev => prev + `Success: Received response\n${JSON.stringify(data, null, 2)}\n`);
      setDebugResult({
        ...data,
        timestamp: new Date().toISOString()
      });

      if (data.success) {
        toast.success('Order status retrieved successfully');
      } else {
        toast.warning('Order check completed with issues');
      }

    } catch (err) {
      console.error('Unexpected error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setLogs(prev => prev + `Unexpected error: ${errorMessage}\n`);
      setDebugResult({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      toast.error('Unexpected error occurred');
    } finally {
      setIsChecking(false);
    }
  };

  const manualVerification = async () => {
    if (!orderInput.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    setIsChecking(true);
    setLogs(prev => prev + '\nStarting manual verification...\n');

    try {
      const { data, error } = await supabase.functions.invoke('process-zinc-order', {
        body: { 
          orderRequestId: orderInput.trim(),
          action: 'verify',
          debug: true 
        }
      });

      if (error) {
        setLogs(prev => prev + `Verification error: ${error.message}\n`);
        toast.error('Manual verification failed');
        return;
      }

      setLogs(prev => prev + `Verification complete: ${JSON.stringify(data, null, 2)}\n`);
      toast.success('Manual verification completed');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setLogs(prev => prev + `Verification error: ${errorMessage}\n`);
      toast.error('Manual verification failed');
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'placed':
      case 'shipped':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'placed':
      case 'shipped':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This tool helps troubleshoot Zinc order processing issues. Use it to check order status, 
          view detailed logs, and manually verify orders that may be stuck.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Order Status Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orderInput">Zinc Order ID</Label>
            <Input
              id="orderInput"
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              placeholder="Enter Zinc order request ID"
              disabled={isChecking}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={checkOrderStatus} 
              disabled={isChecking}
              className="flex items-center gap-2"
            >
              {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Check Status
            </Button>
            
            <Button 
              onClick={manualVerification} 
              disabled={isChecking}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Manual Verify
            </Button>
          </div>

          {debugResult && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Status Result:</h3>
                <Badge variant={debugResult.success ? "default" : "destructive"}>
                  {debugResult.success ? 'Success' : 'Failed'}
                </Badge>
              </div>

              {debugResult.zincStatus && (
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugResult.zincStatus)}
                  <span className="font-medium">Zinc Status:</span>
                  <Badge className={getStatusColor(debugResult.zincStatus)}>
                    {debugResult.zincStatus}
                  </Badge>
                </div>
              )}

              {debugResult.orderData && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <h4 className="font-medium mb-2">Order Details:</h4>
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(debugResult.orderData, null, 2)}
                  </pre>
                </div>
              )}

              {debugResult.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{debugResult.error}</AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-gray-500">
                Checked at: {new Date(debugResult.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={logs}
            readOnly
            className="min-h-[200px] font-mono text-sm"
            placeholder="Debug logs will appear here..."
          />
          <Button 
            onClick={() => setLogs('')}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Clear Logs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ZincOrderDebugger;
