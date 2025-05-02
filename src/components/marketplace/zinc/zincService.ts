import { SUPABASE_FUNCTIONS } from '@/constants/supabaseFunctions';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';

const ZINC_RETAILER = "amazon";

export const searchProducts = async (searchTerm: string, resultsLimit: string = "20"): Promise<Product[]> => {
  try {
    const { data, error } = await supabase.functions.invoke(SUPABASE_FUNCTIONS.SEARCH_PRODUCTS, {
      body: {
        search_term: searchTerm,
        results_limit: resultsLimit,
        retailer: ZINC_RETAILER
      }
    });

    if (error) {
      console.error("Supabase function error:", error);
      return [];
    }

    if (!data || !data.results) {
      console.warn("No results or malformed data from Supabase function:", data);
      return [];
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
    return [];
  }
};
