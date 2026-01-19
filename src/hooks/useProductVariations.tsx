import { useState, useEffect, useMemo, useCallback } from "react";
import { Product } from "@/types/product";
import { getProductDetail } from "@/api/product";

type SelectedVariations = {
  [dimension: string]: string;
};

export const useProductVariations = (product: Product | null) => {
  const [selectedVariations, setSelectedVariations] = useState<SelectedVariations>({});
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [variantPrice, setVariantPrice] = useState<number | null>(null);
  const [variantImages, setVariantImages] = useState<string[] | null>(null);
  const [isLoadingVariant, setIsLoadingVariant] = useState(false);

  // Check if product has variations
  const hasVariations = useMemo(() => {
    if (!product) {
      console.log('[useProductVariations] No product provided');
      return false;
    }
    
    // Enhanced debugging for variation detection
    console.log('[useProductVariations] Product data received:', {
      productId: product.product_id || product.id,
      title: product.title || product.name,
      hasAllVariants: Boolean(product.all_variants),
      allVariantsType: typeof product.all_variants,
      allVariantsLength: Array.isArray(product.all_variants) ? product.all_variants.length : 'Not array',
      allVariantsData: product.all_variants,
      hasVariantSpecifics: Boolean(product.variant_specifics),
      variantSpecifics: product.variant_specifics,
      fullProduct: product
    });
    
    // Check for variations in the product data
    const hasVariants = Boolean(
      product.all_variants && 
      Array.isArray(product.all_variants) && 
      product.all_variants.length > 0
    );
    
    console.log('[useProductVariations] Final variation result:', {
      hasVariants,
      willShowSelector: hasVariants
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

  // Handle variation change - now triggers variant data fetch
  const handleVariationChange = useCallback((newSelections: SelectedVariations, newProductId: string) => {
    setSelectedVariations(newSelections);
    setSelectedProductId(newProductId || product?.product_id || "");
  }, [product?.product_id]);

  // Fetch variant-specific data (images, price) when variant changes
  useEffect(() => {
    const fetchVariantData = async () => {
      // Only fetch if we have a different variant selected
      if (!selectedProductId || selectedProductId === product?.product_id) {
        // Reset to base product data
        setVariantPrice(null);
        setVariantImages(null);
        return;
      }

      setIsLoadingVariant(true);
      try {
        console.log('[useProductVariations] Fetching variant data for:', selectedProductId);
        const variantDetail = await getProductDetail(selectedProductId, 'amazon');
        
        if (variantDetail) {
          // Update variant-specific price if available
          if (variantDetail.price) {
            console.log('[useProductVariations] Variant price:', variantDetail.price);
            setVariantPrice(variantDetail.price);
          }
          
          // Update variant-specific images if available
          if (variantDetail.images && variantDetail.images.length > 0) {
            console.log('[useProductVariations] Variant images:', variantDetail.images.length);
            setVariantImages(variantDetail.images);
          }
        }
      } catch (error) {
        console.error('[useProductVariations] Error fetching variant data:', error);
        // Keep using base product data on error
      } finally {
        setIsLoadingVariant(false);
      }
    };

    if (hasVariations && selectedProductId) {
      fetchVariantData();
    }
  }, [selectedProductId, product?.product_id, hasVariations]);

  // Get the effective product ID for cart/order operations
  const getEffectiveProductId = useCallback(() => {
    return selectedProductId || product?.product_id || "";
  }, [selectedProductId, product?.product_id]);

  // Check if all required variations are selected
  const isVariationComplete = useCallback(() => {
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
  }, [hasVariations, product?.all_variants, selectedVariations]);

  // Get variation display text for cart/confirmation
  const getVariationDisplayText = useCallback(() => {
    const variations = Object.entries(selectedVariations);
    if (variations.length === 0) return "";
    
    return variations.map(([dimension, value]) => `${dimension}: ${value}`).join(", ");
  }, [selectedVariations]);

  // Get current price - now supports variant-specific pricing
  const getCurrentPrice = useCallback(() => {
    return variantPrice || product?.price || 0;
  }, [variantPrice, product?.price]);

  // Get current images - supports variant-specific images
  const getCurrentImages = useCallback(() => {
    return variantImages;
  }, [variantImages]);

  return {
    hasVariations,
    selectedVariations,
    selectedProductId,
    handleVariationChange,
    getEffectiveProductId,
    getCurrentPrice,
    getCurrentImages,
    variantPrice,
    variantImages,
    isLoadingVariant,
    isVariationComplete,
    getVariationDisplayText
  };
};