
import React, {useEffect, useState} from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProductCarousel from "./ProductCarousel";
import ProductInfo from "./ProductInfo";
import ProductActions from "./ProductActions";
import { getProductDetail } from "@/api/product";
import { Spinner } from '@/components/ui/spinner';
import { normalizeProduct, Product } from "@/contexts/ProductContext";
import { getProductName, getProductImages } from "../product-item/productUtils";

interface ProductDetailsDialogProps {
  productId?: string | null;
  product?: Product | null; // Direct product object for pre-loaded data
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: any | null;
  source?: 'wishlist' | 'interests' | 'ai' | 'trending'; // Context for display
  onWishlistChange?: () => void;
}

const ProductDetailsDialog = ({ 
  productId, 
  product,
  open, 
  onOpenChange,
  userData,
  source,
  onWishlistChange
}: ProductDetailsDialogProps) => {
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (product) {
      // Check if we have basic product data that needs enhancement
      const needsEnhancement = product && (!product.images || product.images.length <= 1) && product.product_id;
      
      if (needsEnhancement && open) {
        // Auto-fetch full details for products with limited data
        fetchProductDetail(product.product_id, 'amazon');
      } else {
        // Use pre-loaded product data as-is
        setProductDetail(product);
        setLoading(false);
      }
    } else if (productId && open) {
      // Fetch product data if only ID provided
      fetchProductDetail(productId, 'amazon');
    }
  }, [product, productId, open]);

  const fetchProductDetail = async (productId: string, retailer: string) => {
    setLoading(true);
    try {
      const data = await getProductDetail(productId, retailer);
      if(!data) {
        toast.error('Fetch product detail failed.', {duration: 5000});
      } else {
        // Ensure the product data is normalized
        setProductDetail(data);
      }
    } catch (error) {
      console.error('Error fetching product detail:', error);
      toast.error('Error fetching product details', {duration: 5000});
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {loading ? "" : (productDetail ? getProductName(productDetail) : "")}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {source && !loading && (
                <div className="mb-2 text-xs font-medium text-primary">
                  {source === 'ai' && "🤖 AI picked this for you"}
                  {source === 'trending' && "📈 Trending now"}
                  {source === 'interests' && "🎯 Based on your interests"}
                  {source === 'wishlist' && "❤️ From wishlist"}
                </div>
              )}
              {!loading && productDetail?.description && (
                <span>{productDetail.description}</span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        {
          loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            productDetail ?
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="relative overflow-hidden rounded-md">
                  <ProductCarousel 
                    images={getProductImages(productDetail)} 
                    productName={getProductName(productDetail)} 
                  />
                </div>
                
                 <div className="flex flex-col space-y-4">
                   <ProductInfo product={productDetail} source={source} />
                   <ProductActions 
                     product={productDetail} 
                     userData={userData}
                     onWishlistChange={onWishlistChange}
                   />
                 </div>
              </div>
            </>
            :
            <div className="text-center py-8">No Product Data</div>
          )
        }
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
