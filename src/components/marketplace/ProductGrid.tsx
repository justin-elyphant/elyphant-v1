import React, { useState } from "react";
import { Product } from "@/contexts/ProductContext";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
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
  const [showProductDetails, setShowProductDetails] = useState<number | null>(null);
  const [sortedProducts, setSortedProducts] = useState<Product[]>(products);
  const [userData] = useLocalStorage("userData", null);

  React.useEffect(() => {
    setSortedProducts(sortProducts(products, sortOption));
  }, [products, sortOption]);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userData) {
      setShowSignUpDialog(true);
    }
  };
  
  const handleProductClick = (productId: number) => {
    console.log("Product clicked:", productId);
    setShowProductDetails(productId);
  };
  
  const selectedProduct = showProductDetails !== null 
    ? products.find(p => p.id === showProductDetails)
    : null;
    
  console.log("Selected product:", selectedProduct);

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
        {sortedProducts.map((product) => (
          <ProductItem 
            key={product.id}
            product={product}
            viewMode={viewMode}
            onProductClick={handleProductClick}
            onWishlistClick={handleWishlistClick}
          />
        ))}
      </div>

      <ProductDetailsDialog 
        product={selectedProduct}
        open={showProductDetails !== null}
        onOpenChange={(open) => {
          console.log("Dialog open state changing to:", open);
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
