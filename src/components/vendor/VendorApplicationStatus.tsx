
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ApplicationStatus = "pending" | "under_review" | "approved" | "rejected";

interface VendorApplicationStatusProps {
  status: ApplicationStatus;
  submissionDate?: string;
  notes?: string;
}

export const VendorApplicationStatus = ({
  status,
  submissionDate,
  notes,
}: VendorApplicationStatusProps) => {
  // Map status to progress percentage
  const getProgressValue = (currentStatus: ApplicationStatus): number => {
    switch (currentStatus) {
      case "pending":
        return 25;
      case "under_review":
        return 50;
      case "approved":
        return 100;
      case "rejected":
        return 100; // Still 100% complete, just with a negative outcome
      default:
        return 0;
    }
  };

  // Get appropriate status color
  const getStatusColor = (currentStatus: ApplicationStatus): string => {
    switch (currentStatus) {
      case "pending":
        return "text-amber-500";
      case "under_review":
        return "text-blue-500";
      case "approved":
        return "text-green-500";
      case "rejected":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  // Get appropriate status icon
  const StatusIcon = ({ status }: { status: ApplicationStatus }) => {
    switch (status) {
      case "pending":
        return <Clock className={cn("h-5 w-5", getStatusColor(status))} />;
      case "under_review":
        return <Clock className={cn("h-5 w-5", getStatusColor(status))} />;
      case "approved":
        return <CheckCircle className={cn("h-5 w-5", getStatusColor(status))} />;
      case "rejected":
        return <AlertCircle className={cn("h-5 w-5", getStatusColor(status))} />;
      default:
        return null;
    }
  };

  // Get human readable status text
  const getStatusText = (currentStatus: ApplicationStatus): string => {
    switch (currentStatus) {
      case "pending":
        return "Pending";
      case "under_review":
        return "Under Review";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Application Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <StatusIcon status={status} />
          <span className={cn("font-medium", getStatusColor(status))}>
            {getStatusText(status)}
          </span>
        </div>

        <Progress 
          value={getProgressValue(status)} 
          className={cn(
            "h-2", 
            status === "rejected" ? "bg-red-100" : "bg-gray-100",
            status === "rejected" ? "[&>div]:bg-red-500" : status === "approved" ? "[&>div]:bg-green-500" : "[&>div]:bg-blue-500"
          )} 
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Submitted</span>
          <span>Under Review</span>
          <span>Decision</span>
        </div>

        {submissionDate && (
          <div className="text-sm text-muted-foreground mt-4">
            <span className="font-medium">Submitted on:</span> {submissionDate}
          </div>
        )}

        {notes && (
          <div className="mt-2 text-sm border-t pt-2">
            <span className="font-medium">Notes:</span> {notes}
          </div>
        )}

        {status === "pending" && (
          <p className="text-sm text-muted-foreground">
            Your application is being processed. We'll update you soon.
          </p>
        )}

        {status === "under_review" && (
          <p className="text-sm text-muted-foreground">
            Our team is currently reviewing your application. This typically takes 1-2 business days.
          </p>
        )}

        {status === "approved" && (
          <p className="text-sm text-green-600">
            Congratulations! Your vendor application has been approved. You can now start setting up your products.
          </p>
        )}

        {status === "rejected" && (
          <p className="text-sm text-red-600">
            Unfortunately, your application wasn't approved at this time. Please review the notes for more information or contact support.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
