
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

const MarketplaceHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [searchInput, setSearchInput] = useState("");

  // Get current search term from URL
  const searchParams = new URLSearchParams(location.search);
  const currentSearch = searchParams.get("search") || "";

  React.useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const newParams = new URLSearchParams();
      newParams.set("search", searchInput.trim());
      navigate(`/marketplace?${newParams.toString()}`);
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    navigate("/marketplace");
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search for gifts..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-4"
              />
              {searchInput && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  ×
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceHeader;
