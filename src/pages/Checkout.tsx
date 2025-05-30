
import React from "react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import Header from "@/components/home/Header";
import CheckoutPage from "@/components/marketplace/checkout/CheckoutPage";

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
      <CheckoutPage />
    </div>
  );
};

export default Checkout;
