import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Star } from "lucide-react";
import { getProductDetail } from "@/api/product";
import { productCatalogService } from "@/services/ProductCatalogService";

interface MobileOrderItemCardProps {
  item: any;
  orderStatus: string;
  onReorder?: (item: any) => void;
}

const MobileOrderItemCard = ({ 
  item, 
  orderStatus, 
  onReorder
}: MobileOrderItemCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  
  const rawProductName = (item as any).product_name || item.name || "Product";
  // Clean up product name by removing redundant quantity indicators
  const productName = rawProductName.replace(/,?\s*\d+\s*(EA|ea|each|pack|ct|count|piece|pc|pcs|unit|units)\.?$/i, '').trim();
  const brand = (item as any).brand;
  const unitPrice = (item as any).unit_price || item.price || 0;
  const quantity = Number((item as any).quantity ?? (item as any).qty ?? 1);
  const totalPrice = unitPrice * quantity;
  
  // Helper to detect placeholder/mock images
  const isPlaceholder = (url?: string) => {
    if (!url) return true;
    return /placeholder\.svg|unsplash|dummy|default|no-image/i.test(String(url));
  };
  
  // Determine initial image source from various possible fields
  const initialImageUrl = (item as any).product_image || 
                 (item as any).image_url || 
                 (item as any).image || 
                 (item as any).images?.[0] ||
                 (item as any).product?.image ||
                 (item as any).product?.images?.[0];
  const [imageSrc, setImageSrc] = useState<string | undefined>(
    isPlaceholder(initialImageUrl) ? undefined : initialImageUrl
  );

  // Try to resolve a real image from Zinc detail or search
  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      const badInitial = !imageSrc || /unsplash|placeholder|dummy|default|no-image/i.test(String(imageSrc));
      if (imageSrc && !imageError && !badInitial) return; // already have a real-looking image
      setLoadingImage(true);
      const productId = (item as any).product_id || (item as any).asin || (item as any).sku || (item as any).product?.product_id;
      const retailer = (item as any).retailer || (item as any).product?.retailer || "amazon";
      console.log("[MobileOrderItemCard] resolving image", { productName, productId, initialImageUrl, retailer, item });

      // 1) Product detail via simple helper
      try {
        if (productId) {
          const prod = await getProductDetail(productId, retailer);
          const pImg = (prod as any)?.image || (prod as any)?.images?.[0];
          if (!cancelled && pImg && !isPlaceholder(pImg)) {
            console.log("[MobileOrderItemCard] got image from getProductDetail", pImg);
            setImageSrc(pImg);
            setImageError(false);
            return;
          }
        }
      } catch (e) {
        console.warn("[MobileOrderItemCard] getProductDetail failed", e);
      }

      // 2) Product detail via ProductCatalogService
      try {
        if (productId) {
          const detail = await productCatalogService.getProductDetail(productId);
          const dImg = detail?.main_image || detail?.images?.[0];
          if (!cancelled && dImg && !isPlaceholder(dImg)) {
            console.log("[MobileOrderItemCard] got image from ProductCatalogService", dImg);
            setImageSrc(dImg);
            setImageError(false);
            return;
          }
        }
      } catch (e) {
        console.warn("[MobileOrderItemCard] ProductCatalogService failed", e);
      }

      // 3) Title search
      try {
        const res = await productCatalogService.searchProducts(productName, { limit: 1 });
        const p = res?.products?.[0];
        const sImg = p?.image || p?.main_image || p?.images?.[0];
        if (!cancelled && sImg && !isPlaceholder(sImg)) {
          console.log("[MobileOrderItemCard] got image from title search", sImg);
          setImageSrc(sImg);
          setImageError(false);
          return;
        }
      } catch (e) {
        console.warn("[MobileOrderItemCard] title search failed", e);
      }

      // 4) Brand search (lightweight)
      try {
        const firstWord = String(productName).split(' ')[0];
        if (firstWord && firstWord.length > 2) {
          const res = await productCatalogService.searchProducts(firstWord, { limit: 1 });
          const p = res?.products?.[0];
          const bImg = p?.image || p?.main_image || p?.images?.[0];
          if (!cancelled && bImg) {
            console.log("[MobileOrderItemCard] got image from brand search", bImg);
            setImageSrc(bImg);
            setImageError(false);
            return;
          }
        }
      } catch (e) {
        console.warn("[MobileOrderItemCard] brand search failed", e);
      } finally {
        if (!cancelled) setLoadingImage(false);
      }
    };

    resolve();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productName, (item as any).product_id, imageError, imageSrc]);

  return (
    <Card className="mobile-card-hover">
      <CardContent className="touch-padding">
        <div className="flex gap-4 items-center">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden relative">
{imageSrc && !imageError ? (
                <img 
                  src={imageSrc} 
                  alt={productName}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                />
              ) : (
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                  <span className="text-sm text-primary font-medium">
                    {productName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="space-y-1">
              <h3 className="font-medium text-body-base leading-tight truncate">
                {productName}
              </h3>
              {(item as any).variation_text && (
                <p className="text-xs text-muted-foreground">
                  {(item as any).variation_text}
                </p>
              )}
              {brand && (
                <p className="text-body-sm text-muted-foreground">
                  {brand}
                </p>
              )}
              <div className="flex items-center gap-4 text-body-sm text-muted-foreground">
                <span>Qty: {item.quantity}</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex-shrink-0 text-right self-center">
            <div className="font-medium text-body-base">${totalPrice.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileOrderItemCard;