
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import CreateWishlistDialog from "@/components/gifting/wishlist/CreateWishlistDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const CreateWishlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(true); // Open by default since this is the create page

  React.useEffect(() => {
    if (!user) {
      navigate("/sign-in");
    }
  }, [user, navigate]);

  const handleCreateWishlist = async (values: any) => {
    try {
      // TODO: Implement actual wishlist creation logic
      console.log("Creating wishlist with values:", values);
      
      // For now, just show success and navigate back
      toast.success("Wishlist created successfully!");
      navigate("/wishlists");
    } catch (error) {
      console.error("Error creating wishlist:", error);
      toast.error("Failed to create wishlist. Please try again.");
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    navigate("/wishlists");
  };

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Create New Wishlist</h1>
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <p className="text-muted-foreground mb-6">
              Create a new wishlist to organize your favorite items and share them with friends and family.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="mb-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Wishlist
            </Button>
          </div>
        </div>
        
        <CreateWishlistDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleCreateWishlist}
        />
      </div>
    </MainLayout>
  );
};

export default CreateWishlist;
