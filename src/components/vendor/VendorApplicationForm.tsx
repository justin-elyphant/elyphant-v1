
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { vendorFormSchema, type VendorFormValues } from "./vendorSchema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CompanyDetailsSection } from "./form-sections/CompanyDetailsSection";
import { IntegrationSection } from "./form-sections/IntegrationSection";
import { AgreementSection } from "./form-sections/AgreementSection";

export const VendorApplicationForm = () => {
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      companyName: "",
      email: "",
      website: "",
      integrationType: "",
      productCategories: "",
      acceptTerms: false,
      markupAcknowledgment: false,
    },
  });

  function onSubmit(values: VendorFormValues) {
    console.log(values);
    toast.success("Vendor application submitted successfully! We'll begin the onboarding process to import your products.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Application</CardTitle>
        <CardDescription>
          Apply to have your products featured on the Elyphant marketplace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CompanyDetailsSection form={form} />
            
            <IntegrationSection form={form} />
            
            <AgreementSection form={form} />
            
            <Button type="submit" className="w-full">Submit Application</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
