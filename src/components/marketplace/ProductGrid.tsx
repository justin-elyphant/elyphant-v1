
import React, { useState, useMemo } from "react";
import { Product } from "@/contexts/ProductContext";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import ProductItem from "./product-item/ProductItem";
import ProductDetailsDialog from "./product-details/ProductDetailsDialog";
import SignUpDialog from "./SignUpDialog";
import { sortProducts } from "./hooks/utils/categoryUtils";

interface ProductGridProps {
  products: Product[];
  viewMode: "grid" | "list";
  sortOption?: string;
}

const ProductGrid = ({ products, viewMode, sortOption = "relevance" }: ProductGridProps) => {
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState<String | null>(null);
  const [sortedProducts, setSortedProducts] = useState<Product[]>(products);
  const [userData] = useLocalStorage("userData", null);
  const { handleFavoriteToggle, isFavorited } = useFavorites();

  React.useEffect(() => {
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
    setShowProductDetails(productId);
  };
  
  const selectedProduct = showProductDetails !== null 
    ? products.find(p => p.product_id === showProductDetails)
    : null;

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
        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6' 
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
        product={selectedProduct}
        open={showProductDetails !== null}
        onOpenChange={(open) => {
          if (!open) setShowProductDetails(null);
        }}
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
