
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Product } from "@/contexts/ProductContext";
import { useCart } from "@/contexts/CartContext";
import { Heart, ShoppingCart, AlertCircle, Star, StarHalf } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import WishlistSelectionPopover from "./WishlistSelectionPopover";
import { sortProducts } from "./hooks/utils/categoryUtils";
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
  sortOption?: string;
}

const ProductGrid = ({ products, viewMode, sortOption = "relevance" }: ProductGridProps) => {
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState<number | null>(null);
  const [sortedProducts, setSortedProducts] = useState<Product[]>(products);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [userData] = useLocalStorage("userData", null);

  // Sort products when the sort option or products change
  useEffect(() => {
    setSortedProducts(sortProducts(products, sortOption));
  }, [products, sortOption]);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product);
    
    toast.success(`${product.name} added to cart`);
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
  
  const handleProductClick = (productId: number) => {
    setShowProductDetails(productId);
  };
  
  const selectedProduct = showProductDetails !== null 
    ? products.find(p => p.id === showProductDetails)
    : null;

  // Render star ratings
  const renderRating = (rating?: number, reviewCount?: number) => {
    if (!rating) return null;
    
    // Calculate full and half stars
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-1 mt-1">
        <div className="flex text-yellow-500">
          {[...Array(fullStars)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          ))}
          {hasHalfStar && <StarHalf className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
        </div>
        <span className="text-sm text-muted-foreground">
          {rating.toFixed(1)}
          {reviewCount && ` (${reviewCount})`}
        </span>
      </div>
    );
  };

  if (sortedProducts.length === 0) {
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
        {sortedProducts.map((product, index) => (
          <div 
            key={index} 
            className={`${
              viewMode === 'grid' 
                ? 'group border rounded-md overflow-hidden hover:shadow-md transition-shadow cursor-pointer' 
                : 'flex border rounded-md overflow-hidden hover:shadow-md transition-shadow cursor-pointer'
            }`}
            onClick={() => handleProductClick(product.id)}
          >
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
              {renderRating(product.rating, product.reviewCount)}
              <div className="font-bold mt-1">${product.price?.toFixed(2)}</div>
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

      {/* Product Details Dialog */}
      {selectedProduct && (
        <Dialog open={showProductDetails !== null} onOpenChange={(open) => !open && setShowProductDetails(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedProduct.name}</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="relative overflow-hidden rounded-md">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-auto object-cover"
                />
              </div>
              
              <div className="flex flex-col space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">${selectedProduct.price.toFixed(2)}</h3>
                  {renderRating(selectedProduct.rating, selectedProduct.reviewCount)}
                  <span className="text-green-600 text-sm block mt-2">Free shipping</span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">{selectedProduct.description || "No product description available."}</p>
                </div>
                
                <div className="mt-auto pt-4 flex flex-col space-y-2">
                  <Button 
                    onClick={() => {
                      addToCart(selectedProduct);
                      toast.success("Product added to cart!");
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  
                  {userData && (
                    <Button variant="outline">
                      <Heart className="h-4 w-4 mr-2" />
                      Add to Wishlist
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Sign Up Dialog */}
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
