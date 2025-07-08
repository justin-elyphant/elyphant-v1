
import React from "react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import CheckoutPage from "@/components/marketplace/checkout/CheckoutPage";
import MobileOptimizedCheckout from "@/components/checkout/MobileOptimizedCheckout";

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  
  // Use mobile checkout for phones, desktop for tablets and larger screens
  const shouldUseMobileCheckout = isMobile && !isTablet;

  React.useEffect(() => {
    if (!user) {
      navigate("/sign-in");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!shouldUseMobileCheckout && <Header />}
      <main className="flex-1">
        <CheckoutPage />
      </main>
      {!shouldUseMobileCheckout && <Footer />}
    </div>
  );
};

export default Checkout;
