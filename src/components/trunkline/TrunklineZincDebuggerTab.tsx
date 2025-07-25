
import React from 'react';
import ZincOrderDebugger from '@/components/admin/ZincOrderDebugger';
import OrderRetryTool from '@/components/admin/OrderRetryTool';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TrunklineZincDebuggerTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Zinc Order Tools</h1>
        <p className="text-slate-600 mt-1">
          Debug and manage Zinc order processing issues
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Order Management Tools</CardTitle>
          <CardDescription>
            Use these tools to troubleshoot Zinc orders, check status, and retry failed orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="debugger" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="debugger">Order Debugger</TabsTrigger>
              <TabsTrigger value="retry">Order Retry Tool</TabsTrigger>
            </TabsList>
            <TabsContent value="debugger" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Debug Tools</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Check order status, view detailed logs, and manually verify orders that may be stuck.
                  </p>
                </div>
                <ZincOrderDebugger />
              </div>
            </TabsContent>
            <TabsContent value="retry" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Order Retry Tool</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Retry failed orders by updating billing information and resubmitting to Zinc.
                  </p>
                </div>
                <OrderRetryTool />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrunklineZincDebuggerTab;
