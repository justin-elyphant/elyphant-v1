
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import MyWishlists from "@/components/gifting/MyWishlists";
import BackToDashboard from "@/components/shared/BackToDashboard";

const MyWishlistsPage = () => {
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
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <BackToDashboard />
        <h1 className="text-2xl font-bold mb-6">My Wishlists</h1>
        <MyWishlists />
      </div>
    </MainLayout>
  );
};

export default MyWishlistsPage;
