
import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const OrdersCard = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <ShoppingBag className="h-5 w-5 mr-2 text-emerald-500" />
          My Orders
        </CardTitle>
        <CardDescription>
          Track your purchases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            View and manage your order history and delivery status.
          </p>
          <Button className="w-full" asChild>
            <Link to="/orders">View Orders</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersCard;
