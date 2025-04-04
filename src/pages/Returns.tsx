
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
import ReturnStepsIndicator from "@/components/returns/ReturnStepsIndicator";
import { useReturnForm } from "@/components/returns/hooks/useReturnForm";

const Returns = () => {
  const { orderId } = useParams();
  const [userData] = useLocalStorage("userData", null);
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  
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

  // Handle step navigation
  const nextStep = () => {
    const anyItemSelected = Object.values(selectedItems).some(selected => selected);
    
    if (currentStep === 1 && !anyItemSelected) {
      toast.error("Please select at least one item to return");
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle the submit and set it to final step
  const onSubmitReturn = () => {
    handleSubmitReturn();
    setCurrentStep(3);
  };

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

      <ReturnStepsIndicator currentStep={currentStep} />

      {currentStep === 1 && (
        <>
          <SelectReturnItemsCard
            order={order}
            selectedItems={selectedItems}
            returnReasons={returnReasons}
            handleItemSelection={handleItemSelection}
            handleReasonChange={handleReasonChange}
          />
          <div className="flex justify-end mt-6">
            <Button onClick={nextStep}>
              Continue to Return Details
            </Button>
          </div>
        </>
      )}

      {currentStep === 2 && (
        <>
          <ReturnDetailsForm 
            orderId={orderId}
            handleSubmitReturn={onSubmitReturn} 
          />
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={prevStep}>
              Back to Select Items
            </Button>
          </div>
        </>
      )}

      {currentStep === 3 && (
        <div className="bg-card rounded-lg border p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Return Request Submitted</h2>
          <p className="mb-6">Your return request has been submitted successfully. You will receive a confirmation email shortly.</p>
          <Button onClick={() => navigate("/orders")}>
            View All Orders
          </Button>
        </div>
      )}
    </div>
  );
};

export default Returns;
