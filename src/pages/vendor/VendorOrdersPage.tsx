import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Loader2, Truck, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { useVendorOrders, VendorOrder } from "@/hooks/vendor/useVendorOrders";
import { useUpdateVendorOrderStatus } from "@/hooks/vendor/useVendorOrderActions";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);

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
                <OrderRow key={order.id} order={order} onManage={() => setSelectedOrder(order)} />
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

      {selectedOrder && (
        <OrderManageDialog
          order={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

const OrderRow: React.FC<{ order: VendorOrder; onManage: () => void }> = ({ order, onManage }) => {
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
            {order.shipping_address_masked?.city && ` · ${(order.shipping_address_masked as any).city}, ${(order.shipping_address_masked as any).state}`}
          </p>
          {order.tracking_number && (
            <p className="text-xs text-muted-foreground mt-0.5">
              <Truck className="inline h-3 w-3 mr-1" />{order.tracking_number}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <p className="text-sm font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
          ${Number(order.vendor_payout).toFixed(2)}
        </p>
        <Badge variant={config.variant} className="text-xs">
          {config.label}
        </Badge>
        <Button variant="outline" size="sm" onClick={onManage} className="text-xs">
          Manage
        </Button>
      </div>
    </div>
  );
};

interface OrderManageDialogProps {
  order: VendorOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OrderManageDialog: React.FC<OrderManageDialogProps> = ({ order, open, onOpenChange }) => {
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [carrier, setCarrier] = useState(order.carrier || "");
  const updateStatus = useUpdateVendorOrderStatus();

  const handleSave = () => {
    updateStatus.mutate(
      {
        vendorOrderId: order.id,
        status,
        trackingNumber: trackingNumber || undefined,
        carrier: carrier || undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const lineItems = Array.isArray(order.line_items) ? order.line_items : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Manage Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Line items */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Items</p>
            {lineItems.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.title} × {item.quantity}</span>
                <span className="text-foreground">${(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Shipping info */}
          {order.shipping_address_masked && (
            <div>
              <p className="text-sm font-medium text-foreground">Ship to</p>
              <p className="text-sm text-muted-foreground">
                {(order.shipping_address_masked as any).name && `${(order.shipping_address_masked as any).name}, `}
                {(order.shipping_address_masked as any).city}, {(order.shipping_address_masked as any).state} {(order.shipping_address_masked as any).postal_code}
              </p>
            </div>
          )}

          {/* Status */}
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Status</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tracking (show when shipped) */}
          {(status === "shipped" || status === "delivered") && (
            <>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Tracking Number</p>
                <Input
                  placeholder="e.g. 1Z999AA10123456784"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Carrier</p>
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usps">USPS</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="fedex">FedEx</SelectItem>
                    <SelectItem value="dhl">DHL</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Payout info */}
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Your payout</span>
            <span className="font-medium text-foreground">${Number(order.vendor_payout).toFixed(2)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateStatus.isPending}>
            {updateStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VendorOrdersPage;
