import React, { useState, useRef, useEffect } from "react";
import { useProducts } from "@/contexts/ProductContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useZincProducts } from "./hooks/useZincProducts";
import { toast } from "@/hooks/use-toast";

const ZincProductsTab = () => {
  const { products } = useProducts();
  const { 
    isLoading, 
    searchTerm, 
    setSearchTerm, 
    handleSearch, 
    syncProducts 
  } = useZincProducts();
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const searchInProgressRef = useRef(false);
  
  useEffect(() => {
    if (searchTerm && searchTerm !== localSearchTerm) {
      setLocalSearchTerm(searchTerm);
    }
  }, [searchTerm]);
  
  const marketplaceProducts = products.filter(p => p.vendor === "Elyphant");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (localSearchTerm.trim() && !searchInProgressRef.current) {
      searchInProgressRef.current = true;
      console.log(`ZincProductsTab: Submitting search for "${localSearchTerm}"`);
      
      try {
        await handleSearch(localSearchTerm);
      } catch (error) {
        console.error("Search error:", error);
        toast({
          title: "Search Failed",
          description: "There was an error processing your search",
          variant: "destructive"
        });
      } finally {
        searchInProgressRef.current = false;
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };
  
  return (
    <div className="space-y-4 py-4">
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-8"
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>
        <Button 
          type="submit" 
          variant="default" 
          disabled={isLoading || !localSearchTerm.trim()}
        >
          {isLoading ? "Searching..." : "Search"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => syncProducts()} 
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Sync
        </Button>
      </form>
      
      {searchTerm && (
        <p className="text-sm text-muted-foreground">
          Showing results for: "{searchTerm}"
        </p>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      ) : marketplaceProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="text-center text-muted-foreground">
              No products found. Search for products or sync to import products.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marketplaceProducts.map(product => (
            <Card key={product.id}>
              <CardContent className="p-4 flex gap-4">
                <div className="w-20 h-20 rounded overflow-hidden shrink-0">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description || "No description available."}
                  </p>
                  <p className="font-medium">${product.price.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ZincProductsTab;
