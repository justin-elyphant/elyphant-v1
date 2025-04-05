
import React from "react";
import { Loader2 } from "lucide-react";

interface VerificationStatusProps {
  verificationChecking: boolean;
}

const VerificationStatus = ({ verificationChecking }: VerificationStatusProps) => {
  if (!verificationChecking) return null;
  
  return (
    <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-100 flex items-center justify-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      <span className="text-blue-700">Checking verification status automatically...</span>
    </div>
  );
};

export default VerificationStatus;
