
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProductManagementHeader } from "./ProductManagementHeader";
import { ProductSearchBar } from "./ProductSearchBar";
import { ProductFilters } from "./ProductFilters";
import { ProductViewToggle } from "./ProductViewToggle";
import { EmptyProductState } from "./EmptyProductState";
import { ManualProductForm } from "./ManualProductForm";
import { CSVUploadFlow } from "./CSVUploadFlow";
import { VendorProductGrid } from "./VendorProductGrid";
import { useVendorProducts } from "@/hooks/vendor/useVendorProducts";
import { Loader2 } from "lucide-react";

interface ProductContentProps {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  activeCategory: string;
  fulfillmentFilter: string;
  setFulfillmentFilter: (filter: string) => void;
}

type ViewMode = "list" | "add-product" | "csv-upload";

export const ProductContent = ({
  searchTerm,
  setSearchTerm,
  activeCategory,
  fulfillmentFilter,
  setFulfillmentFilter
}: ProductContentProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { data: products, isLoading } = useVendorProducts();

  const filteredProducts = (products ?? []).filter((p) => {
    if (searchTerm && !p.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (activeCategory !== "all" && p.category?.toLowerCase() !== activeCategory.toLowerCase()) return false;
    return true;
  });

  if (viewMode === "add-product") {
    return <ManualProductForm onClose={() => setViewMode("list")} />;
  }

  if (viewMode === "csv-upload") {
    return <CSVUploadFlow onClose={() => setViewMode("list")} />;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <ProductManagementHeader
          onAddProduct={() => setViewMode("add-product")}
          onImportCSV={() => setViewMode("csv-upload")}
        />
        
        <ProductSearchBar 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
        />
        
        <ProductFilters 
          activeCategory={activeCategory}
          fulfillmentFilter={fulfillmentFilter}
          setFulfillmentFilter={setFulfillmentFilter}
        />
        
        <Tabs defaultValue="grid">
          <ProductViewToggle />
          
          <TabsContent value="grid">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length > 0 ? (
              <VendorProductGrid products={filteredProducts} />
            ) : (
              <EmptyProductState 
                onAddProduct={() => setViewMode("add-product")}
                onImportCSV={() => setViewMode("csv-upload")}
              />
            )}
          </TabsContent>
          
          <TabsContent value="list">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length > 0 ? (
              <VendorProductGrid products={filteredProducts} />
            ) : (
              <EmptyProductState 
                onAddProduct={() => setViewMode("add-product")}
                onImportCSV={() => setViewMode("csv-upload")}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
