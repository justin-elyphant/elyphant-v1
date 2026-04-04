import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Package, Truck, Clock, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeOrderSteps, ZincTimelineEvent } from "@/utils/orderTrackingUtils";

interface OrderProgressStepperProps {
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  zincTimelineEvents?: ZincTimelineEvent[];
}

const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ordered: Package,
  processing: Clock,
  shipped: Truck,
  delivered: Home,
};

const OrderProgressStepper = ({
  status,
  trackingNumber,
  estimatedDelivery,
  zincTimelineEvents = [],
}: OrderProgressStepperProps) => {
  const steps = computeOrderSteps(status, zincTimelineEvents);

  return (
    <Card className="mb-4">
      <CardContent className="p-4 sm:p-6">
        <div className="order-progress-stepper relative">
          <div className="flex justify-between items-start gap-2 sm:gap-4">
            {steps.map((step) => {
              const Icon = stepIcons[step.id] || Package;
              const stepStatus =
                step.status === "upcoming" ? "inactive" : step.status;

              return (
                <div
                  key={step.id}
                  className="order-progress-step flex flex-col items-center text-center flex-1 min-w-0 relative"
                >
                  <div
                    className={cn(
                      "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 mb-3 transition-all relative z-10",
                      stepStatus === "completed" &&
                        "bg-foreground border-foreground text-background",
                      stepStatus === "active" &&
                        "bg-destructive border-destructive text-destructive-foreground shadow-lg shadow-destructive/20",
                      stepStatus === "inactive" &&
                        "bg-muted border-border text-muted-foreground"
                    )}
                    style={{ minHeight: "44px", minWidth: "44px" }}
                  >
                    {stepStatus === "completed" ? (
                      <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 w-full px-1">
                    <h4
                      className={cn(
                        "text-xs sm:text-sm font-semibold leading-tight",
                        stepStatus === "active" && "text-destructive",
                        stepStatus === "completed" && "text-foreground",
                        stepStatus === "inactive" && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </h4>
                    <p
                      className={cn(
                        "text-[10px] sm:text-xs leading-tight line-clamp-2",
                        stepStatus === "active"
                          ? "text-foreground/70"
                          : "text-muted-foreground/70"
                      )}
                    >
                      {step.id === "shipped" && trackingNumber
                        ? `Tracking: ${trackingNumber}`
                        : step.id === "delivered" && status === "delivered"
                        ? estimatedDelivery || "Package delivered successfully"
                        : step.id === "delivered" && estimatedDelivery
                        ? `Est. ${estimatedDelivery}`
                        : step.id === "ordered"
                        ? "Your order has been received"
                        : step.id === "processing"
                        ? "Preparing your order"
                        : step.id === "shipped"
                        ? "On its way"
                        : "Package delivered"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connector Lines */}
          <div className="absolute top-6 sm:top-7 left-0 right-0 flex items-center justify-between px-6 sm:px-7">
            {steps.slice(0, -1).map((step, index) => (
              <div
                key={index}
                className={cn(
                  "h-0.5 transition-colors",
                  step.status === "completed" ? "bg-foreground" : "bg-border"
                )}
                style={{
                  width: `calc((100% - ${steps.length * 48}px) / ${steps.length - 1})`,
                  marginLeft: index === 0 ? "24px" : "0",
                  marginRight: index === steps.length - 2 ? "24px" : "0",
                }}
              />
            ))}
          </div>
        </div>

        {status === "shipped" && estimatedDelivery && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Estimated Delivery</span>
              <span className="text-sm font-semibold">{estimatedDelivery}</span>
            </div>
            <div className="w-full bg-border rounded-full h-1">
              <div
                className="bg-destructive h-1 rounded-full transition-all"
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
