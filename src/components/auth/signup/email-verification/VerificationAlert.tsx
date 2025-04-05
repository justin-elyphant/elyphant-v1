
import React from "react";
import { Mail } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface VerificationAlertProps {
  useCode?: boolean;
}

const VerificationAlert = ({ useCode = false }: VerificationAlertProps) => {
  return (
    <Alert className="bg-purple-50 border-purple-200">
      <Mail className="h-4 w-4 text-purple-600" />
      <AlertTitle className="text-purple-800 font-medium">Verification Required</AlertTitle>
      <AlertDescription className="text-purple-700">
        {useCode ? (
          <>
            Please check your email for a 6-digit verification code.
            Enter the code below to complete your signup.
            If you don't see the email, check your spam folder.
          </>
        ) : (
          <>
            Please check your inbox and click the verification link to continue.
            If you don't see the email, check your spam folder.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default VerificationAlert;
