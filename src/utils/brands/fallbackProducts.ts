
import { Product } from "@/contexts/ProductContext";

/**
 * Get fallback products for Apple to prevent showing fruit results
 * @param count Number of products to return
 * @returns Array of Apple product objects
 */
export const getAppleFallbackProducts = (count: number = 5): Product[] => {
  const appleProducts: Product[] = [
    {
      id: 10001,
      name: "Apple iPhone 14 Pro",
      price: 999,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1663499482621-97a84d6a96c4?auto=format&fit=crop&q=80&w=600",
      vendor: "Apple",
      description: "The latest iPhone with A16 Bionic chip and Dynamic Island",
      rating: 4.8,
      reviewCount: 1245,
      brand: "Apple",
      isBestSeller: true
    },
    {
      id: 10002,
      name: "Apple MacBook Pro 14-inch",
      price: 1999,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1639249227523-85a5dafcd4c7?auto=format&fit=crop&q=80&w=600",
      vendor: "Apple",
      description: "Powerful MacBook Pro with M2 Pro or M2 Max chip",
      rating: 4.9,
      reviewCount: 856,
      brand: "Apple"
    },
    {
      id: 10003,
      name: "Apple iPad Pro 12.9-inch",
      price: 1099,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?auto=format&fit=crop&q=80&w=600",
      vendor: "Apple",
      description: "The ultimate iPad experience with M2 chip",
      rating: 4.7,
      reviewCount: 623,
      brand: "Apple"
    },
    {
      id: 10004,
      name: "Apple Watch Series 8",
      price: 399,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=600",
      vendor: "Apple",
      description: "Advanced health features and a stunning always-on display",
      rating: 4.6,
      reviewCount: 742,
      brand: "Apple"
    },
    {
      id: 10005,
      name: "Apple AirPods Pro",
      price: 249,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?auto=format&fit=crop&q=80&w=600",
      vendor: "Apple",
      description: "Active noise cancellation and immersive sound",
      rating: 4.7,
      reviewCount: 1567,
      brand: "Apple"
    },
    {
      id: 10006,
      name: "Apple iMac 24-inch",
      price: 1299,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1639358336404-b847ac2a5364?auto=format&fit=crop&q=80&w=600",
      vendor: "Apple",
      description: "Stunning 4.5K Retina display and M1 chip",
      rating: 4.8,
      reviewCount: 432,
      brand: "Apple"
    },
    {
      id: 10007,
      name: "Apple HomePod mini",
      price: 99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1614111345870-b29195a5a7e2?auto=format&fit=crop&q=80&w=600",
      vendor: "Apple",
      description: "Rich, full sound and smart home capabilities",
      rating: 4.5,
      reviewCount: 867,
      brand: "Apple"
    },
    {
      id: 10008,
      name: "Apple Magic Keyboard",
      price: 99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1630256791681-864a669fe811?auto=format&fit=crop&q=80&w=600",
      vendor: "Apple",
      description: "Wireless keyboard with a built-in rechargeable battery",
      rating: 4.6,
      reviewCount: 345,
      brand: "Apple"
    }
  ];

  // Return requested number of products or all if count is greater than available
  return appleProducts.slice(0, Math.min(count, appleProducts.length));
};

/**
 * Get fallback products for Nike to ensure consistent quality
 * @param count Number of products to return
 * @returns Array of Nike product objects
 */
export const getNikeFallbackProducts = (count: number = 5): Product[] => {
  const nikeProducts: Product[] = [
    {
      id: 20001,
      name: "Nike Air Force 1",
      price: 110,
      category: "Footwear",
      image: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&q=80&w=600",
      vendor: "Nike",
      description: "Iconic basketball shoes with Air cushioning",
      rating: 4.8,
      reviewCount: 2345,
      brand: "Nike",
      isBestSeller: true
    },
    {
      id: 20002,
      name: "Nike Dri-FIT Running Shirt",
      price: 35,
      category: "Apparel",
      image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=600",
      vendor: "Nike",
      description: "Moisture-wicking fabric keeps you dry and comfortable",
      rating: 4.6,
      reviewCount: 876,
      brand: "Nike"
    },
    {
      id: 20003,
      name: "Nike Air Zoom Pegasus 38",
      price: 120,
      category: "Footwear",
      image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=600",
      vendor: "Nike",
      description: "Responsive cushioning for your daily runs",
      rating: 4.7,
      reviewCount: 1123,
      brand: "Nike"
    }
  ];

  // Return requested number of products or all if count is greater than available
  return nikeProducts.slice(0, Math.min(count, nikeProducts.length));
};
