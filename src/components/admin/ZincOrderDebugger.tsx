
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, XCircle, RefreshCw, Search, Bug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderDebugResult {
  zincOrderId: string;
  status: string;
  updated?: boolean;
  error?: string;
  httpStatus?: number;
  fullResponse?: any;
  createdAt?: string;
  updatedAt?: string;
  trackingNumber?: string;
  totalPrice?: number;
}

interface DebugResponse {
  success: boolean;
  results?: OrderDebugResult[];
  summary?: {
    total: number;
    found: number;
    notFound: number;
    errors: number;
    updated: number;
  };
  error?: string;
  debugMode?: boolean;
}

const ZincOrderDebugger = () => {
  const [orderId, setOrderId] = useState('c5526964e99a6214ad309b2bd4dbc184');
  const [debugMode, setDebugMode] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<DebugResponse | null>(null);
  const [recentChecks, setRecentChecks] = useState<string[]>([]);

  const checkOrderStatus = async () => {
    if (!orderId.trim()) {
      toast.error('Please enter a Zinc Order ID');
      return;
    }

    setIsChecking(true);
    toast.loading('Checking Zinc order status...', { id: 'order-check' });

    try {
      const { data, error } = await supabase.functions.invoke('check-zinc-order-status', {
        body: {
          singleOrderId: orderId,
          debugMode: debugMode
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setResults(data);
      
      // Add to recent checks
      const timestamp = new Date().toLocaleString();
      setRecentChecks(prev => [`${orderId} (${timestamp})`, ...prev.slice(0, 4)]);

      if (data.success && data.results && data.results.length > 0) {
        const result = data.results[0];
        if (result.status === 'not_found') {
          toast.error('Order not found in Zinc system', { id: 'order-check' });
        } else if (result.error) {
          toast.error(`Error: ${result.error}`, { id: 'order-check' });
        } else {
          toast.success(`Order found with status: ${result.status}`, { id: 'order-check' });
        }
      } else {
        toast.error(data.error || 'Failed to check order', { id: 'order-check' });
      }
    } catch (error) {
      console.error('Error checking order:', error);
      toast.error(`Error: ${error.message}`, { id: 'order-check' });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_found':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'placed':
      case 'processing':
      case 'confirmed':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'shipped':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'api_error':
      case 'exception_error':
      case 'auth_error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_found':
        return 'destructive';
      case 'placed':
      case 'processing':
      case 'confirmed':
        return 'default';
      case 'shipped':
      case 'delivered':
        return 'default';
      case 'api_error':
      case 'exception_error':
      case 'auth_error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Zinc Order Status Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orderId">Zinc Order ID</Label>
            <Input
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter Zinc Order ID (e.g., c5526964e99a6214ad309b2bd4dbc184)"
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="debug-mode"
              checked={debugMode}
              onCheckedChange={setDebugMode}
            />
            <Label htmlFor="debug-mode" className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Debug Mode (Enhanced Logging)
            </Label>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={checkOrderStatus} 
              disabled={isChecking || !orderId.trim()}
              className="flex-1"
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Check Order Status
            </Button>
          </div>

          {recentChecks.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Recent Checks</Label>
              <div className="space-y-1">
                {recentChecks.map((check, index) => (
                  <div key={index} className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                    {check}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                {debugMode && <TabsTrigger value="raw">Raw Data</TabsTrigger>}
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                {results.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{results.summary.total}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.summary.found}</div>
                      <div className="text-sm text-muted-foreground">Found</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{results.summary.notFound}</div>
                      <div className="text-sm text-muted-foreground">Not Found</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{results.summary.errors}</div>
                      <div className="text-sm text-muted-foreground">Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.summary.updated}</div>
                      <div className="text-sm text-muted-foreground">Updated</div>
                    </div>
                  </div>
                )}

                {results.results && results.results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="font-mono text-sm">{result.zincOrderId}</span>
                      </div>
                      <Badge variant={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                    </div>

                    {result.error && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="text-sm text-red-800">
                          <strong>Error:</strong> {result.error}
                        </div>
                        {result.httpStatus && (
                          <div className="text-xs text-red-600 mt-1">
                            HTTP Status: {result.httpStatus}
                          </div>
                        )}
                      </div>
                    )}

                    {result.createdAt && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Created:</strong> {new Date(result.createdAt).toLocaleString()}
                      </div>
                    )}

                    {result.trackingNumber && (
                      <div className="text-sm">
                        <strong>Tracking:</strong> {result.trackingNumber}
                      </div>
                    )}

                    {result.totalPrice && (
                      <div className="text-sm">
                        <strong>Total:</strong> ${result.totalPrice}
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {results.results && results.results.map((result, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium">Order: {result.zincOrderId}</h4>
                    <Textarea
                      value={JSON.stringify(result, null, 2)}
                      readOnly
                      className="font-mono text-xs"
                      rows={10}
                    />
                  </div>
                ))}
              </TabsContent>

              {debugMode && (
                <TabsContent value="raw">
                  <Textarea
                    value={JSON.stringify(results, null, 2)}
                    readOnly
                    className="font-mono text-xs"
                    rows={20}
                  />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-red-600">Status: not_found</h4>
            <p>The order was never successfully submitted to Zinc's system. This indicates an issue during the order submission process.</p>
          </div>
          <div>
            <h4 className="font-medium text-yellow-600">Status: placed/processing</h4>
            <p>Order is in Zinc's system and being processed. This is normal for recent orders.</p>
          </div>
          <div>
            <h4 className="font-medium text-green-600">Status: shipped/delivered</h4>
            <p>Order has progressed through fulfillment. Check for tracking information.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-600">Debug Mode</h4>
            <p>Enables detailed logging including full API request/response data, headers, and timing information.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ZincOrderDebugger;
