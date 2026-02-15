
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle, ShoppingCart, ArrowLeft } from "lucide-react";
import UnifiedShopperHeader from "@/components/navigation/UnifiedShopperHeader";
import Footer from "@/components/home/Footer";

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UnifiedShopperHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-4">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-red-600">Payment Cancelled</h1>
            <p className="text-muted-foreground">
              Your payment was cancelled. Don't worry - no charges were made to your account.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Your cart items have been preserved. You can return to checkout anytime to complete your purchase.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/checkout')} 
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Checkout
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/cart')} 
              className="w-full"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Cart
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/marketplace')} 
              className="w-full"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentCancel;
