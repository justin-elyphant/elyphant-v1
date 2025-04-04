
import { Product } from "@/contexts/ProductContext";

/**
 * Provides fallback Apple products when the API fails
 */
export const getAppleFallbackProducts = (): Product[] => {
  return [
    {
      id: Date.now() + 1,
      name: "Apple iPhone 15 Pro, 256GB, Space Black",
      price: 999.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&h=500&fit=crop",
      vendor: "Amazon via Zinc",
      description: "The latest iPhone with A16 chip, amazing camera system, and all-day battery life.",
      rating: 4.8,
      reviewCount: 1245,
      images: ["https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&h=500&fit=crop"],
      features: ["A16 Bionic chip", "Pro camera system", "Always-On display", "5G capable"],
      specifications: {
        "Storage": "256GB",
        "Display": "6.1-inch Super Retina XDR",
        "Camera": "48MP main camera" 
      },
      isBestSeller: true,
      brand: "Apple"
    },
    {
      id: Date.now() + 2,
      name: "Apple MacBook Air 13.6\" Laptop with M2 chip",
      price: 1199.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop",
      vendor: "Amazon via Zinc",
      description: "The remarkably thin MacBook Air with M2 chip for incredible performance and battery life.",
      rating: 4.9,
      reviewCount: 895,
      images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop"],
      features: ["M2 chip", "Up to 18 hours battery life", "Fanless design", "13.6-inch Liquid Retina display"],
      specifications: {
        "Processor": "Apple M2",
        "Memory": "8GB unified memory",
        "Storage": "256GB SSD"
      },
      isBestSeller: true,
      brand: "Apple"
    },
    {
      id: Date.now() + 3,
      name: "Apple iPad Pro 12.9\" with M2 chip and XDR display",
      price: 1099.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop",
      vendor: "Amazon via Zinc",
      description: "The ultimate iPad experience with the powerful M2 chip and stunning Liquid Retina XDR display.",
      rating: 4.7,
      reviewCount: 732,
      images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop"],
      features: ["M2 chip", "Liquid Retina XDR display", "Thunderbolt port", "Works with Apple Pencil"],
      specifications: {
        "Display": "12.9-inch Liquid Retina XDR",
        "Storage": "256GB",
        "Connectivity": "Wi-Fi 6E"
      },
      isBestSeller: true,
      brand: "Apple"
    },
    {
      id: Date.now() + 4,
      name: "Apple Watch Series 9 GPS + Cellular 45mm",
      price: 499.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop",
      vendor: "Amazon via Zinc",
      description: "Advanced health monitoring and connectivity features in a sleek, durable design.",
      rating: 4.6,
      reviewCount: 526,
      images: ["https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop"],
      features: ["S9 chip", "Always-On Retina display", "Cellular connectivity", "ECG app"],
      specifications: {
        "Case size": "45mm",
        "Water resistance": "50 meters",
        "Battery": "Up to 18 hours"
      },
      isBestSeller: false,
      brand: "Apple"
    }
  ];
};
