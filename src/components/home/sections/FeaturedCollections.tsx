
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import ProductImage from "@/components/marketplace/product-item/ProductImage";

type Collection = {
  id: number;
  name: string;
  image: string | null;
  callToAction?: string;
  url?: string;
  category?: string;
};

type CollectionProps = {
  collections: Collection[];
};

const FeaturedCollections = ({ collections = [] }: CollectionProps) => {
  const [loadingCollection, setLoadingCollection] = useState<number | null>(null);

  const handleCollectionClick = (collection: Collection) => {
    // If already loading, don't allow multiple clicks
    if (loadingCollection !== null) {
      return;
    }
    
    // Set loading state
    setLoadingCollection(collection.id);
    console.log(`FeaturedCollections: Collection clicked: ${collection.name}`);
    
    try {
      // Show loading toast
      toast.success(`Exploring ${collection.name} collection...`);
      
      // Add a small delay to ensure the toast is visible
      setTimeout(() => {
        // If the collection has a direct URL, use that
        if (collection.url) {
          window.location.href = collection.url;
        }
        // If it has a category, use that
        else if (collection.category) {
          window.location.href = `/gifting?tab=products&category=${collection.category}`;
        }
        // Otherwise use the name as a search term
        else {
          const searchTerm = collection.name;
          window.location.href = `/gifting?tab=products&search=${encodeURIComponent(searchTerm)}`;
        }
      }, 100);
    } catch (error) {
      console.error(`Error handling collection click for ${collection.name}:`, error);
      setLoadingCollection(null);
      toast.error("Something went wrong. Please try again.");
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
        <a 
          href="/gifting?tab=products" 
          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
        >
          View all collections
        </a>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {collections.map((collection) => (
          <div 
            key={collection.id} 
            onClick={() => handleCollectionClick(collection)}
            className="cursor-pointer"
          >
            <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
              <div className="aspect-video relative">
                <div className="w-full h-full">
                  <ProductImage 
                    product={{
                      name: `${collection.name}`,
                      category: collection.category || collection.name,
                      image: null // Force it to use the mock image
                    }}
                    useMock={true} // Use mock images for these thumbnails
                  />
                </div>
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
