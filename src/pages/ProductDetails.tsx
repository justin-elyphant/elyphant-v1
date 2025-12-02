import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { Product } from "@/types/product";
import { getProductDetail } from "@/api/product";
import { getProductName, getProductImages, standardizeProduct } from "@/components/marketplace/product-item/productUtils";
import ProductImageGallery from "@/components/marketplace/product-details/ProductImageGallery";
import ProductDetailsSidebar from "@/components/marketplace/product-details/ProductDetailsSidebar";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { motion } from "framer-motion";
import UnifiedShopperHeader from "@/components/navigation/UnifiedShopperHeader";
import { useProductVariations } from "@/hooks/useProductVariations";

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get product from navigation state if available
  const product = location.state?.product || null;
  const context = location.state?.context || 'marketplace';
  
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [fetchingVariantImages, setFetchingVariantImages] = useState(false);
  const [displayedProduct, setDisplayedProduct] = useState<Product | null>(null);
  
  // Use product variations hook at parent level
  const {
    hasVariations,
    selectedProductId,
    handleVariationChange,
    getEffectiveProductId,
    getVariationDisplayText,
    isVariationComplete
  } = useProductVariations(productDetail);
  
  // Fetch product details on mount - ALWAYS call to ensure caching
  useEffect(() => {
    // If we have navigation state, show it immediately for instant UI
    if (product) {
      setProductDetail(product);
      setCurrentImages(getProductImages(product));
    }
    
    // ALWAYS call get-product-detail to ensure the product is cached in database
    // This enables smart sorting on marketplace return - the edge function is cache-first efficient
    const productId = product?.product_id || product?.id || id;
    if (productId && String(productId).trim() !== "") {
      fetchProductDetail(String(productId), 'amazon');
    }
  }, [product, id]);
  
  // Fetch variant images when variant selection changes
  useEffect(() => {
    if (!productDetail || !hasVariations || !selectedProductId) return;
    
    // Don't fetch if selectedProductId is the same as parent product
    const parentProductId = String(productDetail.product_id || productDetail.id);
    if (selectedProductId === parentProductId) {
      setCurrentImages(getProductImages(productDetail));
      return;
    }
    
    // Fetch variant product details (cache-first via get-product-detail)
    const fetchVariantImages = async () => {
      setFetchingVariantImages(true);
      try {
        const variantData = await getProductDetail(selectedProductId, 'amazon');
        if (variantData) {
          const variantImages = getProductImages(variantData);
          setCurrentImages(variantImages);
        }
      } catch (error) {
        console.error('Error fetching variant images:', error);
        // Keep showing parent images on error
      } finally {
        setFetchingVariantImages(false);
      }
    };
    
    fetchVariantImages();
  }, [selectedProductId, productDetail, hasVariations]);
  
  const fetchProductDetail = async (productId: string, retailer: string) => {
    setLoading(true);
    try {
      const data = await getProductDetail(productId, retailer);
      if (!data) {
        console.error('Failed to fetch product details for:', productId);
        if (product) {
          setProductDetail(product);
        } else {
          toast.error('Product details not available');
        }
      } else {
        // SINGLE SOURCE OF TRUTH: Merge navigation state with API data, then standardize
        // This preserves ratings from search results if API returns null
        const mergedData = {
          ...product,  // Navigation state first (may have rating data from search)
          ...data,     // API data overrides
          product_id: productId,
          retailer: retailer || 'amazon'
        };
        
        // Use standardizeProduct for consistent field normalization
        const enhancedProduct = standardizeProduct(mergedData);
        
        setProductDetail(enhancedProduct);
        setCurrentImages(getProductImages(enhancedProduct));
        
        // Signal marketplace to refresh with updated cache data
        sessionStorage.setItem('marketplace-needs-refresh', 'true');
        const returnPath = location.state?.returnPath || '';
        const searchMatch = returnPath.match(/[?&]search=([^&]*)/);
        if (searchMatch) {
          sessionStorage.setItem('marketplace-refresh-term', decodeURIComponent(searchMatch[1]));
        }
        
        // Store viewed product's rating data for immediate client-side merge
        sessionStorage.setItem('marketplace-viewed-product', JSON.stringify({
          product_id: productId,
          stars: enhancedProduct.stars || 0,
          review_count: enhancedProduct.reviewCount || enhancedProduct.num_reviews || 0,
          is_cached: true
        }));
      }
    } catch (error) {
      console.error('Error fetching product detail:', error);
      if (product) {
        setProductDetail(product);
      } else {
        toast.error('Unable to load product details');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    const returnPath = location.state?.returnPath;
    if (returnPath) {
      navigate(returnPath);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/marketplace");
    }
  };
  
  if (!id) return null;
  
  // Only show loading spinner when no product data exists at all
  // If we have navigation state, show it immediately while API fetches in background
  if (loading && !productDetail) {
    return (
      <div className="min-h-screen bg-elyphant-grey flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  
  if (!productDetail) {
    return (
      <div className="min-h-screen bg-elyphant-grey flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-elyphant-grey-text mb-4">Product not found</p>
          <Button onClick={handleBack}>
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="min-h-screen bg-elyphant-grey pb-safe"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Unified Header */}
      <UnifiedShopperHeader mode="main" />
      
      {/* Back navigation below header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2 text-elyphant-black hover:text-elyphant-black hover:bg-gray-100 min-h-[44px] marketplace-touch-target"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden md:inline">Back to Shop</span>
            <span className="md:hidden">Back</span>
          </Button>
        </div>
      </div>
      
      {/* 60/40 Split Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* LEFT 60%: Images */}
          <div className="col-span-12 lg:col-span-7">
            <ProductImageGallery 
              images={currentImages.length > 0 ? currentImages : getProductImages(productDetail)}
              productName={getProductName(productDetail)}
              isLoading={fetchingVariantImages}
            />
          </div>
          
          {/* RIGHT 40%: Product Details Sidebar */}
          <div className="col-span-12 lg:col-span-5">
          <ProductDetailsSidebar
            product={displayedProduct || productDetail}
            user={user}
            context={context}
            hasVariations={hasVariations}
            handleVariationChange={handleVariationChange}
            getEffectiveProductId={getEffectiveProductId}
            getVariationDisplayText={getVariationDisplayText}
            isVariationComplete={isVariationComplete}
          />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDetailsPage;
