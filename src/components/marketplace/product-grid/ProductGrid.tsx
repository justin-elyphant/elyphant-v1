
import React, { memo } from "react";
import { Product } from "@/contexts/ProductContext";
import ProductDetailsDialog from "../product-details/ProductDetailsDialog";
import SignUpDialog from "../SignUpDialog";
import ProductSkeleton from "../ui/ProductSkeleton";
import { useProductDisplay } from "./hooks/useProductDisplay";
import { useProductInteractions } from "./hooks/useProductInteractions";
import GroupedProductSection from "./components/GroupedProductSection";
import StandardProductGrid from "./components/StandardProductGrid";

interface ProductGridProps {
  products: Product[];
  viewMode: "grid" | "list" | "modern";
  sortOption?: string;
  isLoading?: boolean;
  useMock?: boolean;
  onProductView?: (productId: string) => void;
}

const ProductGrid = ({ 
  products, 
  viewMode, 
  sortOption = "relevance",
  isLoading = false,
  useMock = false,
  onProductView
}: ProductGridProps) => {
  const {
    sortedProducts,
    groupedProducts,
  } = useProductDisplay(products, sortOption);

  const {
    selectedProduct,
    dlgOpen,
    showSignUpDialog,
    setDlgOpen,
    setShowSignUpDialog,
    handleWishlistClick,
    handleProductClick,
    handleAddToCart,
    userData,
    renderProductCard
  } = useProductInteractions(products, viewMode, useMock, onProductView);
  
  if (isLoading) {
    return <ProductSkeleton count={12} />;
  }

  console.log("ProductGrid rendering products:", sortedProducts?.length || 0);

  if (!sortedProducts || sortedProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">No products found</p>
        <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  // If we have grouped products (wishlist + preferences), show them separately
  if (groupedProducts.hasGrouping) {
    return (
      <>
        <GroupedProductSection 
          groupedProducts={groupedProducts} 
          viewMode={viewMode} 
          renderProductCard={renderProductCard}
        />
        
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
  }

  // Standard product grid for non-grouped products
  return (
    <>
      <StandardProductGrid 
        products={sortedProducts} 
        viewMode={viewMode} 
        renderProductCard={renderProductCard} 
      />

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

export default memo(ProductGrid);
