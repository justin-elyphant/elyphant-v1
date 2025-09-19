import { useState, useEffect, useMemo } from "react";
import { Product } from "@/types/product";

type SelectedVariations = {
  [dimension: string]: string;
};

export const useProductVariations = (product: Product | null) => {
  const [selectedVariations, setSelectedVariations] = useState<SelectedVariations>({});
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Check if product has variations
  const hasVariations = useMemo(() => {
    if (!product) return false;
    
    // Check for variations in the product data
    const hasVariants = Boolean(
      product.all_variants && 
      Array.isArray(product.all_variants) && 
      product.all_variants.length > 0
    );
    
    console.log('[useProductVariations] Variation check:', {
      productId: product.product_id || product.id,
      hasVariants,
      variantCount: product.all_variants?.length || 0,
      rawVariants: product.all_variants,
      variantSpecifics: product.variant_specifics
    });
    
    return hasVariants;
  }, [product]);

  // Initialize selected variations when product changes
  useEffect(() => {
    if (!product) return;

    // Set initial product ID
    setSelectedProductId(product.product_id);

    // Initialize with current product's variant specifications
    if (product.variant_specifics && product.variant_specifics.length > 0) {
      const initial: SelectedVariations = {};
      product.variant_specifics.forEach(spec => {
        initial[spec.dimension] = spec.value;
      });
      setSelectedVariations(initial);
    } else {
      setSelectedVariations({});
    }
  }, [product?.product_id]);

  // Handle variation change
  const handleVariationChange = (newSelections: SelectedVariations, newProductId: string) => {
    setSelectedVariations(newSelections);
    setSelectedProductId(newProductId || product?.product_id || "");
  };

  // Get the effective product ID for cart/order operations
  const getEffectiveProductId = () => {
    return selectedProductId || product?.product_id || "";
  };

  // Get current price (could be enhanced to show variant-specific pricing)
  const getCurrentPrice = () => {
    // For now, return the base product price
    // In future, this could lookup variant-specific pricing
    return product?.price || 0;
  };

  // Check if all required variations are selected
  const isVariationComplete = () => {
    if (!hasVariations || !product?.all_variants) return true;

    // Get all dimensions that need to be selected
    const requiredDimensions = new Set<string>();
    product.all_variants.forEach(variant => {
      variant.variant_specifics.forEach(spec => {
        requiredDimensions.add(spec.dimension);
      });
    });

    // Check if all dimensions have selections
    return Array.from(requiredDimensions).every(dimension => 
      selectedVariations[dimension]
    );
  };

  // Get variation display text for cart/confirmation
  const getVariationDisplayText = () => {
    const variations = Object.entries(selectedVariations);
    if (variations.length === 0) return "";
    
    return variations.map(([dimension, value]) => `${dimension}: ${value}`).join(", ");
  };

  return {
    hasVariations,
    selectedVariations,
    selectedProductId,
    handleVariationChange,
    getEffectiveProductId,
    getCurrentPrice,
    isVariationComplete,
    getVariationDisplayText
  };
};