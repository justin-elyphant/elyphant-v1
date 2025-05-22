
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";

const Gifting = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If not signed-in, redirect to signup (optional, can remove for public)
  React.useEffect(() => {
    if (!user) navigate("/signup");
  }, [user, navigate]);

  return (
    <MainLayout>
      <div className="container mx-auto py-16 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to Gifting!</h1>
        <p className="text-lg text-gray-700 mb-8">
          This will be your home for the gifting experience. Here, you’ll be able to discover, plan, and send the perfect gifts.
        </p>
        <Button onClick={() => navigate("/marketplace")}>Browse Gift Ideas</Button>
      </div>
    </MainLayout>
  );
};

export default Gifting;

