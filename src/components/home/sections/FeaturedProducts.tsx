
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Product } from "@/contexts/ProductContext";
import { useProducts } from "@/contexts/ProductContext";
import ProductRating from "@/components/shared/ProductRating";
import { searchZincProducts } from "@/components/marketplace/zinc/zincService";
import { Badge } from "@/components/ui/badge";

const FeaturedProductsSection = () => {
  const navigate = useNavigate();
  const { products, setProducts } = useProducts();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      
      try {
        // First check if we already have products loaded in the context
        if (products && products.length > 8) {
          // Filter for products with good images and ratings
          const filtered = products
            .filter(p => p.image && p.image !== "/placeholder.svg")
            .filter(p => p.rating && p.rating >= 4)
            .sort(() => 0.5 - Math.random()) // Randomly sort
            .slice(0, 12); // Take 12 products
          
          if (filtered.length >= 8) {
            setFeaturedProducts(filtered);
            setIsLoading(false);
            return;
          }
        }
        
        // If not enough products in context, load from Zinc API
        const popularSearchTerms = ["gift box", "gift set", "birthday gift", "anniversary gift"];
        const randomTerm = popularSearchTerms[Math.floor(Math.random() * popularSearchTerms.length)];
        
        console.log(`Loading featured products with search term: ${randomTerm}`);
        const newProducts = await searchZincProducts(randomTerm, "12");
        
        if (newProducts && newProducts.length > 0) {
          // Add these to our global product context
          setProducts(prev => {
            // Filter out duplicates
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNewProducts];
          });
          
          setFeaturedProducts(newProducts);
        } else {
          // Fallback to existing products if API call fails
          setFeaturedProducts(products.slice(0, 12));
        }
      } catch (error) {
        console.error("Error loading featured products:", error);
        // Fallback to existing products if available
        setFeaturedProducts(products.slice(0, 12));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProducts();
  }, [products, setProducts]);
  
  const handleProductClick = (productId: number) => {
    navigate(`/marketplace?productId=${productId}`);
  };
  
  if (isLoading) {
    return (
      <div className="py-16 bg-white">
        <div className="container px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Most Gifted Products This Week</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-square bg-slate-200"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-16 bg-white">
      <div className="container px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Most Gifted Products This Week</h2>
        
        <Carousel className="w-full">
          <CarouselContent>
            {featuredProducts.map((product) => (
              <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4">
                <div className="p-1">
                  <Card 
                    className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="aspect-square relative">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="object-cover w-full h-full"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                      {product.isBestSeller && (
                        <Badge className="absolute top-2 right-2 bg-amber-500">Best Seller</Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-1 line-clamp-1">{product.brand || product.vendor}</p>
                      <p className="font-semibold mb-1">${product.price.toFixed(2)}</p>
                      <ProductRating rating={product.rating} reviewCount={product.reviewCount} size="sm" />
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious />
            <CarouselNext />
          </div>
        </Carousel>
      </div>
    </div>
  );
};

export default FeaturedProductsSection;
