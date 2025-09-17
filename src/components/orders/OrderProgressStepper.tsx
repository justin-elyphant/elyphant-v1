import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Package, Truck, Clock, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderProgressStepperProps {
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

const OrderProgressStepper = ({ 
  status, 
  trackingNumber, 
  estimatedDelivery 
}: OrderProgressStepperProps) => {
  const steps = [
    {
      id: "pending",
      label: "Order Placed",
      icon: Package,
      description: "Your order has been received"
    },
    {
      id: "processing",
      label: "Processing",
      icon: Clock,
      description: "Preparing your order"
    },
    {
      id: "shipped",
      label: "Shipped",
      icon: Truck,
      description: trackingNumber ? `Tracking: ${trackingNumber}` : "On its way"
    },
    {
      id: "delivered",
      label: "Delivered",
      icon: Home,
      description: estimatedDelivery ? `Est. ${estimatedDelivery}` : "Package delivered"
    }
  ];

  const getStepStatus = (stepId: string) => {
    const statusOrder = ["pending", "processing", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepId);
    
    if (status === "cancelled" || status === "failed") {
      return stepIndex === 0 ? "completed" : "inactive";
    }
    
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "inactive";
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="order-progress-stepper">
          <div className="flex justify-between items-center min-w-0">
            {steps.map((step, index) => {
              const stepStatus = getStepStatus(step.id);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="order-progress-step flex flex-col items-center text-center flex-1 min-w-0 px-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-all",
                      stepStatus === "completed" && "bg-green-600 border-green-600 text-white",
                      stepStatus === "active" && "bg-primary border-primary text-primary-foreground",
                      stepStatus === "inactive" && "bg-background border-muted-foreground text-muted-foreground"
                    )}
                  >
                    {stepStatus === "completed" ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className="space-y-1 min-w-0">
                    <h4 className={cn(
                      "text-xs sm:text-sm font-medium truncate",
                      stepStatus === "inactive" && "text-muted-foreground"
                    )}>
                      {step.label}
                    </h4>
                    <p className={cn(
                      "text-[10px] sm:text-xs leading-tight overflow-hidden",
                      stepStatus === "inactive" ? "text-muted-foreground" : "text-muted-foreground"
                    )} style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {status === "shipped" && estimatedDelivery && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Estimated Delivery</span>
              <span className="text-sm font-bold text-primary">{estimatedDelivery}</span>
            </div>
            <div className="w-full bg-border rounded-full h-1">
              <div 
                className="tracking-progress w-3/4"
                style={{ width: "75%" }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderProgressStepper;