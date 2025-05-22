
import React from "react";
import { Product } from "@/types/product";
import ProductItem from "./product-item/ProductItem";

interface ProductGridDisplayProps {
  products: Product[];
  viewMode: "grid" | "list" | "modern";
  getProductStatus: (product: Product) => { badge: string; color: string } | null;
  handleProductClick: (productId: string) => void;
  toggleWishlist: (
    e: React.MouseEvent<Element, MouseEvent>,
    wishlistData: { id: string; name: string; image?: string; price?: number }
  ) => void;
  isFavorited: (id: string) => boolean;
  isMobile: boolean;
}

const ProductGridDisplay: React.FC<ProductGridDisplayProps> = ({
  products,
  viewMode,
  getProductStatus,
  handleProductClick,
  toggleWishlist,
  isFavorited,
  isMobile,
}) => {
  // Modern view rendering function
  const renderModernView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {products.map((product, index) => {
        const status = getProductStatus(product);
        const isLarge = index % 5 === 0;
        return (
          <div
            key={product.product_id || product.id || ""}
            className={`relative ${isLarge ? "md:col-span-2" : ""} transition-transform hover:scale-[1.01]`}
          >
            <ProductItem
              product={product}
              viewMode={isLarge ? "list" : "grid"}
              onProductClick={handleProductClick}
              onWishlistClick={(e) =>
                toggleWishlist(e, {
                  id: product.product_id || product.id || "",
                  name: product.title || product.name || "",
                  image: product.image,
                  price: product.price,
                })
              }
              isFavorited={isFavorited(product.product_id || product.id || "")}
              statusBadge={status}
            />
          </div>
        );
      })}
    </div>
  );

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">No products found</p>
        <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  if (viewMode === "modern") {
    return renderModernView();
  }
  return (
    <div
      className={
        viewMode === "grid"
          ? isMobile
            ? "grid grid-cols-1 xs:grid-cols-2 gap-3"
            : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
          : "space-y-4"
      }
    >
      {products.map((product) => {
        const status = getProductStatus(product);
        return (
          <ProductItem
            key={product.product_id || product.id || ""}
            product={product}
            viewMode={viewMode}
            onProductClick={handleProductClick}
            onWishlistClick={(e) =>
              toggleWishlist(e, {
                id: product.product_id || product.id || "",
                name: product.title || product.name || "",
                image: product.image,
                price: product.price,
              })
            }
            isFavorited={isFavorited(product.product_id || product.id || "")}
            statusBadge={status}
          />
        );
      })}
    </div>
  );
};

export default ProductGridDisplay;
