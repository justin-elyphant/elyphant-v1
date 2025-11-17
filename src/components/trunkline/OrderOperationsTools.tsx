
import React from 'react';
import ZincOrderDebugger from '@/components/admin/ZincOrderDebugger';
import OrderRetryTool from '@/components/admin/OrderRetryTool';
import ZMAAccountManager from '@/components/admin/ZMAAccountManager';
import SyncZincOrdersButton from '@/components/admin/SyncZincOrdersButton';
import { ZMAFundingDashboard } from '@/components/admin/ZMAFundingDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const OrderOperationsTools = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Order Operations</h1>
        <p className="text-slate-600 mt-1">
          Manage order processing, funding, and diagnostics
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Specialized Order Tools</CardTitle>
          <CardDescription>
            Advanced diagnostics and billing operations for order processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> For most order recovery scenarios, use the <strong>Universal Order Recovery Tool</strong> on the Orders tab. 
              These specialized tools are for advanced diagnostics and billing operations.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="funding" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="funding">Funding</TabsTrigger>
            <TabsTrigger value="debugger">Diagnostics</TabsTrigger>
            <TabsTrigger value="retry">Retry w/ Billing</TabsTrigger>
            <TabsTrigger value="zma">Account Manager</TabsTrigger>
          </TabsList>
            <TabsContent value="funding" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Funding Management</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Monitor account balance and manage funding for pending orders. Orders are automatically held when balance is insufficient.
                  </p>
                </div>
                <ZMAFundingDashboard />
              </div>
            </TabsContent>
            <TabsContent value="debugger" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Order Diagnostics</h3>
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
                  <h3 className="text-lg font-semibold mb-2">Order Retry with Billing Update</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Retry failed orders by updating billing information and resubmitting to Zinc.
                  </p>
                </div>
                <OrderRetryTool />
              </div>
            </TabsContent>
            <TabsContent value="zma" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Account Management</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage processing accounts for reliable order fulfillment.
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

export default OrderOperationsTools;
