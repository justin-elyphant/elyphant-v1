
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";
import StandardBackButton from "@/components/shared/StandardBackButton";

const OrderNotFound = () => {
  return (
    <Card>
      <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
        <InfoIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
        <p className="text-muted-foreground mb-4">We couldn't find the order you're looking for.</p>
        <StandardBackButton to="/orders" text="Back to Orders" />
      </CardContent>
    </Card>
  );
};

export default OrderNotFound;
