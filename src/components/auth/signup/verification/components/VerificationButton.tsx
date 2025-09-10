
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

interface VerificationButtonProps {
  onClick: () => void;
  disabled: boolean;
  isSubmitting: boolean;
}

const VerificationButton: React.FC<VerificationButtonProps> = ({
  onClick,
  disabled,
  isSubmitting
}) => {
  return (
    <Button 
      onClick={onClick}
      disabled={disabled}
      className="bg-purple-600 hover:bg-purple-700 text-white mb-4"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Verifying...
        </>
      ) : (
        <>
          <Check className="mr-2 h-4 w-4" />
          Verify Code
        </>
      )}
    </Button>
  );
};

export default VerificationButton;
