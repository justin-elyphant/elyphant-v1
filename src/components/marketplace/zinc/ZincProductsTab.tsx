import React, { useState } from "react";
import { ZincSearchForm } from "./components/ZincSearchForm";
import { ZincProductResults } from "./components/ZincProductResults";
import { productCatalogService } from "@/services/ProductCatalogService";
import { toast } from "sonner";

const ZincProductsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!localSearchTerm.trim()) return;
    
    setIsLoading(true);
    setSearchTerm(localSearchTerm);
    
    try {
      const response = await productCatalogService.searchProducts(localSearchTerm, { limit: 24 });
      
      if (response.products && response.products.length > 0) {
        setProducts(response.products.map((p: any) => ({
          id: p.product_id,
          name: p.title,
          price: p.price,
          category: p.category,
          image: p.image,
          vendor: "Amazon via Zinc",
          description: p.description,
          rating: p.rating,
          reviewCount: p.review_count
        })));
        console.log(`Found ${response.products.length} products for "${localSearchTerm}"`);
      } else {
        setProducts([]);
        toast.error("No products found");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const syncProducts = async () => {
    toast.success("Products synced");
  };

  return (
    <div className="space-y-4 py-4">
      <ZincSearchForm
        searchTerm={localSearchTerm}
        setSearchTerm={setLocalSearchTerm}
        handleSubmit={handleSubmit}
        handleKeyDown={handleKeyDown}
        syncProducts={syncProducts}
        isLoading={isLoading}
      />
      
      {searchTerm && (
        <p className="text-sm text-muted-foreground">
          Showing results for: "{searchTerm}"
        </p>
      )}
      
      <ZincProductResults
        products={products}
        isLoading={isLoading}
        searchTerm={searchTerm}
      />
    </div>
  );
};

export default ZincProductsTab;
