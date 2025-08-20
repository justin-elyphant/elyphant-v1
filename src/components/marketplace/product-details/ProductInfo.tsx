
import React from "react";
import ProductRating from "@/components/shared/ProductRating";
import { formatPrice } from "@/lib/utils";

interface ProductInfoProps {
  product: any;
  source?: 'wishlist' | 'interests' | 'ai' | 'trending';
}

const ProductInfo = ({ product, source }: ProductInfoProps) => {
  // Generate a description if one doesn't exist
  let description = product?.product_description || product?.description || "";
  if ((!description || description.trim() === "") && product?.title) {
    const productType = product.title.split(' ').slice(1).join(' ');
    const brand = product.title.split(' ')[0];
    
    // Enhance description based on source
    if (source === 'ai') {
      description = `AI selected this ${productType} based on your preferences and gift-giving history. This item combines quality with thoughtful design that matches your interests.`;
    } else if (source === 'trending') {
      description = `Currently trending! This ${productType} is popular among users with similar interests. Features premium materials and exceptional craftsmanship for long-lasting use.`;
    } else if (source === 'interests') {
      description = `Recommended based on your interests. This ${productType} aligns with your preferences and offers great value for money.`;
    } else {
      description = `The ${brand} ${productType} is a high-quality product designed for performance and reliability. This item features premium materials and exceptional craftsmanship for long-lasting use.`;
    }
  }
  
  const features = product.product_details || [];
  const specifications = product.variant_specifics || [];

  return (
    <div className="flex flex-col space-y-4">
      <div>
        <h3 className="text-2xl font-bold">
          {formatPrice(product.price, {
            productSource: product.productSource || (product.isZincApiProduct ? 'zinc_api' : 'manual'),
            skipCentsDetection: product.skipCentsDetection || false
          })}
        </h3>
        <ProductRating rating={product.stars} reviewCount={product.review_count} size="lg" />
        <span className="text-green-600 text-sm block mt-2">Free shipping</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-sm text-muted-foreground overflow-y-auto max-h-52">{description}</p>
        </div>

        {features.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Features</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground max-h-44 overflow-y-auto">
              {features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>
        )}
        
        {Object.keys(specifications).length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Specifications</h4>
            <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-2">
              {specifications.map((item, idx) => {
                return (
                  <div key={idx}>
                    {
                      Object.entries(item).map((spec, index) => (
                        <span key={idx * 2 + index} className="mr-1">{spec[1] as string} 
                          {index % 2 == 0 ? ":" : ""}
                        </span>
                      ))
                    }
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductInfo;
