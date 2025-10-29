
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { Shield } from "lucide-react";
import { SharingLevel } from "@/types/supabase";
import PrivacySelector from "./PrivacySelector";
import { Separator } from "@/components/ui/separator";

/**
 * Section for managing data sharing settings in user profile
 */
const DataSharingSection = () => {
  const form = useFormContext();

  const handleSharingChange = (field: string, value: SharingLevel) => {
    form.setValue(`data_sharing_settings.${field}`, value, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>My Data</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground">
          Control who can see your personal information. Your preferences can be changed at any time.
        </p>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="data_sharing_settings.email"
            render={({ field }) => (
              <FormItem>
                <PrivacySelector
                  value={field.value as SharingLevel}
                  onChange={(value) => handleSharingChange("email", value)}
                  label="Email Address Visibility"
                  description="Who can see your email address"
                />
              </FormItem>
            )}
          />

          <Separator />
          
          <FormField
            control={form.control}
            name="data_sharing_settings.dob"
            render={({ field }) => (
              <FormItem>
                <PrivacySelector
                  value={field.value as SharingLevel}
                  onChange={(value) => handleSharingChange("dob", value)}
                  label="Birthday Visibility"
                  description="Who can see your date of birth"
                />
              </FormItem>
            )}
          />

          <Separator />
          
          <FormField
            control={form.control}
            name="data_sharing_settings.shipping_address"
            render={({ field }) => (
              <FormItem>
                <PrivacySelector
                  value={field.value as SharingLevel}
                  onChange={(value) => handleSharingChange("shipping_address", value)}
                  label="Shipping Address Visibility"
                  description="Who can see your shipping address"
                />
              </FormItem>
            )}
          />

          <Separator />
          
          <FormField
            control={form.control}
            name="data_sharing_settings.interests"
            render={({ field }) => (
              <FormItem>
                <PrivacySelector
                  value={field.value as SharingLevel}
                  onChange={(value) => handleSharingChange("interests", value)}
                  label="Interests Visibility"
                  description="Who can see your interests and preferences"
                />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSharingSection;
