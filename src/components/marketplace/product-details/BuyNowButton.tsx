
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import SignUpDialog from "../SignUpDialog";

interface BuyNowButtonProps {
  productId: string;
  productName: string;
  price: number;
  productImage?: string;
  className?: string;
}

const BuyNowButton = ({ 
  productId, 
  productName, 
  price, 
  productImage,
  className = "" 
}: BuyNowButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);

  const handleBuyNow = () => {
    if (!user) {
      setShowSignUpDialog(true);
      return;
    }
    
    // If authenticated, proceed to checkout
    navigate("/checkout", { 
      state: { 
        product: { 
          id: productId, 
          name: productName, 
          price, 
          image: productImage 
        } 
      } 
    });
  };

  return (
    <>
      <Button 
        onClick={handleBuyNow}
        className={`bg-primary hover:bg-primary/90 text-primary-foreground ${className}`}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Buy Now
      </Button>

      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </>
  );
};

export default BuyNowButton;
