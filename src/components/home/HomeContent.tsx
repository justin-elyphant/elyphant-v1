
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

  // Featured collections with updated high-quality images and proper search terms
  const collections = [
    { 
      id: 1, 
      name: "Birthday Gifts", 
      image: "https://images.unsplash.com/photo-1523293915678-d126868e96f1?w=500&q=80", 
      count: 120,
      searchTerm: "birthday gifts"
    },
    { 
      id: 2, 
      name: "Anniversary", 
      image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=500&q=80", 
      count: 85,
      searchTerm: "anniversary gifts"
    },
    { 
      id: 3, 
      name: "For Her", 
      image: "https://images.unsplash.com/photo-1549989476-69a92fa57c36?w=500&q=80", 
      count: 150,
      searchTerm: "gifts for her"
    },
    { 
      id: 4, 
      name: "For Him", 
      image: "https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?w=500&q=80", 
      count: 145,
      searchTerm: "gifts for him"
    },
  ];

  // Top brands data - using high-quality, recognizable logos
  const topBrands = [
    { id: 1, name: "Nike", logoUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=128&q=80", productCount: 245 },
    { id: 2, name: "Apple", logoUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=128&q=80", productCount: 189 },
    { id: 3, name: "Samsung", logoUrl: "https://images.unsplash.com/photo-1662219708489-57083b9817e7?w=128&q=80", productCount: 167 },
    { id: 4, name: "Sony", logoUrl: "https://images.unsplash.com/photo-1583508805133-64b71bd23141?w=128&q=80", productCount: 142 },
    { id: 5, name: "Adidas", logoUrl: "https://images.unsplash.com/photo-1588484628369-dd7de8548df4?w=128&q=80", productCount: 134 },
    { id: 6, name: "Bose", logoUrl: "https://images.unsplash.com/photo-1626143551763-4da56bf972ef?w=128&q=80", productCount: 98 },
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
