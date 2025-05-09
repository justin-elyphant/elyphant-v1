
import React, { useState, useEffect } from "react";
import { Product } from "@/contexts/ProductContext";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useIsMobile } from "@/hooks/use-mobile";
import ProductItem from "./product-item/ProductItem";
import ProductDetailsDialog from "./product-details/ProductDetailsDialog";
import SignUpDialog from "./SignUpDialog";
import { sortProducts } from "./hooks/utils/categoryUtils";

interface ProductGridProps {
  products: Product[];
  viewMode: "grid" | "list";
  sortOption?: string;
  onProductView?: (productId: string) => void;
}

const ProductGrid = ({ 
  products, 
  viewMode, 
  sortOption = "relevance",
  onProductView 
}: ProductGridProps) => {
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null> (null);
  const [dlgOpen, setDlgOpen] = useState<boolean>(false);
  const [sortedProducts, setSortedProducts] = useState<Product[]>(products);
  const [userData] = useLocalStorage("userData", null);
  const { handleFavoriteToggle, isFavorited } = useFavorites();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const isMobile = useIsMobile();

  // Update sorted products when products or sort option changes
  useEffect(() => {
    setSortedProducts(sortProducts(products, sortOption));
  }, [products, sortOption]);

  const handleWishlistClick = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!userData) {
      setShowSignUpDialog(true);
    } else {
      handleFavoriteToggle(productId);
    }
  };
  
  const handleProductClick = (productId: string) => {
    setSelectedProduct(productId);
    setDlgOpen(true);
    
    // Find the product and add to recently viewed
    const product = products.find(p => p.product_id === productId);
    if (product) {
      addToRecentlyViewed({
        id: product.product_id,
        name: product.title || product.name || "",
        image: product.image,
        price: product.price
      });
    }
    
    // Track product view if callback provided
    if (onProductView) {
      onProductView(productId);
    }
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
        ? 'grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6' 
        : 'space-y-4'}`}
      >
        {sortedProducts.map((product) => (
          <ProductItem 
            key={product.product_id}
            product={product}
            viewMode={viewMode}
            onProductClick={handleProductClick}
            onWishlistClick={(e) => handleWishlistClick(e, product.product_id)}
            isFavorited={userData ? isFavorited(product.product_id) : false}
          />
        ))}
      </div>

      <ProductDetailsDialog 
        productId={selectedProduct}
        open={dlgOpen}
        onOpenChange={setDlgOpen}
        userData={userData}
      />

      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </>
  );
};

export default ProductGrid;
