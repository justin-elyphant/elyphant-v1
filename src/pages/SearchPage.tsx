import React from "react";
import AIEnhancedSearchBar from "@/components/search/AIEnhancedSearchBar";
import { Card } from "@/components/ui/card";
import SEOWrapper from "@/components/seo/SEOWrapper";

const SearchPage: React.FC = () => {
  return (
    <SEOWrapper
      title="Search Gifts - AI-Powered Gift Finder | Elyphant"
      description="Search our curated gift marketplace with AI-powered recommendations. Find the perfect gift with smart filters, personalized suggestions, and instant results."
      keywords="gift search, AI gift finder, smart search, gift marketplace, personalized gift search, intelligent gift recommendations"
      url="/search"
    >
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
    </SEOWrapper>
  );
};

export default SearchPage;