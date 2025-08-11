
import React from "react";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles } from "lucide-react";

interface SearchButtonProps {
  onSearch: () => void;
  isLoading?: boolean;
}

const SearchButton: React.FC<SearchButtonProps> = ({ onSearch, isLoading = false }) => {
  return (
    <Button
      onClick={onSearch}
      disabled={isLoading}
      size="lg"
      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          Finding Gifts...
        </>
      ) : (
        <>
          <Gift className="mr-2 h-5 w-5" />
          Search Gifts
          <Sparkles className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
};

export default SearchButton;
