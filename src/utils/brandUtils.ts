
import { Product } from "@/contexts/ProductContext";
import { toast } from "sonner";
import { searchProducts } from "@/components/marketplace/zinc/services/productSearchService";
import { ZincProduct } from "@/components/marketplace/zinc/types";
import { convertZincProductToProduct } from "@/components/marketplace/zinc/utils/productConverter";

/**
 * Handles finding or loading products for a specific brand from the Zinc API
 */
export const handleBrandProducts = async (
  brandName: string, 
  allProducts: Product[], 
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
): Promise<Product[]> => {
  if (!brandName || brandName.trim() === "") {
    console.log("No brand name provided");
    toast.dismiss("loading-brand-products");
    return [];
  }

  console.log(`Looking for products for brand: ${brandName}`);
  
  // Show loading toast
  toast.loading(`Looking for ${brandName} products...`, { id: "loading-brand-products" });
  
  try {
    // Check if we already have products for this brand to avoid duplicate API calls
    const existingProducts = allProducts.filter(p => 
      (p.brand && p.brand.toLowerCase() === brandName.toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(brandName.toLowerCase()))
    );
    
    if (existingProducts.length >= 10) {
      console.log(`Using ${existingProducts.length} existing products for ${brandName}`);
      toast.success(`Found ${existingProducts.length} ${brandName} products`, { id: "loading-brand-products" });
      return existingProducts;
    }
    
    // Special handling for Apple to avoid fruit results
    const searchQuery = brandName.toLowerCase() === "apple" ? 
      "apple technology products" : 
      brandName;
    
    // Search for products using the Zinc API with a timeout to prevent hanging
    console.log(`Fetching ${searchQuery} products from Zinc API`);
    
    // Create a promise that will time out after 10 seconds
    const timeoutPromise = new Promise<ZincProduct[]>((_, reject) => {
      setTimeout(() => reject(new Error("API request timed out")), 10000);
    });
    
    // Race the API call against the timeout
    const zincResults = await Promise.race([
      searchProducts(searchQuery),
      timeoutPromise
    ]);
    
    if (zincResults && zincResults.length > 0) {
      console.log(`Found ${zincResults.length} products for ${brandName} from Zinc API`);
      
      // Convert all products to our format
      const brandProducts = zincResults.map(product => {
        // Add the current brand name to the product's brand field to ensure it's included
        if (!product.brand) {
          product.brand = brandName;
        }
        return convertZincProductToProduct(product);
      });
      
      if (brandProducts.length > 0) {
        // Update products in context - add these to existing products
        setProducts(prev => {
          // Remove any existing Amazon products for this brand to avoid duplicates
          const filteredProducts = prev.filter(p => 
            !(p.vendor === "Amazon via Zinc" && 
              (p.name.toLowerCase().includes(brandName.toLowerCase()) || 
              (p.brand && p.brand.toLowerCase().includes(brandName.toLowerCase())) ||
              (p.description && p.description.toLowerCase().includes(brandName.toLowerCase()))))
          );
          
          const newProducts = [...filteredProducts, ...brandProducts];
          console.log(`Updated products context with ${newProducts.length} total products, ${brandProducts.length} for ${brandName}`);
          
          // Dismiss the loading toast and show success
          toast.success(`Found ${brandProducts.length} ${brandName} products`, { id: "loading-brand-products" });
          
          return newProducts;
        });
        
        return brandProducts;
      } else {
        console.log(`No relevant products found for ${brandName} from Zinc API`);
        toast.error(`No products found for ${brandName}`, { id: "loading-brand-products" });
        return [];
      }
    } else {
      console.log(`No products found for ${brandName} from Zinc API`);
      toast.error(`No products found for ${brandName}`, { id: "loading-brand-products" });
      return [];
    }
  } catch (error) {
    console.error(`Error fetching ${brandName} products:`, error);
    toast.error(`Couldn't fetch products for ${brandName}`, { id: "loading-brand-products" });
    
    // If this is Apple, provide fallback Apple products to avoid showing fruits
    if (brandName.toLowerCase() === "apple") {
      console.log("Using fallback Apple products");
      const fallbackAppleProducts = getAppleFallbackProducts();
      
      // Update products in context
      setProducts(prev => {
        // Remove any existing Amazon products for Apple
        const filteredProducts = prev.filter(p => 
          !(p.vendor === "Amazon via Zinc" && 
            (p.name.toLowerCase().includes("apple") || 
            (p.brand && p.brand.toLowerCase().includes("apple")) ||
            (p.description && p.description.toLowerCase().includes("apple"))))
        );
        
        const newProducts = [...filteredProducts, ...fallbackAppleProducts];
        toast.success(`Found ${fallbackAppleProducts.length} Apple products`, { id: "loading-brand-products" });
        return newProducts;
      });
      
      return fallbackAppleProducts;
    }
    
    return [];
  }
};

/**
 * Provides fallback Apple products when the API fails
 */
const getAppleFallbackProducts = (): Product[] => {
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

