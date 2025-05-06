
import React from "react";
import { Product } from "@/contexts/ProductContext";
import ProductRating from "@/components/shared/ProductRating";

interface ProductInfoProps {
  product: Product;
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  // Generate a description if one doesn't exist
  let description = product.description;
  if (!description || description.trim() === "") {
    const productType = product.name.split(' ').slice(1).join(' ');
    const brand = product.name.split(' ')[0];
    description = `The ${brand} ${productType} is a high-quality product designed for performance and reliability. This ${product.category.toLowerCase()} item features premium materials and exceptional craftsmanship for long-lasting use.`;
  }
  
  const features = product.features || [];
  const specifications = product.specifications || {};

  return (
    <div className="flex flex-col space-y-4">
      <div>
        <h3 className="text-2xl font-bold">${product.price.toFixed(2)}</h3>
        <ProductRating rating={product.rating} reviewCount={product.reviewCount} size="lg" />
        <span className="text-green-600 text-sm block mt-2">Free shipping</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {features.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Features</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
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
              {Object.entries(specifications).map(([key, value], idx) => (
                <React.Fragment key={idx}>
                  <span className="text-muted-foreground">{key}:</span>
                  <span>{value}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductInfo;
