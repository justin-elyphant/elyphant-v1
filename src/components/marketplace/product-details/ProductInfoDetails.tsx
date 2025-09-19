import React from "react";
import ExpandableDescription from "./ExpandableDescription";
import CollapsibleSection from "./CollapsibleSection";

interface ProductInfoDetailsProps {
  product: any;
  source?: 'wishlist' | 'interests' | 'ai' | 'trending';
}

const ProductInfoDetails = ({ product, source }: ProductInfoDetailsProps) => {
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
    <div className="space-y-3">
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Description</h4>
        <ExpandableDescription description={description} maxLength={150} />
      </div>

      {features.length > 0 && (
        <CollapsibleSection title="Features" className="border rounded-lg">
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
            {features.map((feature, idx) => (
              <li key={idx} className="leading-relaxed">{feature}</li>
            ))}
          </ul>
        </CollapsibleSection>
      )}
      
      {Object.keys(specifications).length > 0 && (
        <CollapsibleSection title="Specifications" className="border rounded-lg">
          <div className="text-sm space-y-2 max-h-40 overflow-y-auto">
            {specifications.map((item, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2 py-1 border-b border-muted last:border-0">
                {Object.entries(item).map(([key, value], index) => (
                  <div key={`${idx}-${index}`} className={index % 2 === 0 ? "font-medium text-muted-foreground" : "text-foreground"}>
                    {index % 2 === 0 ? `${String(value)}:` : String(value)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
};

export default ProductInfoDetails;