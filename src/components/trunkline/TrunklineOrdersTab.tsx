
import React, { useState } from "react";
import { useOrders } from "@/hooks/trunkline/useOrders";
import OrderSearch from "./orders/OrderSearch";
import OrdersTable from "./orders/OrdersTable";
import EmailApprovalPanel from "@/components/auto-gifts/EmailApprovalPanel";

const TrunklineOrdersTab = () => {
  const { orders, loading, error, filters, setFilters, refetch } = useOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleOrderClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    // TODO: Implement order detail modal/page
    console.log('View order:', orderId);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
        <p className="text-slate-600 mt-1">
          Monitor and manage orders from the Enhanced Zinc API System
        </p>
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
    </div>
  );
};

export default TrunklineOrdersTab;
