
import React from "react";
import ProductGridOptimized from "./ProductGridOptimized";
import { CircleSlash } from "lucide-react";
import ProductSkeleton from "./ui/ProductSkeleton";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useConnectedFriendsSpecialDates } from "@/hooks/useConnectedFriendsSpecialDates";
import { differenceInDays } from "date-fns";

interface MarketplaceContentProps {
  products: any[];
  isLoading: boolean;
  searchTerm: string;
}

const MarketplaceContent = ({ 
  products, 
  isLoading, 
  searchTerm 
}: MarketplaceContentProps) => {
  const { profile } = useProfile();
  const { friendOccasions } = useConnectedFriendsSpecialDates();
  const hasProfile = !!profile;
  
  // For debugging - log what we're trying to render
  console.log("MarketplaceContent rendering:", { 
    productsCount: products?.length || 0, 
    isLoading, 
    searchTerm,
    hasProfile,
    productsData: products?.slice(0, 2) // Log first two products for debugging
  });

  // Check if we have any upcoming friend occasions
  const hasUpcomingFriendOccasion = friendOccasions.length > 0;
  const closestFriendOccasion = friendOccasions.length > 0 ? friendOccasions[0] : null;
  const daysToClosestOccasion = closestFriendOccasion 
    ? differenceInDays(closestFriendOccasion.date, new Date()) 
    : null;

  // Function to render the appropriate content based on loading state and products
  const renderContent = () => {
    if (isLoading) {
      return <ProductSkeleton count={8} />;
    }

    if (!products || products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-gray-100 p-4 rounded-full">
            <CircleSlash className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mt-4">No products found</h3>
          <p className="text-sm text-muted-foreground max-w-md text-center mt-2">
            {searchTerm 
              ? `We couldn't find any products matching "${searchTerm}". Try a different search term.`
              : "No products are available at the moment. Please check back later."}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {searchTerm 
              ? `Showing ${products.length} results for "${searchTerm}"` 
              : `Showing ${products.length} products`}
          </p>
        </div>
        
        <ProductGridOptimized 
          products={products} 
          viewMode="grid" 
          isLoading={false}
          useMock={true}
        />
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mt-8">
      <h2 className="text-xl font-semibold mb-4">
        {searchTerm 
          ? `Search Results: "${searchTerm}"` 
          : hasProfile 
            ? "Personalized Recommendations" 
            : "Recommended Products"}
      </h2>
      
      {/* Show personalization badge if viewing recommendations with a profile */}
      {!searchTerm && hasProfile && (
        <div className="bg-purple-50 border border-purple-200 rounded-md p-2 text-sm flex items-center mb-4">
          <span className="text-purple-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Products shown are personalized based on your interests and preferences
          </span>
        </div>
      )}
      
      {/* Special upcoming occasions reminder */}
      {hasUpcomingFriendOccasion && closestFriendOccasion && daysToClosestOccasion !== null && daysToClosestOccasion <= 14 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-sm flex items-center mb-4">
          <span className="text-amber-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {daysToClosestOccasion === 0 
              ? `${closestFriendOccasion.name} is today!` 
              : daysToClosestOccasion === 1 
                ? `${closestFriendOccasion.name} is tomorrow!`
                : `${closestFriendOccasion.name} is in ${daysToClosestOccasion} days!`
            }
          </span>
        </div>
      )}
      
      {renderContent()}
    </div>
  );
};

export default MarketplaceContent;
