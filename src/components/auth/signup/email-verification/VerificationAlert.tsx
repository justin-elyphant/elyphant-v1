
import React from "react";
import { Mail } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const VerificationAlert = () => {
  return (
    <Alert className="bg-purple-50 border-purple-200">
      <Mail className="h-4 w-4 text-purple-600" />
      <AlertTitle className="text-purple-800 font-medium">Verification Required</AlertTitle>
      <AlertDescription className="text-purple-700">
        Please check your inbox and click the verification link to continue.
        If you don't see the email, check your spam folder.
      </AlertDescription>
    </Alert>
  );
};

export default VerificationAlert;
