import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Package, Truck, Clock, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderProgressStepperProps {
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  zincTimelineEvents?: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    status: string;
    data?: any;
    source: 'zinc' | 'merchant';
  }>;
}

const OrderProgressStepper = ({ 
  status, 
  trackingNumber, 
  estimatedDelivery,
  zincTimelineEvents = []
}: OrderProgressStepperProps) => {
  const steps = [
    {
      id: "placed", // Changed from "pending" to match order flow
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
      description: status === "delivered" 
        ? (estimatedDelivery || "Package delivered successfully")
        : estimatedDelivery 
          ? `Est. ${estimatedDelivery}` 
          : "Package delivered"
    }
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ['placed', 'processing', 'shipped', 'delivered'];
    const currentStepIndex = stepOrder.indexOf(stepId);
    
    // PRIORITY 1: If order status indicates completion, override timeline events
    if (status === "delivered") {
      const deliveredIndex = stepOrder.indexOf('delivered');
      if (currentStepIndex < deliveredIndex) return "completed";
      if (currentStepIndex === deliveredIndex) return "active";
    }
    
    if (status === "shipped") {
      const shippedIndex = stepOrder.indexOf('shipped');
      if (currentStepIndex < shippedIndex) return "completed";
      if (currentStepIndex === shippedIndex) return "active";
      if (currentStepIndex > shippedIndex) return "inactive";
    }
    
    // PRIORITY 2: Use timeline events for in-progress orders
    if (zincTimelineEvents.length > 0 && status !== "delivered" && status !== "shipped") {
      const eventTypeMap: Record<string, string> = {
        'request.placed': 'placed',
        'request.finished': 'processing', 
        'shipment.shipped': 'shipped',
        'shipment.delivered': 'delivered',
        'tracking.available': 'shipped'
      };
      
      const completedSteps = zincTimelineEvents
        .map(event => eventTypeMap[event.type])
        .filter(Boolean);
      
      if (completedSteps.length > 0) {
        const latestCompletedIndex = Math.max(...completedSteps.map(step => stepOrder.indexOf(step)));
        
        if (currentStepIndex < latestCompletedIndex) return "completed";
        if (currentStepIndex === latestCompletedIndex) return "active";
        return "inactive";
      }
    }

    // PRIORITY 3: Fallback to order status mapping
    const statusProgressMap: Record<string, string[]> = {
      "pending": ["placed"],
      "payment_confirmed": ["placed"], 
      "processing": ["placed", "processing"],
      "submitted_to_zinc": ["placed", "processing"],
      "shipped": ["placed", "processing", "shipped"],
      "delivered": ["placed", "processing", "shipped", "delivered"],
      "cancelled": ["placed"],
      "failed": ["placed"]
    };
    
    const completedSteps = statusProgressMap[status] || ["placed"];
    
    if (completedSteps.includes(stepId)) {
      const latestCompletedStep = completedSteps[completedSteps.length - 1];
      return stepId === latestCompletedStep ? "active" : "completed";
    }
    
    return "inactive";
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4 sm:p-6">
        <div className="order-progress-stepper relative">
          <div className="flex justify-between items-start gap-2 sm:gap-4">
            {steps.map((step, index) => {
              const stepStatus = getStepStatus(step.id);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="order-progress-step flex flex-col items-center text-center flex-1 min-w-0 relative">
                  {/* Icon Circle */}
                  <div
                    className={cn(
                      "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 mb-3 transition-all shadow-sm relative z-10",
                      stepStatus === "completed" && "bg-green-600 border-green-600 text-white shadow-green-200",
                      stepStatus === "active" && "bg-primary border-primary text-primary-foreground shadow-primary/20",
                      stepStatus === "inactive" && "bg-background border-border text-muted-foreground"
                    )}
                  >
                    {stepStatus === "completed" ? (
                      <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    )}
                  </div>
                  
                  {/* Step Content */}
                  <div className="space-y-1 min-w-0 w-full px-1">
                    <h4 className={cn(
                      "text-xs sm:text-sm font-semibold leading-tight",
                      stepStatus === "active" && "text-primary",
                      stepStatus === "completed" && "text-green-600", 
                      stepStatus === "inactive" && "text-muted-foreground"
                    )}>
                      {step.label}
                    </h4>
                    <p className={cn(
                      "text-[10px] sm:text-xs leading-tight line-clamp-2",
                      stepStatus === "active" ? "text-foreground/70" : "text-muted-foreground/70"
                    )}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Connector Lines */}
          <div className="absolute top-6 sm:top-7 left-0 right-0 flex items-center justify-between px-6 sm:px-7">
            {steps.slice(0, -1).map((_, index) => {
              const currentStepStatus = getStepStatus(steps[index].id);
              return (
                <div 
                  key={index} 
                  className={cn(
                    "h-0.5 transition-colors",
                    currentStepStatus === "completed" ? "bg-green-600" : "bg-border"
                  )} 
                  style={{ 
                    width: `calc((100% - ${steps.length * 48}px) / ${steps.length - 1})`,
                    marginLeft: index === 0 ? '24px' : '0',
                    marginRight: index === steps.length - 2 ? '24px' : '0'
                  }}
                />
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