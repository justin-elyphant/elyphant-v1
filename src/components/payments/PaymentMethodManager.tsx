
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { Elements } from '@stripe/react-stripe-js';
import { stripeClientManager } from "@/services/payment/StripeClientManager";
import PaymentMethodForm from "./PaymentMethodForm";
import SavedPaymentMethods from "./SavedPaymentMethods";

const PaymentMethodManager = () => {
  const [activeTab, setActiveTab] = useState<string>("saved");
  
  const handleAddSuccess = () => {
    setActiveTab("saved");
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saved">Saved Methods</TabsTrigger>
            <TabsTrigger value="add">
              <Plus className="h-4 w-4 mr-1" />
              Add New
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="saved" className="mt-4">
            <SavedPaymentMethods />
          </TabsContent>
          
          <TabsContent value="add" className="mt-4">
            <Elements stripe={stripeClientManager.getStripePromise()}>
              <PaymentMethodForm onSuccess={handleAddSuccess} />
            </Elements>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodManager;
