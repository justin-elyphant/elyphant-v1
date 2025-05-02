
import { SUPABASE_FUNCTIONS } from '@/constants/supabaseFunctions';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ZINC_RETAILER = "amazon";

export const searchProducts = async (searchTerm: string, resultsLimit: string = "20"): Promise<Product[]> => {
  try {
    console.log(`Searching for products with term: "${searchTerm}" using database API key`);

    // Show a loading toast for better user feedback
    const toastId = toast.loading("Searching Amazon products...", {
      description: `Looking for "${searchTerm}"`,
      id: "search-products"
    });

    // Call the Supabase function to search products
    const { data, error } = await supabase.functions.invoke(SUPABASE_FUNCTIONS.SEARCH_PRODUCTS, {
      body: {
        search_term: searchTerm,
        results_limit: resultsLimit,
        retailer: ZINC_RETAILER
      }
    });

    if (error) {
      console.error("Supabase function error:", error);
      toast.error("Search error", { 
        description: "Error connecting to product search API", 
        id: "search-products" 
      });
      
      // For error case, fall back to mock data
      return getMockProductsForSearchTerm(searchTerm, parseInt(resultsLimit));
    }

    if (!data || !data.results) {
      console.warn("No results or malformed data from Supabase function:", data);
      toast.error("No results found", { 
        description: `No products found matching "${searchTerm}"`, 
        id: "search-products" 
      });
      
      // For no results, also fall back to mock data
      return getMockProductsForSearchTerm(searchTerm, parseInt(resultsLimit));
    }

    // Success - show success toast
    toast.success(`Found ${data.results.length} products`, { 
      description: `Results for "${searchTerm}"`,
      id: "search-products" 
    });

    // Map the results to the Product interface
    const products: Product[] = data.results.map((item: any, index: number) => ({
      id: item.product_id || `zinc-${index}`,
      product_id: item.product_id,
      title: item.title,
      name: item.title,
      price: item.price,
      image: item.main_image,
      images: item.images || [item.main_image],
      rating: item.rating,
      reviewCount: item.num_reviews,
      vendor: "Amazon via Zinc",
      category: item.category,
      description: item.description,
      brand: item.brand,
      stars: item.stars,
      num_reviews: item.num_reviews
    }));

    return products;
  } catch (error) {
    console.error("Error invoking Supabase function:", error);
    toast.error("Search error", { 
      description: "Error fetching products. Please try again later.", 
      id: "search-products" 
    });
    
    // For any error, fall back to mock data
    return getMockProductsForSearchTerm(searchTerm, parseInt(resultsLimit));
  }
};

// Improved mock data generation function for fallback
const getMockProductsForSearchTerm = (searchTerm: string, limit: number): Product[] => {
  const term = searchTerm.toLowerCase();
  const categories = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];
  const brands = ['Brand X', 'GoodStuff', 'TechPro', 'EcoStyle', 'LuxLife'];
  
  console.log(`Generating mock data for "${searchTerm}" (real API call failed or returned no results)`);
  
  // Look for brand name in search term
  let matchedBrand = "";
  const knownBrands = ['nike', 'apple', 'samsung', 'adidas', 'sony', 'microsoft'];
  for (const brand of knownBrands) {
    if (term.includes(brand)) {
      matchedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
      break;
    }
  }
  
  return Array.from({ length: Math.min(limit, 20) }, (_, i) => {
    const productBrand = matchedBrand || brands[Math.floor(Math.random() * brands.length)];
    const capitalizedTerm = term.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return {
      id: `mock-${i+1}`,
      product_id: `mock-${i+1}`,
      title: matchedBrand ? 
        `${matchedBrand} ${capitalizedTerm} Model ${i+1}` : 
        `${capitalizedTerm} Product ${i+1} by ${productBrand}`,
      name: matchedBrand ? 
        `${matchedBrand} ${capitalizedTerm} Model ${i+1}` : 
        `${capitalizedTerm} Product ${i+1} by ${productBrand}`,
      price: Math.floor(Math.random() * 500) + 10,
      category: categories[Math.floor(Math.random() * categories.length)],
      image: `https://source.unsplash.com/random/300x300?${encodeURIComponent(term)}&sig=${i}`,
      images: Array(3).fill(0).map((_, idx) => 
        `https://source.unsplash.com/random/300x300?${encodeURIComponent(term)}&sig=${i}${idx}`
      ),
      rating: (Math.random() * 2) + 3,
      reviewCount: Math.floor(Math.random() * 1000),
      vendor: "Amazon via Zinc (Mock)",
      description: `This is a premium ${term} product with amazing features. Perfect for everyday use with high-quality materials and excellent craftsmanship.`,
      brand: productBrand,
      stars: (Math.random() * 2) + 3,
      num_reviews: Math.floor(Math.random() * 1000)
    };
  });
};

// Add this alias for backwards compatibility
export const searchZincProducts = searchProducts;
