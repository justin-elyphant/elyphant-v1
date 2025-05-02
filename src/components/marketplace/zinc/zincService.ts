
import { SUPABASE_FUNCTIONS } from '@/constants/supabaseFunctions';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';

const ZINC_RETAILER = "amazon";

export const searchProducts = async (searchTerm: string, resultsLimit: string = "20"): Promise<Product[]> => {
  try {
    console.log(`Searching for products with term: "${searchTerm}" using database API key`);

    const { data, error } = await supabase.functions.invoke(SUPABASE_FUNCTIONS.SEARCH_PRODUCTS, {
      body: {
        search_term: searchTerm,
        results_limit: resultsLimit,
        retailer: ZINC_RETAILER
      }
    });

    if (error) {
      console.error("Supabase function error:", error);
      
      // For error case, fall back to mock data
      return getMockProductsForSearchTerm(searchTerm, parseInt(resultsLimit));
    }

    if (!data || !data.results) {
      console.warn("No results or malformed data from Supabase function:", data);
      
      // For no results, also fall back to mock data
      return getMockProductsForSearchTerm(searchTerm, parseInt(resultsLimit));
    }

    // Map the results to the Product interface
    const products: Product[] = data.results.map((item: any, index: number) => ({
      id: item.product_id || `zinc-${index}`,
      product_id: item.product_id,
      title: item.title,
      name: item.title,
      price: item.price,
      image: item.main_image,
      images: item.images,
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
    
    // For any error, fall back to mock data
    return getMockProductsForSearchTerm(searchTerm, parseInt(resultsLimit));
  }
};

// Add mock data generation function for fallback
const getMockProductsForSearchTerm = (searchTerm: string, limit: number): Product[] => {
  const term = searchTerm.toLowerCase();
  const categories = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];
  const brands = ['Brand X', 'GoodStuff', 'TechPro', 'EcoStyle', 'LuxLife'];
  
  return Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
    id: `mock-${i+1}`,
    product_id: `mock-${i+1}`,
    title: `${term.charAt(0).toUpperCase() + term.slice(1)} Product ${i+1}`,
    name: `${term.charAt(0).toUpperCase() + term.slice(1)} Product ${i+1}`,
    price: Math.floor(Math.random() * 500) + 10,
    category: categories[Math.floor(Math.random() * categories.length)],
    image: `https://source.unsplash.com/random/300x300?${encodeURIComponent(term)}&sig=${i}`,
    images: [`https://source.unsplash.com/random/300x300?${encodeURIComponent(term)}&sig=${i}`],
    rating: (Math.random() * 2) + 3,
    reviewCount: Math.floor(Math.random() * 1000),
    vendor: "Amazon via Zinc (Mock)",
    description: `This is a great ${term} product with amazing features. Perfect for everyday use.`,
    brand: brands[Math.floor(Math.random() * brands.length)],
    stars: (Math.random() * 2) + 3,
    num_reviews: Math.floor(Math.random() * 1000)
  }));
};

// Add this alias for backwards compatibility
export const searchZincProducts = searchProducts;
