
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VendorSearch from "./vendors/VendorSearch";
import AllVendorsContent from "./vendors/AllVendorsContent";
import MarketingTagsContent from "./vendors/MarketingTagsContent";
import PayoutsContent from "./vendors/PayoutsContent";
import { mockVendors } from "./vendors/mockData";
import { Vendor, VendorTabType } from "./vendors/types";

const TrunklineVendorsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [activeTab, setActiveTab] = useState<VendorTabType>("all");

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredVendors([]);
      setHasSearched(false);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const results = mockVendors.filter(vendor => 
      vendor.name.toLowerCase().includes(searchTermLower) || 
      vendor.productCategories.some(category => 
        category.toLowerCase().includes(searchTermLower)
      )
    );
    
    setFilteredVendors(results);
    setHasSearched(true);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-subtle border-border/80">
        <CardHeader className="border-b pb-4 border-border/60">
          <CardTitle className="text-lg font-medium text-slate-800">Vendor Management</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <VendorSearch 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={handleSearch}
          />
          
          <Tabs defaultValue="all" className="mt-6" onValueChange={(value) => setActiveTab(value as VendorTabType)}>
            <TabsList className="bg-slate-100 p-0.5 border border-slate-200">
              <TabsTrigger value="all" className="text-sm">All Vendors</TabsTrigger>
              <TabsTrigger value="marketing" className="text-sm">Marketing Tags</TabsTrigger>
              <TabsTrigger value="payouts" className="text-sm">Payouts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <AllVendorsContent 
                vendors={filteredVendors} 
                hasSearched={hasSearched} 
              />
            </TabsContent>
            
            <TabsContent value="marketing" className="mt-4">
              <MarketingTagsContent />
            </TabsContent>
            
            <TabsContent value="payouts" className="mt-4">
              <PayoutsContent />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrunklineVendorsTab;
