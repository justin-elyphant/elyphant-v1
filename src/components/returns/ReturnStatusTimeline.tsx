
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, Truck, RefreshCw, PackageCheck } from "lucide-react";

type ReturnStatus = "requested" | "approved" | "in_transit" | "processing" | "completed";

interface TimelineStep {
  status: ReturnStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
  date?: string | null;
}

interface ReturnStatusTimelineProps {
  currentStatus: ReturnStatus;
  requestDate?: string;
  transitDate?: string;
  processingDate?: string;
  completionDate?: string | null;
}

const ReturnStatusTimeline = ({
  currentStatus,
  requestDate,
  transitDate,
  processingDate,
  completionDate
}: ReturnStatusTimelineProps) => {
  const steps: TimelineStep[] = [
    {
      status: "requested",
      label: "Return Requested",
      description: "Your return request has been submitted",
      icon: <Clock className="h-5 w-5" />,
      date: requestDate
    },
    {
      status: "approved",
      label: "Return Approved",
      description: "Your return request has been approved",
      icon: <Check className="h-5 w-5" />,
      date: requestDate ? new Date(new Date(requestDate).getTime() + 24 * 60 * 60 * 1000).toISOString() : null
    },
    {
      status: "in_transit",
      label: "Return in Transit",
      description: "Your items are on the way back to us",
      icon: <Truck className="h-5 w-5" />,
      date: transitDate
    },
    {
      status: "processing",
      label: "Processing Return",
      description: "We're processing your returned items",
      icon: <RefreshCw className="h-5 w-5" />,
      date: processingDate
    },
    {
      status: "completed",
      label: "Return Complete",
      description: "Your return has been processed successfully",
      icon: <PackageCheck className="h-5 w-5" />,
      date: completionDate
    }
  ];

  // Map status to index for comparison
  const statusIndex = {
    requested: 0,
    approved: 1,
    in_transit: 2,
    processing: 3,
    completed: 4
  };

  const currentStepIndex = statusIndex[currentStatus];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Return Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Progress line */}
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-muted" />

          <div className="space-y-8">
            {steps.map((step, index) => {
              // Determine the state of this step
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step.status} className="relative flex items-start">
                  {/* Icon container */}
                  <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${
                    isCompleted ? "bg-primary border-primary text-primary-foreground" : 
                    "bg-muted border-muted-foreground/20 text-muted-foreground"
                  }`}>
                    {step.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="ml-4 pb-8">
                    <h3 className={`text-base font-semibold ${isCurrent ? "text-primary" : ""}`}>
                      {step.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                    {step.date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(step.date).toLocaleDateString()} at {new Date(step.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {isCurrent && !step.date && step.status !== "completed" && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Estimated: {new Date().toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReturnStatusTimeline;
