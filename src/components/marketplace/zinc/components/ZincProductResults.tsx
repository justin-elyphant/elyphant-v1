
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Truck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMockProducts } from "@/components/marketplace/services/mockProductService";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn, formatPrice } from "@/lib/utils";
import { getOptimizedImageSrc, preloadCriticalImages } from "@/utils/imageOptimization";

interface ZincProductResultsProps {
  products: Product[];
  isLoading: boolean;
  searchTerm: string;
}

export const ZincProductResults = ({
  products,
  isLoading,
  searchTerm
}: ZincProductResultsProps) => {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const isMobile = useIsMobile();
  
  // Force loading state to resolve after 1.5 seconds max
  useEffect(() => {
    let timer: number;
    
    // If loading, reset display products and start timer
    if (isLoading) {
      setShowLoading(true);
      // Always resolve loading state after 1.5 seconds max
      timer = window.setTimeout(() => {
        console.log("Forcing loading state to resolve");
        setShowLoading(false);
      }, 1500);
    } else {
      setShowLoading(false);
    }
    
    // Use the provided products or fallback to mock products
    const finalProducts = products && products.length > 0 ? products : getMockProducts(6);
    setDisplayProducts(finalProducts);
    
    // Preload critical images for better performance
    if (finalProducts.length > 0) {
      const imageUrls = finalProducts.slice(0, 4).map(p => p.image).filter(Boolean);
      preloadCriticalImages(imageUrls);
    }
    
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [isLoading, products]);
    
  if (showLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="overflow-hidden">
            <div className="animate-pulse">
              <div className="h-40 bg-slate-200"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-3"></div>
                <div className="h-6 bg-slate-200 rounded w-1/4 mb-3"></div>
                <div className="h-8 bg-slate-200 rounded w-full"></div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {displayProducts.map((product, index) => (
        <Card key={product.product_id || index} className="overflow-hidden border hover:shadow-md transition-all duration-300">
          <div className="relative">
            {/* Product badge */}
            <Badge className="absolute top-2 left-2 bg-purple-600 text-white">
              Amazon Product
            </Badge>
            
            <div className="h-40 overflow-hidden bg-muted">
              <img 
                src={getOptimizedImageSrc(product.image, {
                  width: 400,
                  height: 320,
                  quality: 85,
                  format: 'webp'
                })} 
                alt={product.title || product.name || ""} 
                className="w-full h-full object-cover transition-opacity duration-300"
                loading={index < 4 ? "eager" : "lazy"}
                onError={(e) => {
                  // Replace broken images with optimized placeholder
                  (e.target as HTMLImageElement).src = getOptimizedImageSrc(
                    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
                    { width: 400, height: 320, quality: 85, format: 'webp' }
                  );
                }}
              />
            </div>
          </div>
          
          <CardContent className={isMobile ? "p-3" : "p-4"}>
            <h3 className="font-medium line-clamp-2 mb-1">
              {(product.title || product.name || "").length > 60 
                ? (product.title || product.name || "").substring(0, 57) + "..."
                : (product.title || product.name || "")}
            </h3>
            
            <div className="flex items-center mt-1 mb-2">
              {product.rating && (
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span 
                      key={i} 
                      className={`text-xs ${i < Math.round(product.rating) ? "text-amber-500" : "text-gray-300"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <p className="font-bold mb-2">{formatPrice(product.price)}</p>
            
            <div className="flex items-center text-xs text-slate-600 mb-3">
              <Truck className="h-3 w-3 mr-1 text-green-600" />
              <span>Free shipping</span>
            </div>
            
            <Button 
              className={cn(
                "w-full bg-purple-600 hover:bg-purple-700 text-white",
                isMobile && "py-2" // Slightly taller button on mobile for better touch target
              )}
              size="sm"
            >
              <Gift className="h-4 w-4 mr-1" />
              Gift This
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
