
import React from "react";
import { Button } from "@/components/ui/button";
import { Product } from "@/contexts/ProductContext";
import { useCart } from "@/contexts/CartContext";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ProductGridProps {
  products: Product[];
  viewMode: "grid" | "list";
}

const ProductGrid = ({ products, viewMode }: ProductGridProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("Please sign up to create your wishlist", {
      action: {
        label: "Sign Up",
        onClick: () => navigate("/sign-up")
      }
    });
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
            <Button 
              size="icon"
              variant="ghost" 
              className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full h-8 w-8" 
              onClick={handleWishlistClick}
            >
              <Heart className="h-4 w-4" />
            </Button>
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
  );
};

export default ProductGrid;
