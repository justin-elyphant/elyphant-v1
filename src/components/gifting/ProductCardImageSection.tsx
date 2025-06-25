import React from "react";
import { getPrimaryProductImage } from "@/components/marketplace/product-item/getPrimaryProductImage";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileOptimizedImage from "@/components/marketplace/ui/MobileOptimizedImage";

interface ProductCardImageSectionProps {
  product: any;
  productName: string;
  priority?: boolean;
}

const ProductCardImageSection: React.FC<ProductCardImageSectionProps> = ({
  product,
  productName,
  priority = false
}) => {
  const isMobile = useIsMobile();
  
  // Select the best image with full debug log
  const selectedImg = getPrimaryProductImage(product);

  React.useEffect(() => {
    // Log every mount & product change for diagnostics
    console.log("[ProductCardImageSection] Image Debug", {
      title: productName,
      product,
      selectedImg,
      image: product.image,
      images: product.images,
      retailer: product.retailer,
      product_id: product.product_id,
      id: product.id,
      isMockDetect: detectIfMockProduct(product),
    });
  }, [product, productName, selectedImg]);

  function detectIfMockProduct(p: any) {
    return (
      (p.product_id && String(p.product_id).toUpperCase().startsWith("MOCK")) ||
      (typeof p.retailer === "string" && p.retailer.toLowerCase().includes("zinc")) ||
      (p.title && p.title.toLowerCase().includes("mock"))
    );
  }

  const handleImageError = () => {
    console.warn("[ProductCardImageSection] Image failed to load, using placeholder.", { src: selectedImg });
  };

  const handleImageLoad = () => {
    console.log("[ProductCardImageSection] Image loaded successfully:", selectedImg);
  };

  // Use mobile-optimized component for mobile devices
  if (isMobile) {
    return (
      <MobileOptimizedImage
        src={selectedImg}
        alt={productName}
        aspectRatio="square"
        priority={priority}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className="transition-transform group-hover:scale-105"
      />
    );
  }

  // Desktop version (unchanged)
  return (
    <img
      src={selectedImg}
      alt={productName}
      className="object-cover w-full h-full transition-transform group-hover:scale-105"
      onError={(e) => {
        handleImageError();
        (e.target as HTMLImageElement).src = "/placeholder.svg";
      }}
      onLoad={handleImageLoad}
      loading={priority ? "eager" : "lazy"}
    />
  );
};

export default ProductCardImageSection;
