
import { Product } from "@/types/product";

// Interface for marketplace data providers
export interface MarketplaceProvider {
  searchProducts: (query: string, options?: any) => Promise<Product[]>;
  getProductById: (id: string) => Promise<Product | null>;
  getProductRecommendations: (productId: string) => Promise<Product[]>;
}

// Mock data provider - used for development and testing
class MockMarketplaceProvider implements MarketplaceProvider {
  private mockProducts: Product[] = [
    {
      id: "1",
      title: "Premium Wireless Headphones",
      description: "High-quality sound with noise cancellation",
      price: 199.99,
      brand: "SoundMaster",
      category: "Electronics",
      image: "https://placehold.co/400x300?text=Headphones",
      rating: { rate: 4.8, count: 120 }
    },
    {
      id: "2",
      title: "Stainless Steel Water Bottle",
      description: "Keeps drinks cold for 24 hours, hot for 12",
      price: 35.00,
      brand: "HydroMate",
      category: "Home & Kitchen",
      image: "https://placehold.co/400x300?text=Water+Bottle",
      rating: { rate: 4.5, count: 89 }
    },
    {
      id: "3",
      title: "Smart Fitness Watch",
      description: "Track your activity, sleep and heart rate",
      price: 149.99,
      brand: "FitTech",
      category: "Electronics",
      image: "https://placehold.co/400x300?text=Fitness+Watch",
      rating: { rate: 4.2, count: 75 }
    },
    {
      id: "4",
      title: "Organic Cotton T-Shirt",
      description: "Soft and sustainable casual wear",
      price: 24.99,
      brand: "EcoStyle",
      category: "Clothing",
      image: "https://placehold.co/400x300?text=T-Shirt",
      rating: { rate: 4.0, count: 63 }
    },
    {
      id: "5",
      title: "Ceramic Pour-Over Coffee Maker",
      description: "For the perfect hand-brewed coffee",
      price: 42.50,
      brand: "BrewMaster",
      category: "Home & Kitchen",
      image: "https://placehold.co/400x300?text=Coffee+Maker",
      rating: { rate: 4.7, count: 54 }
    }
  ];
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async searchProducts(query: string, options?: any): Promise<Product[]> {
    console.log("Mock provider searching for products with query:", query, "options:", options);
    await this.delay(800); // Simulate API delay
    
    if (!query) {
      return this.mockProducts;
    }
    
    const normalizedQuery = query.toLowerCase();
    return this.mockProducts.filter(product => 
      product.title.toLowerCase().includes(normalizedQuery) || 
      product.description.toLowerCase().includes(normalizedQuery) ||
      product.brand.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery)
    );
  }
  
  async getProductById(id: string): Promise<Product | null> {
    console.log("Mock provider fetching product by ID:", id);
    await this.delay(500);
    return this.mockProducts.find(p => p.id === id) || null;
  }
  
  async getProductRecommendations(productId: string): Promise<Product[]> {
    console.log("Mock provider getting recommendations for product:", productId);
    await this.delay(1000);
    // Return all products except the one requested
    return this.mockProducts.filter(p => p.id !== productId);
  }
}

// Zinc API provider - will be used in production
class ZincMarketplaceProvider implements MarketplaceProvider {
  private apiKey: string | null = null;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }
  
  setApiKey(key: string) {
    this.apiKey = key;
  }
  
  private async callZincApi(endpoint: string, params: any): Promise<any> {
    if (!this.apiKey) {
      console.error("Zinc API key not set");
      return null;
    }
    
    // This is a placeholder for the actual Zinc API call
    // Will be implemented when ready to integrate with Zinc API
    console.warn("Zinc API integration not implemented yet, using mock data");
    
    // Fall back to mock data for now
    const mockProvider = new MockMarketplaceProvider();
    if (endpoint === "search") {
      return mockProvider.searchProducts(params.query, params.options);
    } else if (endpoint === "product") {
      return mockProvider.getProductById(params.id);
    } else if (endpoint === "recommendations") {
      return mockProvider.getProductRecommendations(params.productId);
    }
    
    return null;
  }
  
  async searchProducts(query: string, options?: any): Promise<Product[]> {
    return this.callZincApi("search", { query, options });
  }
  
  async getProductById(id: string): Promise<Product | null> {
    return this.callZincApi("product", { id });
  }
  
  async getProductRecommendations(productId: string): Promise<Product[]> {
    return this.callZincApi("recommendations", { productId });
  }
}

// Create and export a singleton instance of the marketplace provider
// We'll start with the mock provider and can switch to Zinc later
const marketplaceProvider: MarketplaceProvider = new MockMarketplaceProvider();

// Helper function to switch to Zinc API when ready
export function enableZincApi(apiKey: string) {
  const zincProvider = new ZincMarketplaceProvider(apiKey);
  // Replace the instance with Zinc provider
  // This will require some refactoring when implemented
}

export default marketplaceProvider;
