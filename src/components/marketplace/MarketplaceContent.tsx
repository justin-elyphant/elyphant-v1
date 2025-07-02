
import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MarketplaceHeader from "./MarketplaceHeader";
import ProductGrid from "./ProductGrid";
import ZincProductsTab from "./zinc/ZincProductsTab";
import { useProducts } from "@/contexts/ProductContext";

const MarketplaceContent: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { products } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "modern">("grid");
  
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
                    {/* Basic filter UI - you can enhance this */}
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full mt-1 p-2 border rounded"
                      >
                        <option value="">All Categories</option>
                        <option value="electronics">Electronics</option>
                        <option value="clothing">Clothing</option>
                        <option value="home">Home & Garden</option>
                      </select>
                    </div>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium">Price Range</label>
                      <div className="flex gap-2 mt-1">
                        <input 
                          type="number" 
                          placeholder="Min"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                          className="w-full p-2 border rounded"
                        />
                        <input 
                          type="number" 
                          placeholder="Max"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium">View Mode</label>
                      <select 
                        value={viewMode} 
                        onChange={(e) => setViewMode(e.target.value as "grid" | "list" | "modern")}
                        className="w-full mt-1 p-2 border rounded"
                      >
                        <option value="grid">Grid</option>
                        <option value="list">List</option>
                        <option value="modern">Modern</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="flex-1">
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
                  products={elyphantProducts} 
                  viewMode={viewMode}
                />
              </TabsContent>
              
              <TabsContent value="amazon">
                <ZincProductsTab />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketplaceContent;
