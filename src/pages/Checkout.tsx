
import React from "react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <CheckoutPage />
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
