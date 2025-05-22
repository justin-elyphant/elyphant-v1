
import React from "react";
import { getPrimaryProductImage } from "@/components/marketplace/product-item/getPrimaryProductImage";

interface ProductCardImageSectionProps {
  product: any;
  productName: string;
}

const ProductCardImageSection: React.FC<ProductCardImageSectionProps> = ({
  product,
  productName,
}) => {
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

  return (
    <img
      src={selectedImg}
      alt={productName}
      className="object-cover w-full h-full transition-transform group-hover:scale-105"
      onError={(e) => {
        console.warn("[ProductCardImageSection] Image failed to load, using placeholder.", { src: selectedImg });
        (e.target as HTMLImageElement).src = "/placeholder.svg";
      }}
      loading="lazy"
    />
  );
};

export default ProductCardImageSection;
