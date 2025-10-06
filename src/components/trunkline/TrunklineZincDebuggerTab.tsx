
import React from 'react';
import ZincOrderDebugger from '@/components/admin/ZincOrderDebugger';
import OrderRetryTool from '@/components/admin/OrderRetryTool';
import ZMAAccountManager from '@/components/admin/ZMAAccountManager';
import SyncZincOrdersButton from '@/components/admin/SyncZincOrdersButton';
import { ZMAFundingDashboard } from '@/components/admin/ZMAFundingDashboard';
import ForceProcessOrder from '@/components/admin/ForceProcessOrder';
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
          <Tabs defaultValue="funding" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="funding">💰 Funding</TabsTrigger>
            <TabsTrigger value="debugger">Order Debugger</TabsTrigger>
            <TabsTrigger value="retry">Order Retry Tool</TabsTrigger>
            <TabsTrigger value="force">🚨 Force Process</TabsTrigger>
            <TabsTrigger value="zma">ZMA Accounts</TabsTrigger>
          </TabsList>
            <TabsContent value="funding" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">ZMA Funding Management</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Monitor your ZMA balance and manage funding for pending orders. Orders are automatically held when balance is insufficient.
                  </p>
                </div>
                <ZMAFundingDashboard />
              </div>
            </TabsContent>
            <TabsContent value="debugger" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Debug Tools</h3>
                    <p className="text-sm text-muted-foreground">
                      Check order status, view detailed logs, and manually verify orders that may be stuck.
                    </p>
                  </div>
                  <SyncZincOrdersButton />
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
            <TabsContent value="force" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Force Process Order (VIP Override)</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Bypass funding checks to process VIP or urgent orders immediately. Admin only.
                  </p>
                </div>
                <ForceProcessOrder />
              </div>
            </TabsContent>
            <TabsContent value="zma" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">ZMA Account Management</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage Zinc Managed Accounts for reliable order processing without Amazon credential issues.
                  </p>
                </div>
                <ZMAAccountManager />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrunklineZincDebuggerTab;
