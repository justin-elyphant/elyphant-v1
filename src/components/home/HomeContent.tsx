
import React, { useEffect, useState } from "react";
import FeaturedCollections from "./sections/FeaturedCollections";
import FeaturedBrands from "./sections/FeaturedBrands";
import FeaturedProducts from "./sections/FeaturedProducts";
import AutomationFeatures from "./sections/AutomationFeatures";
import HomeCTA from "./sections/HomeCTA";
import { useProducts } from "@/contexts/ProductContext";
import { toast } from "sonner";

const HomeContent = () => {
  // Use the ProductContext instead of directly loading products
  const { products, isLoading } = useProducts();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  
  useEffect(() => {
    console.log("HomeContent: Products from context:", products.length);
    if (products && products.length > 0) {
      // Use shopify products first if available
      const shopifyProducts = products.filter(p => p.vendor === "Shopify");
      if (shopifyProducts.length > 0) {
        console.log("HomeContent: Using Shopify products:", shopifyProducts.length);
        setFeaturedProducts(shopifyProducts.slice(0, 6));
        toast.success(`Showing ${shopifyProducts.length} products from your Shopify store`, {
          id: "shopify-products-loaded"
        });
      } else {
        console.log("HomeContent: Using regular products:", products.length);
        setFeaturedProducts(products.slice(0, 6));
      }
    }
  }, [products]);

  // Featured collections
  const collections = [
    { 
      id: 1, 
      name: "Birthday Gifts", 
      image: "https://images.unsplash.com/photo-1577998474517-7eeeed4e448a?w=500&q=80", 
      count: 120 
    },
    { 
      id: 2, 
      name: "Anniversary", 
      image: "https://images.unsplash.com/photo-1548353866-8befc7a7233e?w=500&q=80", 
      count: 85 
    },
    { 
      id: 3, 
      name: "For Her", 
      image: "https://images.unsplash.com/photo-1588012886078-94edc2c72087?w=500&q=80", 
      count: 150 
    },
    { 
      id: 4, 
      name: "For Him", 
      image: "https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=500&q=80", 
      count: 145 
    },
  ];

  // Top brands data - use real image URLs
  const topBrands = [
    { id: 1, name: "Nike", logoUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=128&q=80", productCount: 245 },
    { id: 2, name: "Apple", logoUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=128&q=80", productCount: 189 },
    { id: 3, name: "Samsung", logoUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=128&q=80", productCount: 167 },
    { id: 4, name: "Sony", logoUrl: "https://images.unsplash.com/photo-1593344484362-83d5fa2a98dd?w=128&q=80", productCount: 142 },
    { id: 5, name: "Adidas", logoUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=128&q=80", productCount: 134 },
    { id: 6, name: "Bose", logoUrl: "https://images.unsplash.com/photo-1610041819557-a370a7dfa3f5?w=128&q=80", productCount: 98 },
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      {/* 1. Gift Collections (Shop by Occasion) */}
      <FeaturedCollections collections={collections} />

      {/* 2. Top Brands */}
      <FeaturedBrands brands={topBrands} />

      {/* 3. Featured Products Carousel */}
      {products.length > 0 && (
        <FeaturedProducts products={featuredProducts} />
      )}

      {/* Key Features */}
      <AutomationFeatures />

      {/* Call to Action */}
      <HomeCTA />
    </div>
  );
};

export default HomeContent;
