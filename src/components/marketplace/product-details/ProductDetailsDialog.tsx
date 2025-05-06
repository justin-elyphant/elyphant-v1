import React, {useEffect, useState} from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProductCarousel from "./ProductCarousel";
import ProductInfo from "./ProductInfo";
import ProductActions from "./ProductActions";
import { getProductDetail } from "@/api/product";
import { Spinner } from '@/components/ui/spinner';

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
  const [productDetail, setProductDetail] = useState(null);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    fetchProductDetail(productId, 'amazon');
  }, [productId])

  const fetchProductDetail = async (productId, retailer) => {
    setLoading(true);
    const data = await getProductDetail(productId, retailer);
    if(! data) {
      toast.error('Fetch product detail failed.', {duration: 5000});
    }
    console.log(data);
    setProductDetail(data);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{loading ? "" : (productDetail?.title || "")}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground line-clamp-2">
            {/* {product.description || `High-quality ${product.category} from ${product.vendor}`} */}
          </DialogDescription>
        </DialogHeader>
        {
          loading ? (
            <div>
              <Spinner />
            </div>
          ) : (
            productDetail ?
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="relative overflow-hidden rounded-md">
                  <ProductCarousel images={productDetail.images} productName={productDetail.title} />
                </div>
                
                <div className="flex flex-col space-y-4">
                  <ProductInfo product={productDetail} />
                  <ProductActions product={productDetail} userData={userData} />
                </div>
              </div>
            </>
            :
            <div>No Product Data</div>
          )
        }
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
