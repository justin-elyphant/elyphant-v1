
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import BackToDashboard from "@/components/shared/BackToDashboard";
import CreateWishlistDialog from "@/components/gifting/wishlist/CreateWishlistDialog";

const CreateWishlist = () => {
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
        <h1 className="text-2xl font-bold mb-6">Create New Wishlist</h1>
        <div className="max-w-2xl mx-auto">
          <CreateWishlistDialog />
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateWishlist;
