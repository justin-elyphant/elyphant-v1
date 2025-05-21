
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import ProductImage from "@/components/marketplace/product-item/ProductImage";
import { searchProducts } from "@/components/marketplace/zinc/zincService";
import ProductRating from "@/components/shared/ProductRating";
import { useNavigate } from "react-router-dom";

type Collection = {
  id: number;
  name: string;
  image: string | null;
  callToAction?: string;
  url?: string;
  category?: string;
  searchTerm?: string;
  rating?: number;
  reviewCount?: number;
};

type CollectionProps = {
  collections: Collection[];
};

const FeaturedCollections = ({ collections = [] }: CollectionProps) => {
  const [loadingCollection, setLoadingCollection] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleCollectionClick = async (collection: Collection) => {
    if (loadingCollection !== null) {
      return;
    }
    setLoadingCollection(collection.id);
    toast.success(`Exploring ${collection.name} collection...`);
    const searchTerm = collection.searchTerm || collection.name;

    try {
      if (searchTerm) {
        await searchProducts(searchTerm, "50");
      }
      const params = new URLSearchParams();
      params.set("search", searchTerm);
      params.set("pageTitle", `Collection: ${collection.name}`);
      if (collection.category) {
        params.set("category", collection.category);
      }
      if (collection.url) {
        window.open(collection.url, "_blank");
      } else {
        navigate(`/marketplace?${params.toString()}`);
      }
    } catch (error) {
      const params = new URLSearchParams();
      params.set("search", searchTerm);
      params.set("pageTitle", `Collection: ${collection.name}`);
      navigate(`/marketplace?${params.toString()}`);
    } finally {
      setLoadingCollection(null);
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

  const enhancedCollections = collections.map(collection => ({
    ...collection,
    rating: collection.rating || 4.7 + (Math.random() * 0.3),
    reviewCount: collection.reviewCount || Math.floor(100 + Math.random() * 900)
  }));

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {enhancedCollections.map((collection) => (
          <div 
            key={collection.id}
            onClick={() => handleCollectionClick(collection)}
            className="cursor-pointer h-full"
          >
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow h-[410px] md:h-[480px] lg:h-[520px] p-0 flex">
              {/* Full image as background, gradient & overlayed content */}
              <div className="absolute inset-0 w-full h-full z-0">
                {collection.image ? (
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover object-center"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full">
                    <ProductImage 
                      product={{
                        name: collection.name,
                        category: collection.category || collection.name,
                        image: null
                      }} 
                      useMock={true}
                      className="w-full h-full"
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              </div>
              {/* Overlayed content, fills the card (no white bottom space), always vertically positioned at bottom */}
              <div className="relative z-10 flex flex-col justify-end h-full w-full p-6 pb-7">
                <div className="">
                  <h3 className="text-white font-semibold text-2xl md:text-2xl lg:text-3xl mb-2 drop-shadow-sm">{collection.name}</h3>
                  <ProductRating 
                    rating={collection.rating} 
                    reviewCount={collection.reviewCount ? collection.reviewCount.toString() : undefined} 
                    size="md"
                    className="text-white drop-shadow"
                  />
                </div>
                <div className="flex items-center text-white text-lg mt-3 font-medium hover:text-white/90 transition">
                  <span>
                    {loadingCollection === collection.id ? "Loading..." : (collection.callToAction || "Shop now")}
                  </span>
                  <ArrowRight className="h-5 w-5 ml-2" />
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

