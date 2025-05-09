
import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PrivacyNoticeProps {
  dataType: string;
  onConnect?: () => void;
  alreadyRequested?: boolean;
}

const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ 
  dataType, 
  onConnect,
  alreadyRequested = false
}) => {
  return (
    <Alert className="bg-gray-50 border-gray-200">
      <AlertCircle className="h-4 w-4 text-gray-500" />
      <AlertDescription className="text-gray-600 flex flex-wrap items-center gap-2">
        <span>This user's {dataType} information is only visible to friends.</span>
        {onConnect && !alreadyRequested && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onConnect} 
            className="ml-auto text-xs h-7"
          >
            Send Friend Request
          </Button>
        )}
        {onConnect && alreadyRequested && (
          <span className="text-xs text-gray-500 ml-auto">
            Friend request pending
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default PrivacyNotice;
