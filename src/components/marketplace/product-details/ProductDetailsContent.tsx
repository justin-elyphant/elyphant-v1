import React, { useState } from "react";
import { Product } from "@/types/product";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";

interface ProductDetailsContentProps {
  product: Product;
}

const ProductDetailsContent: React.FC<ProductDetailsContentProps> = ({ product }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = product.product_description || product.description || "";
  const features = product.feature_bullets || product.product_details || [];
  
  // PHASE 5: Sanitize HTML description with DOMPurify
  const sanitizedDescription = description ? DOMPurify.sanitize(description) : "";
  const shouldTruncate = description.length > 300;
  const displayDescription = (!isExpanded && shouldTruncate) 
    ? sanitizedDescription.substring(0, 300) + "..." 
    : sanitizedDescription;
  
  return (
    <div className="space-y-4 py-3">
      {description && (
        <div>
          <div 
            className="text-sm text-elyphant-grey-text leading-relaxed"
            dangerouslySetInnerHTML={{ __html: displayDescription }}
          />
          {shouldTruncate && (
            <Button
              variant="link"
              className="px-0 text-xs text-elyphant-black mt-2"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show less" : "Read more"}
            </Button>
          )}
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
