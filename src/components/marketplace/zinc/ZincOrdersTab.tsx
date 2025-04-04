
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, TruckIcon, Package, Settings, Play } from "lucide-react";
import { toast } from "sonner";
import { getMockOrders } from "./orderService";
import AmazonCredentialsManager from "./AmazonCredentialsManager";
import { AmazonCredentials } from "./types";
import { testPurchase } from "./zincService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ZincOrdersTab = () => {
  const [orders, setOrders] = useState(getMockOrders());
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [isTestPurchaseModalOpen, setIsTestPurchaseModalOpen] = useState(false);
  const [testProductId, setTestProductId] = useState("B01DFKC2SO"); // Default test product - Amazon Echo Dot
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAmazonCredentials, setHasAmazonCredentials] = useState(
    localStorage.getItem('amazonCredentials') !== null
  );

  // Function to get appropriate badge variant based on order status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "default";
      case "shipped":
        return "secondary";
      case "processing":
        return "outline";
      default:
        return "default";
    }
  };

  // Function to get icon based on order status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <Package className="h-3 w-3 mr-1" />;
      case "shipped":
        return <TruckIcon className="h-3 w-3 mr-1" />;
      case "processing":
        return <ShoppingBag className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const handleSaveCredentials = (credentials: AmazonCredentials) => {
    setHasAmazonCredentials(true);
    console.log("Amazon credentials saved:", credentials.email);
  };

  const handleProcessOrder = (orderId: string) => {
    toast.loading("Processing order...", { id: "process-order" });
    
    // Simulate order processing for now
    setTimeout(() => {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: "shipped" } 
            : order
        )
      );
      
      toast.success("Order processed successfully", { id: "process-order" });
    }, 2000);
  };
  
  const handleManageCredentials = () => {
    setIsCredentialsModalOpen(true);
  };

  const openTestPurchaseModal = () => {
    if (!hasAmazonCredentials) {
      toast.error("Please add Amazon credentials first");
      setIsCredentialsModalOpen(true);
      return;
    }
    setIsTestPurchaseModalOpen(true);
  };

  const handleTestPurchase = async () => {
    if (!testProductId.trim()) {
      toast.error("Please enter a valid product ID");
      return;
    }

    setIsProcessing(true);
    toast.loading("Processing test purchase...", { id: "test-purchase" });

    try {
      const result = await testPurchase(testProductId);
      if (result) {
        toast.success(`Test purchase successful! Order ID: ${result.id}`, { id: "test-purchase" });
        
        // Add the test purchase to the orders list
        setOrders(prevOrders => [{
          id: result.id,
          status: "processing",
          customerName: "Test User",
          date: new Date().toISOString(),
          items: [{ name: "Test Product", quantity: 1, price: result.total_price || 0 }],
          total: result.total_price || 0
        }, ...prevOrders]);
      } else {
        toast.error("Test purchase failed. Check console for details.", { id: "test-purchase" });
      }
    } catch (error) {
      console.error("Test purchase error:", error);
      toast.error(`Test purchase error: ${error instanceof Error ? error.message : "Unknown error"}`, { id: "test-purchase" });
    } finally {
      setIsProcessing(false);
      setIsTestPurchaseModalOpen(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Recent Orders</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManageCredentials}
          >
            <Settings className="h-3 w-3 mr-1" />
            {hasAmazonCredentials ? "Update Amazon Credentials" : "Add Amazon Credentials"}
          </Button>
          {hasAmazonCredentials && (
            <Button 
              variant="default" 
              size="sm"
              onClick={openTestPurchaseModal}
            >
              <Play className="h-3 w-3 mr-1" />
              Test Purchase
            </Button>
          )}
          <Button variant="outline" size="sm">View All Orders</Button>
        </div>
      </div>
      
      {orders.map(order => (
        <Card key={order.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Order #{order.id.slice(-6)}</CardTitle>
              <Badge variant={getBadgeVariant(order.status)} className="flex items-center">
                {getStatusIcon(order.status)}
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span>{order.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date:</span>
                <span>{new Date(order.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items:</span>
                <span>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
              
              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="outline" size="sm">Details</Button>
                {order.status === "processing" && (
                  <Button 
                    size="sm" 
                    onClick={() => handleProcessOrder(order.id)}
                    disabled={!hasAmazonCredentials}
                  >
                    {hasAmazonCredentials ? "Process Now" : "Add Amazon Credentials"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Amazon Credentials Manager */}
      <AmazonCredentialsManager 
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        onSave={handleSaveCredentials}
      />

      {/* Test Purchase Dialog */}
      <Dialog open={isTestPurchaseModalOpen} onOpenChange={setIsTestPurchaseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Test Purchase</DialogTitle>
            <DialogDescription>
              This will process a test purchase using your Amazon account.
              Enter an Amazon product ID to test.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-id">Amazon Product ID</Label>
              <Input
                id="product-id"
                placeholder="e.g., B01DFKC2SO"
                value={testProductId}
                onChange={(e) => setTestProductId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter an Amazon ASIN (product ID). Default is B01DFKC2SO for Amazon Echo Dot.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsTestPurchaseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleTestPurchase} 
              disabled={isProcessing || !testProductId.trim()}
            >
              {isProcessing ? "Processing..." : "Process Test Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZincOrdersTab;
