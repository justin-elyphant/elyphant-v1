
import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatOrderNumberWithHash } from "@/utils/orderHelpers";
import { formatPrice } from "@/lib/utils";
import { MapPin, ExternalLink, Copy } from "lucide-react";
import OrderStatusBadge from "./OrderStatusBadge";
import { ZincOrder } from "@/components/marketplace/zinc/types";
import { toast } from "sonner";

interface OrdersTableProps {
  orders: ZincOrder[];
  sortField: string;
  sortDirection: "asc" | "desc";
  handleSort: (field: string) => void;
  getSortIcon: (field: string) => React.ReactNode;
}

const OrdersTable = ({ 
  orders, 
  sortField, 
  sortDirection, 
  handleSort, 
  getSortIcon 
}: OrdersTableProps) => {
  const navigate = useNavigate();

  const getCarrierUrl = (trackingNumber: string) => {
    // Simple carrier detection based on tracking number format
    if (trackingNumber.match(/^1Z/)) return `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
    if (trackingNumber.match(/^\d{12}$/)) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
    if (trackingNumber.match(/^\d{14}$/)) return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    if (trackingNumber.match(/^\d{10,11}$/)) return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
    return `https://www.google.com/search?q=track+package+${trackingNumber}`;
  };

  const copyTrackingNumber = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    toast.success("Tracking number copied to clipboard");
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px] cursor-pointer" onClick={() => handleSort("date")}>
            Date {getSortIcon("date")}
          </TableHead>
          <TableHead>Order</TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
            Status {getSortIcon("status")}
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort("total")}>
            Total {getSortIcon("total")}
          </TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">
              {new Date(order.date!).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div>{formatOrderNumberWithHash(order.id)}</div>
              <div className="text-sm text-muted-foreground">
                {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
              </div>
              {order.tracking_number && (
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <span>Tracking: {order.tracking_number}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => copyTrackingNumber(order.tracking_number!)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </TableCell>
            <TableCell><OrderStatusBadge status={order.status} /></TableCell>
            <TableCell>{formatPrice(order.total)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/orders/${order.id}`}>Details</a>
                </Button>
                {order.status === "delivered" && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/returns/${order.id}`}>Return</a>
                  </Button>
                )}
                {order.tracking_number && order.status === "shipped" && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={getCarrierUrl(order.tracking_number)} target="_blank" rel="noopener noreferrer">
                      <MapPin className="h-3 w-3 mr-1" /> Track
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
                {!order.tracking_number && order.status === "shipped" && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/tracking/${order.id}`}>
                      <MapPin className="h-3 w-3 mr-1" /> Track
                    </a>
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default OrdersTable;
