
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProducts } from "@/contexts/ProductContext";
import { useFavorites } from "@/components/gifting/hooks/useFavorites";
import { Product } from "@/contexts/ProductContext";
import ProductGallery from "@/components/gifting/ProductGallery";
import { Skeleton } from "@/components/ui/skeleton";
import { HeartOff } from "lucide-react";

interface FavoritesTabContentProps {
  isCurrentUser?: boolean; // Make this optional
}

const FavoritesTabContent: React.FC<FavoritesTabContentProps> = ({ isCurrentUser = true }) => {
  const { products, isLoading } = useProducts();
  const { favorites, handleFavoriteToggle } = useFavorites();
  
  // Get all favorited products
  const favoriteProducts = React.useMemo(() => {
    if (!products || !favorites) return [];
    
    return products.filter(product => 
      favorites.includes(String(product.product_id || product.id))
    );
  }, [products, favorites]);
  
  // Group favorited products by category
  const productCategories = React.useMemo(() => {
    if (!favoriteProducts || favoriteProducts.length === 0) return {};
    
    return favoriteProducts.reduce((acc, product) => {
      const category = product.category_name || product.category || 'Other';
      
      if (!acc[category]) {
        acc[category] = [];
      }
      
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [favoriteProducts]);
  
  // Get category names
  const categories = Object.keys(productCategories);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!favoriteProducts || favoriteProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 rounded-full p-4 inline-flex items-center justify-center mb-4">
          <HeartOff size={24} className="text-gray-500" />
        </div>
        <h3 className="text-lg font-medium">No favorites yet</h3>
        <p className="text-muted-foreground mt-1 mb-4">
          Items you favorite will appear here for easy access.
        </p>
      </div>
    );
  }
  
  // If only a few products, don't use tabs
  if (favoriteProducts.length < 5 || categories.length === 1) {
    return (
      <ProductGallery 
        initialProducts={favoriteProducts}
        isGifteeView={true}
        onProductSelect={(product) => {
          // Navigate to product detail or wishlist
          console.log("Selected product:", product);
        }}
      />
    );
  }
  
  return (
    <Tabs defaultValue={categories[0]}>
      <TabsList className="mb-4 overflow-x-auto flex w-full">
        {categories.map(category => (
          <TabsTrigger key={category} value={category} className="flex-shrink-0">
            {category} ({productCategories[category].length})
          </TabsTrigger>
        ))}
      </TabsList>
      
      {categories.map(category => (
        <TabsContent key={category} value={category}>
          <ProductGallery 
            initialProducts={productCategories[category]}
            isGifteeView={true}
            onProductSelect={(product) => {
              // Show product detail or add to wishlist
              console.log("Selected product:", product);
            }}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default FavoritesTabContent;
