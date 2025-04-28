
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Product } from "@/contexts/ProductContext";
import ProductCarousel from "./ProductCarousel";
import ProductInfo from "./ProductInfo";
import ProductActions from "./ProductActions";
import { useProductImages } from "./useProductImages";

interface ProductDetailsDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: any | null;
}

const ProductDetailsDialog = ({ 
  product, 
  open, 
  onOpenChange,
  userData
}: ProductDetailsDialogProps) => {
  if (!product) return null;

  console.log("ProductDetailsDialog rendering with product:", product);
  
  // Get the product images
  const images = useProductImages(product);
  console.log("Final images to display:", images);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground line-clamp-2">
            {/* {product.description || `High-quality ${product.category} from ${product.vendor}`} */}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="relative overflow-hidden rounded-md">
            <ProductCarousel images={images} productName={product.title} />
          </div>
          
          <div className="flex flex-col space-y-4">
            <ProductInfo product={product} />
            <ProductActions product={product} userData={userData} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
