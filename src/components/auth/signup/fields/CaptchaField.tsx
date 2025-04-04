
import React, { useEffect, useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from "react-simple-captcha";

interface CaptchaFieldProps {
  form: UseFormReturn<any>;
}

const CaptchaField = ({ form }: CaptchaFieldProps) => {
  const [captchaError, setCaptchaError] = useState("");
  
  useEffect(() => {
    // Load the captcha engine when the component mounts
    loadCaptchaEnginge(6);
  }, []);

  const refreshCaptcha = () => {
    loadCaptchaEnginge(6);
    setCaptchaError("");
    form.setValue("captcha", "");
  };

  // This function can be used externally to validate the captcha
  const validateCaptchaField = (value: string): boolean => {
    const isValid = validateCaptcha(value);
    setCaptchaError(isValid ? "" : "The captcha you entered is incorrect");
    return isValid;
  };

  return (
    <div className="space-y-2">
      <div className="relative bg-gray-50 p-3 rounded-md border">
        <LoadCanvasTemplate />
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

export { CaptchaField, type CaptchaFieldProps };
