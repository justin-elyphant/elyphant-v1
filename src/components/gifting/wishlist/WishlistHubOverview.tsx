import React from "react";
import { useNavigate } from "react-router-dom";
import { Wishlist } from "@/types/profile";
import WishlistCard from "./WishlistCard";
import CreateWishlistCard from "./CreateWishlistCard";
import PopularBrands from "@/components/gifting/PopularBrands";
import FeaturedProducts from "@/components/home/sections/FeaturedProducts";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp } from "lucide-react";

interface WishlistHubOverviewProps {
  wishlists: Wishlist[];
  onCreateWishlist: () => void;
  onEditWishlist: (id: string) => void;
  onDeleteWishlist: (id: string) => void;
  onUpdateSharing: (wishlistId: string, isPublic: boolean) => Promise<boolean>;
}

const WishlistHubOverview: React.FC<WishlistHubOverviewProps> = ({
  wishlists,
  onCreateWishlist,
  onEditWishlist,
  onDeleteWishlist,
  onUpdateSharing
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section - Wishlist Cards Grid */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">My Wishlists</h1>
          <p className="text-muted-foreground mt-2">
            Manage your wishlists and discover new items
          </p>
        </div>

        {/* Wishlists Grid */}
        {wishlists.length === 0 ? (
          <div className="max-w-2xl mx-auto py-16">
            <div className="text-center space-y-6">
              <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Create Your First Wishlist</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Start curating items you love and share them with friends and family. 
                  It's the perfect way to let others know what you'd love to receive!
                </p>
              </div>
              <CreateWishlistCard onCreateNew={onCreateWishlist} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Wishlist Card */}
            <CreateWishlistCard onCreateNew={onCreateWishlist} />
            
            {/* Existing Wishlist Cards */}
            {wishlists.map((wishlist) => (
              <WishlistCard
                key={wishlist.id}
                wishlist={wishlist}
                onEdit={onEditWishlist}
                onDelete={onDeleteWishlist}
              />
            ))}
          </div>
        )}
      </section>

      {/* Popular Brands Section - Full Bleed */}
      {wishlists.length > 0 && (
        <>
          <section className="bg-background/50 border-y border-border/50 py-12">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold">Shop by Brand</h2>
              </div>
              <PopularBrands />
            </div>
          </section>

          {/* AI Suggestions Section */}
          <section className="py-12">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold">Recommended For You</h2>
                <span className="text-sm text-muted-foreground ml-2">
                  Based on your wishlists
                </span>
              </div>
              <FeaturedProducts 
                searchTerm="gift" 
                title=""
                maxProducts={12}
              />
            </div>
          </section>

          {/* Trending Products Section */}
          <section className="bg-background/50 border-t border-border/50 py-12">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold">Trending Now</h2>
              </div>
              <FeaturedProducts 
                searchTerm="trending gift" 
                title=""
                maxProducts={12}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default WishlistHubOverview;
