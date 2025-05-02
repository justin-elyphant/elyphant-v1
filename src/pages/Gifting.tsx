import React from "react";
import { ProductGallery } from "@/components/gifting/ProductGallery";
import { Product } from "@/types/product";
import { ZincProduct } from "@/components/marketplace/zinc/types";

interface GiftingProps {
  initialProducts?: Product[];
  isGifteeView?: boolean;
  onProductSelect?: (product: ZincProduct) => void;
}

const Gifting: React.FC<GiftingProps> = ({ initialProducts = [], isGifteeView = true, onProductSelect }) => {
  const handleProductSelect = (product: ZincProduct) => {
    console.log("Selected product:", product);
    onProductSelect && onProductSelect(product);
  };

  const convertToZincProduct = (product: Product): ZincProduct => {
    return {
      product_id: product.id || product.product_id || "",
      title: product.name || product.title || "",
      price: product.price || 0,
      image: product.image || "",
      description: product.description || "",
      retailer: "Amazon via Zinc",
      brand: product.brand || "",
      category: product.category || "",
      rating: product.rating || 0,
      review_count: product.reviewCount || 0,
      images: product.images || []
    };
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Gift Ideas</h1>
      <ProductGallery
        initialProducts={initialProducts}
        isGifteeView={isGifteeView}
        onProductSelect={(product) => handleProductSelect(convertToZincProduct(product))}
      />
    </div>
  );
};

export default Gifting;
