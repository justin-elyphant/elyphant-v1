
import React from "react";
import { Loader2, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import SubmissionStatus from "@/components/common/SubmissionStatus";

interface ProfileSubmissionStatusProps {
  isSubmitting: boolean;
  isCompleting: boolean;
  error: string | null;
  className?: string;
}

const ProfileSubmissionStatus = ({
  isSubmitting,
  isCompleting,
  error,
  className
}: ProfileSubmissionStatusProps) => {
  // Determine the status based on props
  const getStatus = () => {
    if (error) return "error";
    if (isSubmitting) return "submitting";
    if (isCompleting) return "success";
    return "idle";
  };

  // Get appropriate message based on status
  const getMessage = () => {
    if (error) return error;
    if (isSubmitting) return "Submitting your profile...";
    if (isCompleting) return "Profile completed successfully!";
    return "";
  };

  return (
    <SubmissionStatus 
      status={getStatus()} 
      message={getMessage()}
      className={className}
    />
  );
};

export default ProfileSubmissionStatus;
