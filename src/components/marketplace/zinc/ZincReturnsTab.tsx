
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Truck, Check, Clock } from "lucide-react";

// Mock returns data
const mockReturns = [
  {
    id: "ret_789012",
    orderId: "ord_123456",
    customerName: "Jane Smith",
    item: { name: "Echo Dot (4th Gen)", price: 49.99 },
    reason: "Defective product",
    status: "completed",
    requestDate: "2025-03-30T11:30:00Z",
    completionDate: "2025-04-02T14:45:00Z",
    refundAmount: 49.99,
    creditIssued: true
  },
  {
    id: "ret_789013",
    orderId: "ord_123457",
    customerName: "John Doe",
    item: { name: "Kindle Paperwhite", price: 139.99 },
    reason: "Changed mind",
    status: "in_transit",
    requestDate: "2025-04-02T09:15:00Z",
    completionDate: null,
    refundAmount: null,
    creditIssued: false
  },
  {
    id: "ret_789014",
    orderId: "ord_123458",
    customerName: "Alex Johnson",
    item: { name: "AirPods Pro", price: 249.99 },
    reason: "Incorrect item",
    status: "pending",
    requestDate: "2025-04-03T10:30:00Z",
    completionDate: null,
    refundAmount: null,
    creditIssued: false
  }
];

const ZincReturnsTab = () => {
  // Function to get appropriate badge variant based on return status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_transit":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "default";
    }
  };

  // Function to get icon based on return status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="h-3 w-3 mr-1" />;
      case "in_transit":
        return <Truck className="h-3 w-3 mr-1" />;
      case "pending":
        return <Clock className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Recent Returns</h3>
        <Button variant="outline" size="sm">
          <RotateCcw className="h-3 w-3 mr-1" />
          Initiate Return
        </Button>
      </div>
      
      {mockReturns.map(returnItem => (
        <Card key={returnItem.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Return #{returnItem.id.slice(-6)}</CardTitle>
              <Badge variant={getBadgeVariant(returnItem.status)} className="flex items-center">
                {getStatusIcon(returnItem.status)}
                {returnItem.status.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order:</span>
                <span>#{returnItem.orderId.slice(-6)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span>{returnItem.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Item:</span>
                <span>{returnItem.item.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Requested:</span>
                <span>{new Date(returnItem.requestDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reason:</span>
                <span>{returnItem.reason}</span>
              </div>
              
              {returnItem.status === "completed" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed:</span>
                    <span>{returnItem.completionDate ? new Date(returnItem.completionDate).toLocaleDateString() : "N/A"}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Refund Amount:</span>
                    <span>${returnItem.refundAmount?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Elephant Credit:</span>
                    <Badge variant={returnItem.creditIssued ? "default" : "outline"}>
                      {returnItem.creditIssued ? "Issued" : "Not Issued"}
                    </Badge>
                  </div>
                </>
              )}
              
              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="outline" size="sm">Details</Button>
                {returnItem.status === "pending" && (
                  <Button size="sm">Approve Return</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ZincReturnsTab;
