
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import ProductImage from "@/components/marketplace/product-item/ProductImage";
import { searchProducts } from "@/components/marketplace/zinc/zincService";
import ProductRating from "@/components/shared/ProductRating";
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
  rating?: number;
  reviewCount?: number;
  description?: string;
};

type CollectionProps = {
  collections: Collection[];
};

const LUXURY_GIFTS_IMAGE = "/lovable-uploads/448b42d0-0ea9-433b-8d9b-ca8c143ed3dc.png";

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

  // Add sample ratings to collections for display purposes, and inject luxury gift image & fallback description
  const enhancedCollections = collections.map(collection => {
    let patchedImage = collection.image;
    if (collection.name && collection.name.toLowerCase().includes("luxury gifts")) {
      patchedImage = LUXURY_GIFTS_IMAGE;
    }
    const fallbackDescription =
      collection.description || DEFAULT_DESCRIPTIONS[collection.name] || "Discover carefully curated gift ideas.";

    return {
      ...collection,
      image: patchedImage,
      rating: collection.rating || 4.7 + (Math.random() * 0.3),
      reviewCount: collection.reviewCount || Math.floor(100 + Math.random() * 900),
      description: fallbackDescription,
    };
  });

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
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow h-full p-0 flex flex-col justify-end">
              {/* Consistent aspect ratio, improved centering/cropping */}
              <AspectRatio ratio={4 / 5} className="w-full">
                <img
                  src={collection.image ?? undefined}
                  alt={collection.name}
                  className="absolute inset-0 w-full h-full object-cover object-center z-0 transition-all select-none"
                  style={{ objectPosition: "center" }}
                  draggable={false}
                  loading="lazy"
                />
                {/* STRONGER gradient for bottom fade, so text readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-transparent z-10" />
              </AspectRatio>
              <div className="relative z-20 flex flex-col justify-end h-full w-full px-6 pb-4 pt-8 rounded-b-lg"
                style={{
                  marginTop: "-3.5rem" // pull up overlay, so all content on gradient
                }}
              >
                {/* TITLE & DESCRIPTION with good contrast */}
                <h3 className="text-white font-semibold text-lg md:text-xl lg:text-2xl mb-1 drop-shadow">
                  {collection.name}
                </h3>
                <p className="text-white text-xs md:text-sm mb-0.5 opacity-95 drop-shadow whitespace-pre-line">
                  {collection.description}
                </p>

                <ProductRating
                  rating={collection.rating}
                  reviewCount={collection.reviewCount ? String(collection.reviewCount) : undefined}
                  size="md"
                  className="text-white drop-shadow mb-0.5"
                />
                <div className="flex items-center text-white font-medium mt-1">
                  <span>
                    {loadingCollection === collection.id
                      ? "Loading..."
                      : (collection.callToAction || "Shop now")}
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

