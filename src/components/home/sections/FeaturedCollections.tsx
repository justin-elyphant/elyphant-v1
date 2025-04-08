
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/contexts/ProductContext";

type Collection = {
  id: number;
  name: string;
  image: string;
  callToAction?: string;
  url?: string;
  category?: string;
};

type CollectionProps = {
  collections: Collection[];
};

const FeaturedCollections = ({ collections = [] }: CollectionProps) => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const [loadingCollection, setLoadingCollection] = useState<number | null>(null);

  const handleCollectionClick = (e: React.MouseEvent, collection: Collection) => {
    e.preventDefault(); // Prevent default navigation

    // If the collection has a direct URL, use that
    if (collection.url) {
      // If the URL contains a category, we're good
      if (collection.url.includes('category=')) {
        navigate(collection.url);
        return;
      }
    }
    
    // Extract the category from the collection name
    const category = collection.category || collection.name.split(' ')[0].toLowerCase();
    
    // Set loading state
    setLoadingCollection(collection.id);
    console.log(`FeaturedCollections: Collection clicked: ${collection.name}, category: ${category}`);
    
    try {
      // Check if we have matching products
      const matchingProducts = products.filter(product => {
        const productNameLower = product.name.toLowerCase();
        const productCategoryLower = product.category.toLowerCase();
        const categoryLower = category.toLowerCase();

        return productNameLower.includes(categoryLower) || 
               productCategoryLower.includes(categoryLower) ||
               (product.description && product.description.toLowerCase().includes(categoryLower));
      });
      
      console.log(`Found ${matchingProducts.length} products for collection ${collection.name}`);
      
      if (matchingProducts.length > 5) {
        toast.success(`Found ${matchingProducts.length} items in ${collection.name}`);
      } else {
        toast.info(`Exploring ${collection.name} collection...`);
      }
      
      // Navigate to the gifting page with the appropriate URL params
      const url = `/gifting?tab=products&search=${encodeURIComponent(collection.name)}`;
      navigate(url);
    } catch (error) {
      console.error(`Error handling collection click for ${collection.name}:`, error);
    } finally {
      // Clear loading state after a short delay
      setTimeout(() => {
        setLoadingCollection(null);
      }, 300);
    }
  };

  if (!collections || collections.length === 0) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Featured Collections</h2>
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-md">
          <p className="text-muted-foreground">No collections available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Featured Collections</h2>
        <Link to="/gifting?tab=products" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
          View all collections
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {collections.map((collection) => (
          <div 
            key={collection.id} 
            onClick={(e) => handleCollectionClick(e, collection)}
            className="cursor-pointer"
          >
            <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
              <div className="aspect-video relative">
                <img 
                  src={collection.image} 
                  alt={collection.name}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-start justify-end p-4">
                  <h3 className="text-white font-medium text-lg">{collection.name}</h3>
                  <div className="flex items-center text-white/90 text-sm mt-1 hover:text-white">
                    <span>{loadingCollection === collection.id ? "Loading..." : (collection.callToAction || "Shop now")}</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedCollections;
