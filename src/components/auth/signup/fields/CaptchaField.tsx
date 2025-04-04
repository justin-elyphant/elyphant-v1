
import React, { useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface CaptchaFieldProps {
  form: UseFormReturn<any>;
}

// Simple captcha generator
const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
};

export const CaptchaField = ({ form }: CaptchaFieldProps) => {
  const [captchaText, setCaptchaText] = useState(() => generateCaptcha());
  const [captchaError, setCaptchaError] = useState("");
  
  const refreshCaptcha = () => {
    const newCaptcha = generateCaptcha();
    setCaptchaText(newCaptcha);
    setCaptchaError("");
    form.setValue("captcha", "");
  };

  // This function can be used externally to validate the captcha
  const validateCaptchaField = (value: string): boolean => {
    const isValid = value.toLowerCase() === captchaText.toLowerCase();
    setCaptchaError(isValid ? "" : "The captcha you entered is incorrect");
    return isValid;
  };

  return (
    <div className="space-y-2">
      <div className="relative bg-gray-50 p-3 rounded-md border">
        <div className="select-none text-xl font-bold tracking-wider text-center py-2" 
             style={{ fontFamily: 'monospace', letterSpacing: '0.25em' }}>
          {captchaText}
        </div>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="absolute top-3 right-3 h-8 w-8"
          onClick={refreshCaptcha}
        >
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Refresh Captcha</span>
        </Button>
      </div>
      
      <FormField
        control={form.control}
        name="captcha"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Captcha</FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter the code shown above" 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {captchaError && (
        <p className="text-sm font-medium text-destructive">{captchaError}</p>
      )}
    </div>
  );
};

export { type CaptchaFieldProps };
