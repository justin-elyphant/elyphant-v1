
import React from "react";
import FeaturedCollections from "./sections/FeaturedCollections";
import FeaturedBrands from "./sections/FeaturedBrands";
import FeaturedProducts from "./sections/FeaturedProducts";
import AutomationFeatures from "./sections/AutomationFeatures";
import HomeCTA from "./sections/HomeCTA";

const HomeContent = () => {
  // Featured products data (would come from API in production)
  const featuredProducts = [
    {
      id: 1,
      name: "Premium Headphones",
      price: 149.99,
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Headphones",
      vendor: "Audio Shop",
    },
    {
      id: 2,
      name: "Smart Watch Series 5",
      price: 299.99,
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Watch",
      vendor: "Tech Store",
    },
    {
      id: 3,
      name: "Wireless Earbuds",
      price: 89.99,
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Earbuds",
      vendor: "Audio Shop",
    },
    {
      id: 4,
      name: "Fitness Tracker",
      price: 79.99,
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Tracker",
      vendor: "Health Gadgets",
    },
  ];

  // Featured collections
  const collections = [
    { 
      id: 1, 
      name: "Birthday Gifts", 
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Birthday", 
      count: 120 
    },
    { 
      id: 2, 
      name: "Anniversary", 
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Anniversary", 
      count: 85 
    },
    { 
      id: 3, 
      name: "For Her", 
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=For+Her", 
      count: 150 
    },
    { 
      id: 4, 
      name: "For Him", 
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=For+Him", 
      count: 145 
    },
  ];

  // Top brands data
  const topBrands = [
    { id: 1, name: "Nike", logoUrl: "/placeholder.svg", productCount: 245 },
    { id: 2, name: "Apple", logoUrl: "/placeholder.svg", productCount: 189 },
    { id: 3, name: "Samsung", logoUrl: "/placeholder.svg", productCount: 167 },
    { id: 4, name: "Sony", logoUrl: "/placeholder.svg", productCount: 142 },
    { id: 5, name: "Adidas", logoUrl: "/placeholder.svg", productCount: 134 },
    { id: 6, name: "Bose", logoUrl: "/placeholder.svg", productCount: 98 },
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      {/* 1. Gift Collections (Shop by Occasion) */}
      <FeaturedCollections collections={collections} />

      {/* 2. Top Brands */}
      <FeaturedBrands brands={topBrands} />

      {/* 3. Featured Products Carousel */}
      <FeaturedProducts products={featuredProducts} />

      {/* Key Features */}
      <AutomationFeatures />

      {/* Call to Action */}
      <HomeCTA />
    </div>
  );
};

export default HomeContent;
