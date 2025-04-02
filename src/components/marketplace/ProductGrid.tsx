
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Product } from "@/contexts/ProductContext";
import { useCart } from "@/contexts/CartContext";
import { Heart, ShoppingCart, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import WishlistSelectionPopover from "./WishlistSelectionPopover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductGridProps {
  products: Product[];
  viewMode: "grid" | "list";
}

const ProductGrid = ({ products, viewMode }: ProductGridProps) => {
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [userData] = useLocalStorage("userData", null);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userData) {
      setShowSignUpDialog(true);
    }
  };

  const handleSignUp = () => {
    setShowSignUpDialog(false);
    navigate("/sign-up");
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">No products found</p>
        <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <>
      <div className={`${viewMode === 'grid' 
        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' 
        : 'space-y-4'}`}
      >
        {products.map((product, index) => (
          <div key={index} className={`${
            viewMode === 'grid' 
              ? 'group border rounded-md overflow-hidden hover:shadow-md transition-shadow' 
              : 'flex border rounded-md overflow-hidden hover:shadow-md transition-shadow'
          }`}>
            <div className={`${viewMode === 'list' ? 'w-1/3' : 'w-full'} relative`}>
              <img 
                src={product.image || '/placeholder.svg'} 
                alt={product.name} 
                className="w-full h-48 object-cover"
              />
              {userData ? (
                <WishlistSelectionPopover 
                  productId={product.id}
                  productName={product.name}
                  trigger={
                    <Button 
                      size="icon"
                      variant="ghost" 
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full h-8 w-8" 
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  }
                />
              ) : (
                <Button 
                  size="icon"
                  variant="ghost" 
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full h-8 w-8" 
                  onClick={handleWishlistClick}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className={`p-4 ${viewMode === 'list' ? 'w-2/3' : 'w-full'}`}>
              <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
              <div className="text-sm text-muted-foreground mb-2">{product.vendor}</div>
              <div className="font-bold">${product.price?.toFixed(2)}</div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs text-green-600">Free shipping</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showSignUpDialog} onOpenChange={setShowSignUpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              Create Your Wishlist
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Sign up to start saving your favorite products to your wishlist!
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <div className="text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <p className="text-muted-foreground mb-4">
                Save products, share with friends, and get notified about price drops.
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={() => setShowSignUpDialog(false)}>
              Not Now
            </Button>
            <Button onClick={handleSignUp}>
              Sign Up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductGrid;
