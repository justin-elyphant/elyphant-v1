
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import ProductImage from "@/components/marketplace/product-item/ProductImage";
import { searchProducts } from "@/components/marketplace/zinc/zincService";
import { useNavigate } from "react-router-dom";
import { AspectRatio } from "@/components/ui/aspect-ratio";

type Collection = {
  id: number;
  name: string;
  image: string | null;
  callToAction?: string;
  url?: string;
  category?: string;
  searchTerm?: string;
  description?: string;
};

type CollectionProps = {
  collections: Collection[];
};

const LUXURY_GIFTS_IMAGE = "/lovable-uploads/448b42d0-0ea9-433b-8d9b-ca8c143ed3dc.png";
const GIFTS_FOR_HIM_IMAGE = "/lovable-uploads/5bb40cf0-f40c-4629-8a3c-38deaf117a8c.png";

// Default descriptions
const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  "Gifts for Her": "Thoughtful gifts for the special women in your life.",
  "Gifts for Him": "Find the perfect present for him.",
  "Gifts Under $50": "Affordable choices everyone will love.",
  "Luxury Gifts": "Spoil someone with something extra special.",
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

  // Add luxury gift image, gifts for him image & fallback description
  const enhancedCollections = collections.map(collection => {
    let patchedImage = collection.image;
    if (collection.name && collection.name.toLowerCase().includes("luxury gifts")) {
      patchedImage = LUXURY_GIFTS_IMAGE;
    } else if (collection.name && collection.name.toLowerCase().includes("gifts for him")) {
      patchedImage = GIFTS_FOR_HIM_IMAGE;
    }
    const fallbackDescription =
      collection.description || DEFAULT_DESCRIPTIONS[collection.name] || "Discover carefully curated gift ideas.";

    return {
      ...collection,
      image: patchedImage,
      description: fallbackDescription,
    };
  });

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Featured Collections</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {enhancedCollections.map((collection) => (
          <div
            key={collection.id}
            onClick={() => handleCollectionClick(collection)}
            className="cursor-pointer h-full group"
          >
            <Card className="relative overflow-hidden h-full p-0 flex flex-col justify-end bg-transparent border-0 shadow-none">
              <AspectRatio 
                ratio={4 / 5} 
                className="w-full h-full"
              >
                <img
                  src={collection.image ?? undefined}
                  alt={collection.name}
                  className="absolute inset-0 w-full h-full object-cover object-center z-0 transition-all duration-300 
                             group-hover:scale-105"
                  style={{ objectPosition: "center" }}
                  draggable={false}
                  loading="lazy"
                />
                {/* Subtle fade just at the bottom to improve text readability, not darkening the whole image */}
                <div 
                  className="absolute left-0 right-0 bottom-0 h-28 pointer-events-none z-10"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.48) 65%, rgba(0,0,0,0.10) 92%, rgba(0,0,0,0) 100%)"
                  }}
                />
              </AspectRatio>
              {/* Overlay content is positioned absolutely at the bottom, above the low fade */}
              <div className="absolute bottom-0 left-0 w-full z-20 px-6 pb-4 pt-2 flex flex-col"
                   style={{
                     pointerEvents: "none"
                   }}>
                {/* TITLE & DESCRIPTION with good contrast */}
                <h3 className="text-white font-semibold text-lg md:text-xl lg:text-2xl mb-0.5 drop-shadow pointer-events-auto">
                  {collection.name}
                </h3>
                <p className="text-white text-xs md:text-sm mb-2 opacity-95 drop-shadow pointer-events-auto whitespace-pre-line">
                  {collection.description}
                </p>
                <div className="flex items-center justify-end">
                  <div className="flex items-center text-white font-medium ml-auto pointer-events-auto">
                    <span>
                      {loadingCollection === collection.id
                        ? "Loading..."
                        : (collection.callToAction || "Shop now")}
                    </span>
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </div>
                </div>
              </div>
              {/* Ensure the Card remains clickable */}
              <span className="absolute inset-0" aria-label={`Open ${collection.name}`}></span>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedCollections;
