
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProductManagementHeader } from "./ProductManagementHeader";
import { ProductSearchBar } from "./ProductSearchBar";
import { ProductFilters } from "./ProductFilters";
import { ProductViewToggle } from "./ProductViewToggle";
import { EmptyProductState } from "./EmptyProductState";

interface ProductContentProps {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  activeCategory: string;
  fulfillmentFilter: string;
  setFulfillmentFilter: (filter: string) => void;
}

export const ProductContent = ({
  searchTerm,
  setSearchTerm,
  activeCategory,
  fulfillmentFilter,
  setFulfillmentFilter
}: ProductContentProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <ProductManagementHeader />
        
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
            <EmptyProductState />
          </TabsContent>
          
          <TabsContent value="list">
            <EmptyProductState />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
