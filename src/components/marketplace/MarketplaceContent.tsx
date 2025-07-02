
import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MarketplaceHeader from "./header/MarketplaceHeader";
import ProductGrid from "./ProductGrid";
import CategoryFilter from "./CategoryFilter";
import PriceFilter from "./PriceFilter";
import MobileFilters from "./mobile/MobileFilters";
import ZincProductsTab from "./zinc/ZincProductsTab";
import { useProducts } from "@/contexts/ProductContext";

const MarketplaceContent: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { products } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  
  // Get search term from URL
  const searchTerm = searchParams.get("search") || "";
  
  // Get marketplace products
  const elyphantProducts = products.filter(p => p.vendor === "Elyphant");
  const zincProducts = products.filter(p => p.vendor === "Amazon via Zinc");
  
  // Clear filters when navigating
  useEffect(() => {
    setSelectedCategory("");
    setPriceRange([0, 1000]);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />
      
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="elyphant" className="w-full">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop Filters Sidebar */}
            <div className="hidden lg:block w-64 space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">Filters</h3>
                  <div className="space-y-4">
                    <CategoryFilter
                      selectedCategory={selectedCategory}
                      onCategoryChange={setSelectedCategory}
                    />
                    <Separator />
                    <PriceFilter
                      priceRange={priceRange}
                      onPriceChange={setPriceRange}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="flex-1">
              {/* Mobile Filters */}
              <div className="lg:hidden mb-4">
                <MobileFilters
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  priceRange={priceRange}
                  onPriceChange={setPriceRange}
                />
              </div>
              
              {/* Search Results Header */}
              {searchTerm && (
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Search Results for "{searchTerm}"
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Found {elyphantProducts.length + zincProducts.length} products
                  </p>
                </div>
              )}
              
              {/* Tabs */}
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="elyphant" className="flex items-center gap-2">
                  Elyphant Store
                  <Badge variant="secondary">{elyphantProducts.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="amazon" className="flex items-center gap-2">
                  Amazon Products
                  <Badge variant="secondary">{zincProducts.length}</Badge>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="elyphant">
                <ProductGrid 
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                  priceRange={priceRange}
                  products={elyphantProducts}
                />
              </TabsContent>
              
              <TabsContent value="amazon">
                <ZincProductsTab searchTerm={searchTerm} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketplaceContent;
