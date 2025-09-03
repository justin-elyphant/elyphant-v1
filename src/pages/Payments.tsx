import React from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import UnifiedPaymentMethodManager from "@/components/payments/UnifiedPaymentMethodManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

const Payments = () => {
  return (
    <SidebarLayout>
      <div className="container max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8" />
            Payment Methods
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your payment methods and billing information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Payment Methods</CardTitle>
            <CardDescription>
              Add, edit, or remove payment methods for your purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UnifiedPaymentMethodManager />
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Payments;