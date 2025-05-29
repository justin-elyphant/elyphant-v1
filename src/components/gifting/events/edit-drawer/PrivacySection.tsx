
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface PrivacySectionProps {
  form: UseFormReturn<any>;
}

const PrivacySection = ({ form }: PrivacySectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center">
        <Shield className="h-4 w-4 mr-2" />
        Privacy Settings
      </h3>
      
      <FormField
        control={form.control}
        name="privacyLevel"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Who can see this event?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private">Private (Only visible to you)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="shared" id="shared" />
                  <Label htmlFor="shared">Shared (Visible to connected users)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public">Public (Visible to everyone)</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default PrivacySection;
