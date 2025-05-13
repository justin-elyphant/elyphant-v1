
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LucideIcon } from "lucide-react";

interface InputFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  Icon?: LucideIcon;
  autoComplete?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  form,
  name,
  label,
  placeholder = "",
  type = "text",
  Icon,
  autoComplete,
}) => {
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
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Icon className="h-4 w-4" />
                </span>
              )}
              <Input
                placeholder={placeholder}
                type={type}
                className={Icon ? "pl-10" : ""}
                autoComplete={autoComplete}
                {...field}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default InputField;
