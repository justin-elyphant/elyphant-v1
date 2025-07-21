
import React from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import OrderStatusChecker from '@/components/orders/OrderStatusChecker';
import OrderMonitoring from '@/components/orders/OrderMonitoring';

const OrderStatusDashboard = () => {
  return (
    <SidebarLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Order Status Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and check the status of your Zinc orders
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <OrderStatusChecker />
          <div className="lg:col-span-1">
            <OrderMonitoring />
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Next Steps if Order is Stuck:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. <strong>Check Zinc Dashboard:</strong> Look for account verification requirements</li>
            <li>2. <strong>Contact Zinc Support:</strong> If account is locked or needs verification</li>
            <li>3. <strong>Monitor for 24h:</strong> Some orders take longer due to processing delays</li>
            <li>4. <strong>Consider Cancellation:</strong> If stuck beyond 24h without progress</li>
          </ol>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default OrderStatusDashboard;
