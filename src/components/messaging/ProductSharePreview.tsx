
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ProductSharePreviewProps {
  productId: number;
  productName: string;
  productImage?: string;
  productPrice?: number;
  productBrand?: string;
  onViewProduct?: () => void;
}

const ProductSharePreview = ({
  productId,
  productName,
  productImage,
  productPrice,
  productBrand,
  onViewProduct
}: ProductSharePreviewProps) => {
  return (
    <Card className="max-w-sm my-2">
      <CardContent className="p-3">
        <div className="flex gap-3">
          {productImage && (
            <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
              <img 
                src={productImage} 
                alt={productName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{productName}</h4>
            {productBrand && (
              <p className="text-xs text-muted-foreground">{productBrand}</p>
            )}
            {productPrice && (
              <p className="text-sm font-semibold text-primary">{formatPrice(productPrice)}</p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-7 text-xs"
              onClick={onViewProduct}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Product
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSharePreview;
