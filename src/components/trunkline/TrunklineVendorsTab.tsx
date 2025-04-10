
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
      <Card>
        <CardHeader>
          <CardTitle>Vendor Management</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorSearch 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={handleSearch}
          />
          
          <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as VendorTabType)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Vendors</TabsTrigger>
              <TabsTrigger value="marketing">Marketing Tags</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <AllVendorsContent 
                vendors={filteredVendors} 
                hasSearched={hasSearched} 
              />
            </TabsContent>
            
            <TabsContent value="marketing">
              <MarketingTagsContent />
            </TabsContent>
            
            <TabsContent value="payouts">
              <PayoutsContent />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrunklineVendorsTab;
