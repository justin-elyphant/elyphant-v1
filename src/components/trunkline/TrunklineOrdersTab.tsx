
import React, { useState } from "react";
import { useOrders } from "@/hooks/trunkline/useOrders";
import OrderSearch from "./orders/OrderSearch";
import OrdersTable from "./orders/OrdersTable";
import EmailApprovalPanel from "@/components/auto-gifts/EmailApprovalPanel";
import OrderRecoveryTool from "@/components/admin/OrderRecoveryTool";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, Mail } from "lucide-react";
import { processEmailQueueNow } from "@/services/emailQueueService";
import { toast } from "sonner";

const TrunklineOrdersTab = () => {
  const { orders, loading, error, filters, setFilters, refetch } = useOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [processingEmails, setProcessingEmails] = useState(false);

  const handleOrderClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    // TODO: Implement order detail modal/page
    console.log('View order:', orderId);
  };

  const handleProcessEmailQueue = async () => {
    try {
      setProcessingEmails(true);
      const result = await processEmailQueueNow(true);
      
      toast.success("Email Queue Processed", {
        description: `✅ Processed ${result.processed} emails${result.errors > 0 ? ` (${result.errors} errors)` : ''}`,
      });
      
      console.log('[email-queue] Processed:', result);
    } catch (error: any) {
      console.error('[email-queue] Error:', error);
      toast.error("Email Processing Failed", {
        description: error.message || "Failed to process email queue",
      });
    } finally {
      setProcessingEmails(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading orders: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden pr-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
          <p className="text-slate-600 mt-1">
            Monitor and manage orders from the Enhanced Zinc API System
          </p>
        </div>
        <Button
          onClick={handleProcessEmailQueue}
          disabled={processingEmails}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          {processingEmails ? "Processing..." : "Process Email Queue"}
        </Button>
      </div>

      <OrderSearch
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={refetch}
        loading={loading}
      />

      <OrdersTable
        orders={orders}
        loading={loading}
        onOrderClick={handleOrderClick}
        onOrderUpdated={refetch}
      />

      {/* Universal Order Recovery Tool */}
      <div className="mt-8">
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>📦 Order Recovery Guide</strong>
            <br />
            Use the tool below for ALL recovery scenarios:
            <ul className="list-disc list-inside mt-2 text-sm">
              <li>✅ One-off purchases stuck in payment_confirmed</li>
              <li>✅ Auto-gifts that failed to reach Zinc</li>
              <li>✅ Scheduled orders that missed their delivery date</li>
              <li>✅ Manual recovery using order ID or number</li>
            </ul>
          </AlertDescription>
        </Alert>
        
        <OrderRecoveryTool />
      </div>
    </div>
  );
};

export default TrunklineOrdersTab;
