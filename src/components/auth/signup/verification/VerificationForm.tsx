
import React, { useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface VerificationFormProps {
  userEmail: string;
  onVerificationSuccess: () => void;
  testVerificationCode?: string | null;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ 
  userEmail, 
  onVerificationSuccess 
}) => {
  // COMPLETELY bypass verification - trigger success immediately
  useEffect(() => {
    console.log("BYPASS: Completely skipping email verification process");
    // Immediate success trigger without any delay
    onVerificationSuccess();
    
  }, [onVerificationSuccess]);

  return (
    <div className="flex flex-col items-center justify-center">
      <Alert className="bg-amber-50 border-amber-200 mb-4">
        <Info className="h-4 w-4 text-amber-500 mr-2" />
        <AlertDescription className="text-amber-700">
          <span className="font-semibold">Auto-redirect active:</span> Skipping verification. You will be redirected to profile setup automatically.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default VerificationForm;
