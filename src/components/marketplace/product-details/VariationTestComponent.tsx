import React from "react";
import VariationSelector from "./VariationSelector";

// Test component to verify variation selector functionality
const VariationTestComponent = () => {
  // Mock variation data for testing
  const mockVariants = [
    {
      variant_specifics: [
        { dimension: "Size", value: "Small" },
        { dimension: "Color", value: "Red" }
      ],
      product_id: "PROD-S-RED"
    },
    {
      variant_specifics: [
        { dimension: "Size", value: "Medium" },
        { dimension: "Color", value: "Red" }
      ],
      product_id: "PROD-M-RED"
    },
    {
      variant_specifics: [
        { dimension: "Size", value: "Large" },
        { dimension: "Color", value: "Red" }
      ],
      product_id: "PROD-L-RED"
    },
    {
      variant_specifics: [
        { dimension: "Size", value: "Small" },
        { dimension: "Color", value: "Blue" }
      ],
      product_id: "PROD-S-BLUE"
    },
    {
      variant_specifics: [
        { dimension: "Size", value: "Medium" },
        { dimension: "Color", value: "Blue" }
      ],
      product_id: "PROD-M-BLUE"
    }
  ];

  const handleVariationChange = (selectedVariations: any, selectedProductId: string) => {
    console.log("Variation changed:", { selectedVariations, selectedProductId });
  };

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="font-medium mb-4">Variation Selector Test</h3>
      <VariationSelector
        variants={mockVariants}
        currentVariantSpecs={[
          { dimension: "Size", value: "Medium" },
          { dimension: "Color", value: "Red" }
        ]}
        onVariationChange={handleVariationChange}
      />
    </div>
  );
};

export default VariationTestComponent;