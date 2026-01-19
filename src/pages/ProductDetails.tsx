import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { Product } from "@/types/product";
import { getProductDetail } from "@/api/product";
import { getProductName, getProductImages } from "@/components/marketplace/product-item/productUtils";
import ProductImageGallery from "@/components/marketplace/product-details/ProductImageGallery";
import ProductDetailsSidebar from "@/components/marketplace/product-details/ProductDetailsSidebar";
import ProductDetailsSkeleton from "@/components/marketplace/product-details/ProductDetailsSkeleton";
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
  
  // Show partial data immediately from navigation state
  const [productDetail, setProductDetail] = useState<Product | null>(product);
  const [loading, setLoading] = useState(!product); // Only show loading if no initial data
  const [enhancing, setEnhancing] = useState(false); // Background enhancement in progress
  const [currentImages, setCurrentImages] = useState<string[]>(product ? getProductImages(product) : []);
  const [fetchingVariantImages, setFetchingVariantImages] = useState(false);
  const [displayedProduct, setDisplayedProduct] = useState<Product | null>(null);
  
  // Use product variations hook at parent level
  const {
    hasVariations,
    selectedVariations,
    selectedProductId,
    handleVariationChange,
    getEffectiveProductId,
    getVariationDisplayText,
    isVariationComplete,
    variantPrice
  } = useProductVariations(productDetail);
  
  // Fetch product details on mount
  useEffect(() => {
    if (product) {
      // We have partial data - show it immediately
      const productId = product.product_id || product.id;
      const needsEnhancement = product && (
        (!product.images || product.images.length <= 1) ||
        (!product.all_variants || product.all_variants.length === 0)
      ) && 
        productId && 
        String(productId).trim() !== "";
      
      if (needsEnhancement) {
        // Enhance in background without blocking UI
        setEnhancing(true);
        fetchProductDetail(String(productId), 'amazon', false);
      } else {
        setProductDetail(product);
        setCurrentImages(getProductImages(product));
      }
    } else if (id) {
      // No initial data - show skeleton and fetch
      setLoading(true);
      fetchProductDetail(id, 'amazon', true);
    }
  }, [product, id]);
  
  // Fetch variant images when variant selection changes
  useEffect(() => {
    if (!productDetail || !hasVariations || !selectedProductId) return;
    
    // Don't fetch if selectedProductId is the same as parent product
    const parentProductId = String(productDetail.product_id || productDetail.id);
    if (selectedProductId === parentProductId) {
      setCurrentImages(getProductImages(productDetail));
      setDisplayedProduct(null); // Reset to use base product
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
          
          // FIXED: Zinc Product Detail API returns prices in DOLLARS, not cents
          // The price should be used as-is without conversion
          const variantPrice = variantData.price || productDetail.price || 0;
          
          // Update displayedProduct with variant data (including correct image and price)
          // Set skipCentsDetection to prevent formatPrice from re-converting dollars to cents
          setDisplayedProduct({
            ...productDetail,
            ...variantData,
            product_id: selectedProductId,
            image: variantImages[0] || productDetail.image,
            images: variantImages,
            price: variantPrice, // Use price directly - Zinc Detail API returns dollars
            skipCentsDetection: true, // Prevent cart from re-converting this price
            isZincApiProduct: false // Override to prevent cents conversion in cart
          });
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
  
  const fetchProductDetail = async (productId: string, retailer: string, showLoadingState: boolean) => {
    if (showLoadingState) {
      setLoading(true);
    }
    
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
        // Merge data: use API data but fallback to navigation state for missing fields (like reviews)
        const apiData = data as any;
        const navProduct = product as any;
        const enhancedProduct = {
          ...data,
          product_id: productId,
          isZincApiProduct: false, // FIXED: Zinc Detail API returns dollars, not cents
          skipCentsDetection: true, // Prevent cart from converting price
          retailer: retailer || 'amazon',
          // Preserve review data from navigation state if API doesn't return it
          // This is critical for products where search returns reviews but detail API returns null
          stars: apiData.stars ?? apiData.rating ?? navProduct?.stars ?? navProduct?.rating ?? 0,
          rating: apiData.stars ?? apiData.rating ?? navProduct?.stars ?? navProduct?.rating ?? 0,
          review_count: apiData.review_count ?? apiData.num_reviews ?? navProduct?.review_count ?? navProduct?.num_reviews ?? navProduct?.reviewCount ?? 0,
          reviewCount: apiData.review_count ?? apiData.num_reviews ?? navProduct?.review_count ?? navProduct?.num_reviews ?? navProduct?.reviewCount ?? 0,
          num_reviews: apiData.review_count ?? apiData.num_reviews ?? navProduct?.review_count ?? navProduct?.num_reviews ?? navProduct?.reviewCount ?? 0
        };
        setProductDetail(enhancedProduct);
        setCurrentImages(getProductImages(enhancedProduct));
        
        // Signal marketplace to refresh with updated cache data
        // Store the search term from returnPath so marketplace can re-search with updated cache
        sessionStorage.setItem('marketplace-needs-refresh', 'true');
        const returnPath = location.state?.returnPath || '';
        const searchMatch = returnPath.match(/[?&]search=([^&]*)/);
        if (searchMatch) {
          sessionStorage.setItem('marketplace-refresh-term', decodeURIComponent(searchMatch[1]));
        }
        
        // Store viewed product's rating data for immediate client-side merge
        // This bypasses database read-after-write latency on first "Back to Shop"
        const dataAny = data as any;
        const viewedProductData = {
          product_id: productId,
          stars: dataAny.stars || data.rating || 0,
          review_count: dataAny.review_count || dataAny.num_reviews || data.reviewCount || 0,
          is_cached: true
        };
        sessionStorage.setItem('marketplace-viewed-product', JSON.stringify(viewedProductData));
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
      setEnhancing(false);
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
  
  // Show skeleton only when we have no data at all
  if (loading && !productDetail) {
    return (
      <>
        <UnifiedShopperHeader mode="main" />
        <ProductDetailsSkeleton />
      </>
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
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 lg:pb-8">
        <div className="grid grid-cols-12 gap-8">
          {/* LEFT 60%: Images */}
          <div className="col-span-12 lg:col-span-7">
            <ProductImageGallery 
              images={currentImages.length > 0 ? currentImages : getProductImages(productDetail)}
              productName={getProductName(productDetail)}
              isLoading={fetchingVariantImages || enhancing}
            />
          </div>
          
          {/* RIGHT 40%: Product Details Sidebar */}
          <div className="col-span-12 lg:col-span-5">
          <ProductDetailsSidebar
            product={displayedProduct || productDetail}
            user={user}
            context={context}
            hasVariations={hasVariations}
            selectedVariations={selectedVariations}
            handleVariationChange={handleVariationChange}
            getEffectiveProductId={getEffectiveProductId}
            getVariationDisplayText={getVariationDisplayText}
            isVariationComplete={isVariationComplete}
            variantPrice={variantPrice}
          />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDetailsPage;
