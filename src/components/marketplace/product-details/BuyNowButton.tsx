
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckoutSession } from "@/integrations/stripe/client";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RecipientInfoDialog from './RecipientInfoDialog';
import { supabase } from "@/integrations/supabase/client";

interface BuyNowButtonProps {
  productId: number;
  productName: string;
  price: number;
  productImage?: string;
  className?: string;
}

const BuyNowButton = ({ productId, productName, price, productImage, className }: BuyNowButtonProps) => {
  const [isPending, setIsPending] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRecipientDialog, setShowRecipientDialog] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<any>(null);
  const [isGiftPurchase, setIsGiftPurchase] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleBuyNow = async () => {
    // Check if user is logged in
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    
    // Ask if this is a gift
    setIsGiftPurchase(true);
  };
  
  const handleBuyForSelf = async () => {
    setIsGiftPurchase(false);
    
    try {
      setIsPending(true);
      
      // Create a checkout session
      const { url } = await createCheckoutSession(
        productId,
        price, 
        productName,
        productImage
      );
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (err) {
      console.error("Error creating checkout:", err);
      toast.error("Failed to process checkout. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const handleBuyAsGift = async () => {
    setIsGiftPurchase(false);
    setShowRecipientDialog(true);
  };

  const handleRecipientInfoSubmit = async (data: any) => {
    setRecipientInfo(data);
    setShowRecipientDialog(false);

    try {
      setIsPending(true);
      
      // Create an augmented checkout session with recipient info
      // In a real implementation, you would pass recipient info to the backend
      const { url } = await createCheckoutSession(
        productId,
        price, 
        productName,
        productImage
      );
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (err) {
      console.error("Error creating checkout:", err);
      toast.error("Failed to process checkout. Please try again.");
    } finally {
      setIsPending(false);
    }
  };
  
  const handleLogin = () => {
    setShowLoginDialog(false);
    navigate("/sign-in");
  };
  
  return (
    <>
      <Button 
        onClick={handleBuyNow} 
        className={className}
        disabled={isPending}
      >
        {isPending ? (
          "Processing..."
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Buy Now
          </>
        )}
      </Button>
      
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              You need to be signed in to purchase this product. Would you like to sign in now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogin}>
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isGiftPurchase} onOpenChange={setIsGiftPurchase}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Is this a gift?</DialogTitle>
            <DialogDescription>
              Let us know if you're buying this for yourself or as a gift for someone else.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleBuyForSelf} className="sm:flex-1">
              Buy for myself
            </Button>
            <Button onClick={handleBuyAsGift} className="sm:flex-1">
              This is a gift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RecipientInfoDialog 
        open={showRecipientDialog}
        onOpenChange={setShowRecipientDialog}
        onSubmit={handleRecipientInfoSubmit}
        productName={productName}
      />
    </>
  );
};

export default BuyNowButton;
