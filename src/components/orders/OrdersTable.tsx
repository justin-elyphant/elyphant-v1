
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
import { MapPin } from "lucide-react";
import OrderStatusBadge from "./OrderStatusBadge";
import { ZincOrder } from "@/components/marketplace/zinc/types";

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
              <div>#{order.id.slice(-6)}</div>
              <div className="text-sm text-muted-foreground">
                {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
              </div>
            </TableCell>
            <TableCell><OrderStatusBadge status={order.status} /></TableCell>
            <TableCell>${order.total?.toFixed(2)}</TableCell>
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
                {order.status === "shipped" && (
                  <Button variant="outline" size="sm">
                    <MapPin className="h-3 w-3 mr-1" /> Track
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
