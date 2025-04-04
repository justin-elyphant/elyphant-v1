
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getMockOrders } from "@/components/marketplace/zinc/orderService";
import { toast } from "sonner";
import OrderSkeleton from "@/components/orders/OrderSkeleton";
import OrderNotFound from "@/components/orders/OrderNotFound";
import ExistingReturnsCard from "@/components/returns/ExistingReturnsCard";
import SelectReturnItemsCard from "@/components/returns/SelectReturnItemsCard";
import ReturnDetailsForm from "@/components/returns/ReturnDetailsForm";
import { useReturnForm } from "@/components/returns/hooks/useReturnForm";

const Returns = () => {
  const { orderId } = useParams();
  const [userData] = useLocalStorage("userData", null);
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    selectedItems,
    returnReasons,
    existingReturns,
    handleItemSelection,
    handleReasonChange,
    handleSubmitReturn
  } = useReturnForm(orderId, order);

  // Redirect to sign-up if not logged in
  useEffect(() => {
    if (!userData) {
      navigate("/sign-up");
    }
  }, [userData, navigate]);

  // Load order details
  useEffect(() => {
    if (!orderId) return;
    
    setIsLoading(true);
    
    // Simulate API call to get order details
    setTimeout(() => {
      const orders = getMockOrders();
      const foundOrder = orders.find(o => o.id === orderId);
      
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        toast.error("Order not found");
        navigate("/orders");
      }
      
      setIsLoading(false);
    }, 500);
  }, [orderId, navigate]);

  if (!userData || isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4 flex justify-center">
        <OrderSkeleton />
      </div>
    );
  }

  if (existingReturns.length > 0) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate(`/orders/${orderId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
        </div>
        <ExistingReturnsCard existingReturns={existingReturns} orderId={orderId} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <OrderNotFound />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate(`/orders/${orderId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Order
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Return Items</h1>
        <p className="text-muted-foreground">
          Order #{order.id.slice(-6)} • Placed on {new Date(order.date).toLocaleDateString()}
        </p>
      </div>

      <SelectReturnItemsCard
        order={order}
        selectedItems={selectedItems}
        returnReasons={returnReasons}
        handleItemSelection={handleItemSelection}
        handleReasonChange={handleReasonChange}
      />

      <ReturnDetailsForm 
        orderId={orderId}
        handleSubmitReturn={handleSubmitReturn} 
      />
    </div>
  );
};

export default Returns;
