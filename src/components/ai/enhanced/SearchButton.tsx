
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
      style={{ background: 'linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%)' }}
      className="text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
