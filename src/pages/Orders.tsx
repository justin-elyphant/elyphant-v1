
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, TruckIcon, RefreshCw, MapPin, ArrowDown, ArrowUp } from "lucide-react";
import { getMockOrders } from "@/components/marketplace/zinc/orderService";
import { ZincOrder } from "@/components/marketplace/zinc/types";

const Orders = () => {
  const [userData] = useLocalStorage("userData", null);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ZincOrder[]>(getMockOrders());
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect to sign-up if not logged in
  React.useEffect(() => {
    if (!userData) {
      navigate("/sign-up");
    }
  }, [userData, navigate]);

  // Sort orders based on current sort settings
  const sortedOrders = React.useMemo(() => {
    return [...orders].sort((a, b) => {
      if (sortField === "date") {
        const dateA = new Date(a.date || "").getTime();
        const dateB = new Date(b.date || "").getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortField === "status") {
        const statusA = a.status || "";
        const statusB = b.status || "";
        return sortDirection === "asc" 
          ? statusA.localeCompare(statusB) 
          : statusB.localeCompare(statusA);
      } else if (sortField === "total") {
        const totalA = a.total || 0;
        const totalB = b.total || 0;
        return sortDirection === "asc" ? totalA - totalB : totalB - totalA;
      }
      return 0;
    });
  }, [orders, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? 
      <ArrowUp className="ml-1 h-3 w-3 inline" /> : 
      <ArrowDown className="ml-1 h-3 w-3 inline" />;
  };

  const refreshOrders = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setOrders(getMockOrders());
      setIsRefreshing(false);
    }, 800);
  };

  // Helper function to get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <Package className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            <TruckIcon className="h-3 w-3 mr-1" />
            Shipped
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-100">
            <RefreshCw className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
    }
  };

  if (!userData) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-muted-foreground">View and manage your order history</p>
        </div>
        <Button 
          variant="outline" 
          onClick={refreshOrders}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Order list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {sortedOrders.map((order) => (
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
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
