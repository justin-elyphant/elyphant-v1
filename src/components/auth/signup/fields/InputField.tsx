
import React, { useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LucideIcon, Eye, EyeOff } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";

interface InputFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  Icon?: LucideIcon;
}

const InputField = ({ form, name, label, placeholder, type = "text", Icon }: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              {Icon && (
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              )}
              <Input 
                type={inputType} 
                placeholder={placeholder} 
                className={Icon ? "pl-10" : ""} 
                {...field} 
              />
              {isPassword && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default InputField;
