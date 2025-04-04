
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PaymentMethodManager from "@/components/payments/PaymentMethodManager";

const PaymentSettings = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Manage your payment methods for auto-gifting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentMethodManager />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View your payment and auto-gifting history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No payment history yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSettings;
