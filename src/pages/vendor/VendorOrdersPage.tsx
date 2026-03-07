import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, Truck, Clock, CheckCircle, XCircle } from "lucide-react";
import { useVendorOrders, VendorOrder } from "@/hooks/vendor/useVendorOrders";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Pending", variant: "outline", icon: Clock },
  accepted: { label: "Accepted", variant: "secondary", icon: CheckCircle },
  processing: { label: "Processing", variant: "secondary", icon: Clock },
  shipped: { label: "Shipped", variant: "default", icon: Truck },
  delivered: { label: "Delivered", variant: "default", icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
  returned: { label: "Returned", variant: "destructive", icon: XCircle },
};

const filters = ["all", "pending", "accepted", "shipped", "delivered"] as const;

const VendorOrdersPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: orders, isLoading } = useVendorOrders(statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Orders
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage orders for your products.
        </p>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <Button
            key={f}
            variant={statusFilter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(f)}
            className="capitalize text-xs"
          >
            {f}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {statusFilter === "all" ? "All Orders" : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Orders`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">No orders yet.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Orders will appear here when customers purchase your products.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const OrderRow: React.FC<{ order: VendorOrder }> = ({ order }) => {
  const config = statusConfig[order.status] ?? statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <StatusIcon className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {order.customer_name ?? "Customer"}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(order.created_at), "MMM d, yyyy")}
            {order.shipping_address_masked?.city && ` · ${order.shipping_address_masked.city}, ${order.shipping_address_masked.state}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <p className="text-sm font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
          ${Number(order.total_amount).toFixed(2)}
        </p>
        <Badge variant={config.variant} className="text-xs">
          {config.label}
        </Badge>
      </div>
    </div>
  );
};

export default VendorOrdersPage;
