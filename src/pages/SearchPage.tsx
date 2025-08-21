import React from "react";
import AIEnhancedSearchBar from "@/components/search/AIEnhancedSearchBar";
import { Card } from "@/components/ui/card";

const SearchPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container-header py-6 space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-heading-2">Search Products</h1>
          <p className="text-body-sm">Find exactly what you're looking for</p>
        </div>

        {/* Search Bar */}
        <Card className="p-4">
          <AIEnhancedSearchBar />
        </Card>

        {/* Search Results Area */}
        <div className="space-y-4">
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-body">Start typing to search our marketplace</p>
          </div>
        </div>
      </div>
      
      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default SearchPage;