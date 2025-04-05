
import React from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const ImportantNoteAlert = () => {
  return (
    <Alert className="bg-amber-50 border-amber-200 mt-6">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Important Note</AlertTitle>
      <AlertDescription className="text-amber-700">
        After verifying your email, you'll be automatically redirected to your Elyphant dashboard.
        If not, click the "I've Verified My Email" button above.
      </AlertDescription>
    </Alert>
  );
};

export default ImportantNoteAlert;
