import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Grid3X3, List, SlidersHorizontal } from "lucide-react";
import { useDynamicFilters } from "@/hooks/useDynamicFilters";
import { EnhancedFilterPills } from "@/components/marketplace/filters/EnhancedFilterPills";
import { EnhancedFilterPanel } from "@/components/marketplace/filters/EnhancedFilterPanel";
import { EnhancedMobileFilterSheet } from "@/components/marketplace/filters/EnhancedMobileFilterSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import SEOWrapper from "@/components/seo/SEOWrapper";
import { Product } from "@/types/product";

// Mock product data for demonstration
const mockProducts: Product[] = [
  {
    id: "1",
    product_id: "1",
    title: "Men's Running Shoes",
    name: "Men's Running Shoes",
    brand: "Nike",
    category: "Shoes",
    price: 120,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    description: "High-performance running shoes for men",
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"]
  },
  {
    id: "2",
    product_id: "2", 
    title: "Women's Yoga Mat",
    name: "Women's Yoga Mat",
    brand: "Lululemon",
    category: "Fitness",
    price: 88,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
    description: "Premium yoga mat for women",
    images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400"]
  },
  {
    id: "3",
    product_id: "3",
    title: "Kids Building Blocks",
    name: "Kids Building Blocks",
    brand: "LEGO",
    category: "Toys",
    price: 45,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    description: "Educational building blocks for kids",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"]
  },
  {
    id: "4",
    product_id: "4",
    title: "Wireless Headphones",
    name: "Wireless Headphones",
    brand: "Sony",
    category: "Electronics",
    price: 299,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400",
    description: "Premium wireless noise-canceling headphones",
    images: ["https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400"]
  },
  {
    id: "5",
    product_id: "5",
    title: "Women's Summer Dress",
    name: "Women's Summer Dress",
    brand: "Zara",
    category: "Clothing",
    price: 79,
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
    description: "Elegant summer dress for women",
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400"]
  },
  {
    id: "6",
    product_id: "6",
    title: "Men's Watch",
    name: "Men's Watch",
    brand: "Rolex",
    category: "Accessories",
    price: 8500,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400",
    description: "Luxury men's watch",
    images: ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400"]
  }
];

const EnhancedMarketplacePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

  const {
    filters,
    filteredProducts,
    filterOptions,
    searchContext,
    updateFilter,
    applyFilters,
    removeFilter,
    resetFilters,
    shouldShowBrandFilters,
    shouldShowDemographicFilters,
    shouldShowOccasionFilters,
    shouldShowAttributeFilters
  } = useDynamicFilters(mockProducts, searchTerm);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <Badge className="absolute top-2 right-2 bg-white/90 text-gray-900">
          ${product.price}
        </Badge>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {product.brand}
          </Badge>
          <div className="flex items-center gap-1">
            <span className="text-sm">★</span>
            <span className="text-sm">{product.rating}</span>
          </div>
        </div>
        <h3 className="font-medium text-sm mb-1">{product.title || product.name}</h3>
        <p className="text-xs text-muted-foreground">{product.description}</p>
      </div>
    </Card>
  );

  return (
    <SEOWrapper
      title="Enhanced Marketplace - AI-Powered Dynamic Filters | Elyphant"
      description="Experience our enhanced marketplace with AI-powered dynamic filters, smart suggestions, and context-aware search results."
      keywords="enhanced marketplace, dynamic filters, AI shopping, smart search, product filters"
      url="/enhanced-marketplace"
    >
      <div className="min-h-screen bg-background">
        <div className="container-header py-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-heading-2">Enhanced Marketplace</h1>
            <p className="text-body-sm text-muted-foreground">
              AI-powered dynamic filters with smart suggestions and context-aware results
            </p>
          </div>

          {/* Search Bar */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Try searching: 'men's running shoes', 'kids toys', 'women's yoga gear'..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>
              
              {/* View Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                
                {!isMobile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Search Context Display */}
          {searchTerm && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-primary">Search Analysis</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {searchContext.gender && (
                    <Badge variant="secondary">Gender: {searchContext.gender}</Badge>
                  )}
                  {searchContext.ageGroup && (
                    <Badge variant="secondary">Age: {searchContext.ageGroup}</Badge>
                  )}
                  {searchContext.occasion && (
                    <Badge variant="secondary">Occasion: {searchContext.occasion}</Badge>
                  )}
                  {searchContext.isGiftContext && (
                    <Badge variant="secondary">🎁 Gift Context</Badge>
                  )}
                  {searchContext.productCategory && (
                    <Badge variant="secondary">Category: {searchContext.productCategory}</Badge>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Filter Pills */}
          <EnhancedFilterPills
            filters={filters}
            onRemoveFilter={removeFilter}
            onClearAll={resetFilters}
          />

          {/* Content Area */}
          <div className="flex gap-6">
            {/* Desktop Filter Panel */}
            {!isMobile && showFilters && (
              <div className="w-80 flex-shrink-0">
                <EnhancedFilterPanel
                  filters={filters}
                  filterOptions={filterOptions}
                  onUpdateFilter={updateFilter}
                  products={mockProducts}
                  filteredProducts={filteredProducts}
                  shouldShowBrandFilters={Boolean(shouldShowBrandFilters)}
                  shouldShowAttributeFilters={Boolean(shouldShowAttributeFilters)}
                  shouldShowDemographicFilters={Boolean(shouldShowDemographicFilters)}
                  shouldShowOccasionFilters={Boolean(shouldShowOccasionFilters)}
                />
              </div>
            )}

            {/* Results Area */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Showing {filteredProducts.length} of {mockProducts.length} results
                  </span>
                  
                  {/* Mobile Filter Button */}
                  {isMobile && (
                    <EnhancedMobileFilterSheet
                      filters={filters}
                      filterOptions={filterOptions}
                      onUpdateFilter={updateFilter}
                      onApplyFilters={applyFilters}
                      onResetFilters={resetFilters}
                      products={mockProducts}
                      filteredProducts={filteredProducts}
                      searchContext={searchContext}
                      shouldShowBrandFilters={Boolean(shouldShowBrandFilters)}
                      shouldShowAttributeFilters={Boolean(shouldShowAttributeFilters)}
                      shouldShowDemographicFilters={Boolean(shouldShowDemographicFilters)}
                      shouldShowOccasionFilters={Boolean(shouldShowOccasionFilters)}
                    />
                  )}
                </div>
              </div>

              {/* Product Grid */}
              {filteredProducts.length > 0 ? (
                <div className={`grid gap-4 ${
                  viewMode === "grid" 
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "grid-cols-1"
                }`}>
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <div className="space-y-4">
                    <div className="text-4xl">🔍</div>
                    <h3 className="text-lg font-medium">No products found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your filters or search terms
                    </p>
                    <Button onClick={resetFilters} variant="outline">
                      Clear all filters
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom padding for mobile nav */}
        <div className="h-20 md:hidden" />
      </div>
    </SEOWrapper>
  );
};

export default EnhancedMarketplacePage;