
import React from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface VerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  value,
  onChange,
  error,
  disabled
}) => {
  return (
    <div className="mb-4">
      <InputOTP 
        maxLength={6} 
        value={value} 
        onChange={onChange}
        disabled={disabled}
        render={({ slots }) => (
          <InputOTPGroup className="gap-2">
            {slots.map((slot, index) => (
              <React.Fragment key={index}>
                <InputOTPSlot
                  className={`rounded-md border-gray-300 focus:border-purple-400 focus:ring focus:ring-purple-200 focus:ring-opacity-50 ${
                    error ? "border-red-300" : ""
                  }`}
                  index={index}
                >
                  {slot.char}
                </InputOTPSlot>
              </React.Fragment>
            ))}
          </InputOTPGroup>
        )}
      />
    </div>
  );
};

export default VerificationCodeInput;
