
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, InfoIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const OrderNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <Card>
      <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
        <InfoIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
        <p className="text-muted-foreground mb-4">We couldn't find the order you're looking for.</p>
        <Button onClick={() => navigate("/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </CardContent>
    </Card>
  );
};

export default OrderNotFound;
