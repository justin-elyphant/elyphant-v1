
import React from "react";
import { Loader2, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type SubmissionStatus = "idle" | "submitting" | "success" | "error" | "info";

interface SubmissionStatusProps {
  status: SubmissionStatus;
  message?: string;
  className?: string;
}

const SubmissionStatus: React.FC<SubmissionStatusProps> = ({
  status,
  message,
  className
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "submitting": return "text-gray-500";
      case "success": return "text-green-500";
      case "error": return "text-red-500";
      case "info": return "text-blue-500";
      default: return "text-gray-400";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "submitting": 
        return <Loader2 className="h-4 w-4 animate-spin mr-2" />;
      case "success": 
        return <CheckCircle className="h-4 w-4 mr-2" />;
      case "error": 
        return <AlertCircle className="h-4 w-4 mr-2" />;
      case "info": 
        return <Info className="h-4 w-4 mr-2" />;
      default: 
        return null;
    }
  };

  if (status === "idle" && !message) return null;

  return (
    <div className={cn(
      "flex items-center mt-2 text-sm",
      getStatusColor(),
      className
    )}>
      {getStatusIcon()}
      <span>{message || getDefaultMessage()}</span>
    </div>
  );

  function getDefaultMessage() {
    switch (status) {
      case "submitting": return "Submitting...";
      case "success": return "Saved successfully";
      case "error": return "An error occurred";
      case "info": return "Please note";
      default: return "";
    }
  }
};

export default SubmissionStatus;
