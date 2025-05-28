
import React from "react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import Header from "@/components/home/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft } from "lucide-react";

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      navigate("/sign-in");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/marketplace")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Checkout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Checkout functionality is coming soon!
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Your cart is empty
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
