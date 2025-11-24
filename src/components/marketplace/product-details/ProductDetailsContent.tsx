import React from "react";
import { Product } from "@/types/product";

interface ProductDetailsContentProps {
  product: Product;
}

const ProductDetailsContent: React.FC<ProductDetailsContentProps> = ({ product }) => {
  const description = product.product_description || product.description || "";
  const features = product.feature_bullets || product.product_details || [];
  
  return (
    <div className="space-y-4 py-3">
      {description && (
        <div>
          <p className="text-sm text-elyphant-grey-text leading-relaxed">
            {description}
          </p>
        </div>
      )}
      
      {features && features.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-elyphant-black mb-2">Features</h4>
          <ul className="space-y-2">
            {features.map((feature: string, index: number) => (
              <li key={index} className="text-sm text-elyphant-grey-text flex items-start">
                <span className="mr-2 text-elyphant-accent">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {product.brand && (
        <div>
          <h4 className="text-sm font-semibold text-elyphant-black mb-1">Brand</h4>
          <p className="text-sm text-elyphant-grey-text">{product.brand}</p>
        </div>
      )}
    </div>
  );
};

export default ProductDetailsContent;
