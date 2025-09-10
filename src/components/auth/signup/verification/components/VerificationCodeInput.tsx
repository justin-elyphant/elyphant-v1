
import React from "react";
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot
} from "@/components/ui/input-otp";

interface VerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <label 
        htmlFor="verification-code" 
        className="text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        Enter 6-digit verification code
      </label>
      
      <InputOTP
        id="verification-code"
        value={value}
        onChange={onChange}
        maxLength={6}
        disabled={disabled}
        render={({ slots }) => (
          <div className="flex justify-center gap-2">
            {slots.map((slot, index) => (
              <InputOTPSlot 
                key={index} 
                {...slot} 
                index={index}
                className="w-10 h-12 text-center text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            ))}
          </div>
        )}
      />
      
      <p className="text-sm text-muted-foreground mt-1">
        Enter the 6-digit code sent to your email
      </p>
    </div>
  );
};

export default VerificationCodeInput;
