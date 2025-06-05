
import { useState } from "react";
import { toast } from "sonner";
import { testPurchase } from "../zincService";
import { getMockOrders } from "../orderService";

// Updated Order interface to match ZincOrder structure
interface Order {
  id: string;
  status: string;
  customerName: string; // Required in Order
  date: string;
  items: { name: string; quantity: number; price: number; }[];
  total: number;
}

export const useOrders = () => {
  // Convert ZincOrder[] to Order[] on initialization
  const [orders, setOrders] = useState<Order[]>(() => {
    const zincOrders = getMockOrders();
    // Map ZincOrder to Order, ensuring required fields are present
    return zincOrders.map(order => ({
      id: order.id,
      status: order.status,
      customerName: order.customerName || "Unknown Customer", // Provide default for optional field
      date: order.date || new Date().toISOString(),
      items: order.items || [],
      total: order.total || 0
    }));
  });
  
  const [isTestPurchaseModalOpen, setIsTestPurchaseModalOpen] = useState(false);
  const [testProductId, setTestProductId] = useState("B01DFKC2SO"); // Default test product - Amazon Echo Dot
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSimulatedTest, setIsSimulatedTest] = useState(true);

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

  const openTestPurchaseModal = () => {
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
        
        // Add the test purchase to the orders list - now ensuring it matches Order type
        const newOrder: Order = {
          id: result.id,
          status: "processing",
          customerName: "Test User",
          date: new Date().toISOString(),
          items: [{ name: "Test Product", quantity: 1, price: result.total_price || 0 }],
          total: result.total_price || 0
        };
        
        setOrders(prevOrders => [newOrder, ...prevOrders]);
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

  return {
    orders,
    isTestPurchaseModalOpen, 
    setIsTestPurchaseModalOpen,
    testProductId,
    setTestProductId,
    isProcessing,
    isSimulatedTest,
    setIsSimulatedTest,
    handleProcessOrder,
    openTestPurchaseModal,
    handleTestPurchase
  };
};
