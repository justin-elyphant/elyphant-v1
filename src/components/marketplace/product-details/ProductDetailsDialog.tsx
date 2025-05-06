
import React, {useEffect, useState} from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProductCarousel from "./ProductCarousel";
import ProductInfo from "./ProductInfo";
import ProductActions from "./ProductActions";
import { getProductDetail } from "@/api/product";
import { Spinner } from '@/components/ui/spinner';
import { normalizeProduct, Product } from "@/contexts/ProductContext";
import { getProductName } from "../product-item/productUtils";

interface ProductDetailsDialogProps {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: any | null;
}

const ProductDetailsDialog = ({ 
  productId, 
  open, 
  onOpenChange,
  userData
}: ProductDetailsDialogProps) => {
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (productId && open) {
      fetchProductDetail(productId, 'amazon');
    }
  }, [productId, open]);

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
          <DialogDescription className="text-sm text-muted-foreground line-clamp-2">
            {!loading && productDetail?.description && productDetail.description}
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
                    images={productDetail.images || [productDetail.image]} 
                    productName={getProductName(productDetail)} 
                  />
                </div>
                
                <div className="flex flex-col space-y-4">
                  <ProductInfo product={productDetail} />
                  <ProductActions product={productDetail} userData={userData} />
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
