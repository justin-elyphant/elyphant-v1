import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PaymentMethodManager from "@/components/payments/PaymentMethodManager";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Payments = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-muted-foreground mt-2">
            Manage your payment methods for orders and auto-gifting
          </p>
        </div>

        <div className="space-y-6">
          <PaymentMethodManager />
          
          <Card>
            <CardHeader>
              <CardTitle>Auto-Gifting Payments</CardTitle>
              <CardDescription>
                Payment methods configured here will be used for automatic gift purchases when you have auto-gifting rules set up.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your default payment method will be used for auto-gifting unless specified otherwise in your gifting rules.
                You'll always receive notifications before any auto-purchase is made.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payments;