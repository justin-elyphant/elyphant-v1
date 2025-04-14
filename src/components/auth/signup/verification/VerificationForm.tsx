
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Mail } from "lucide-react";
import { toast } from "sonner";

interface VerificationFormProps {
  userEmail: string;
  onVerificationSuccess: () => void;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ 
  userEmail, 
  onVerificationSuccess
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Set flags for new signup journey
    localStorage.setItem("newSignUp", "true");
    localStorage.setItem("userEmail", userEmail);
  }, [userEmail]);

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-4">
      <Alert variant="info" className="bg-blue-50 border-blue-200 mb-4 w-full">
        <Mail className="h-4 w-4 text-blue-600 mr-2" />
        <AlertDescription className="text-blue-700">
          Please check your email to confirm your account. Once confirmed, you'll be redirected to complete your profile.
        </AlertDescription>
      </Alert>

      <p className="text-sm text-gray-600">
        We've sent a confirmation link to: <strong>{userEmail}</strong>
      </p>
    </div>
  );
};

export default VerificationForm;
