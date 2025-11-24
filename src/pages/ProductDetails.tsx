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
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

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
  
  // Fetch product details on mount
  useEffect(() => {
    if (product) {
      // Check if we need to enhance the product data
      const productId = product.product_id || product.id;
      const needsEnhancement = product && 
        (!product.images || product.images.length <= 1) && 
        productId && 
        String(productId).trim() !== "";
      
      if (needsEnhancement) {
        fetchProductDetail(String(productId), 'amazon');
      } else {
        setProductDetail(product);
        setLoading(false);
      }
    } else if (id) {
      fetchProductDetail(id, 'amazon');
    }
  }, [product, id]);
  
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
        const enhancedProduct = {
          ...data,
          product_id: productId,
          isZincApiProduct: true,
          retailer: retailer || 'amazon'
        };
        setProductDetail(enhancedProduct);
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
  
  if (loading) {
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
    <div className="min-h-screen bg-elyphant-grey">
      {/* Back navigation - Desktop & Mobile */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2 text-elyphant-black hover:text-elyphant-black hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
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
              images={getProductImages(productDetail)}
              productName={getProductName(productDetail)}
            />
          </div>
          
          {/* RIGHT 40%: Product Details Sidebar */}
          <div className="col-span-12 lg:col-span-5">
            <ProductDetailsSidebar 
              product={productDetail}
              user={user}
              context={context}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom CTA Bar - iOS-style - Hidden, sidebar handles all CTAs */}
    </div>
  );
};

export default ProductDetailsPage;
