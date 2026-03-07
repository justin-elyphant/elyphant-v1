
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VendorSearch from "./vendors/VendorSearch";
import AllVendorsContent from "./vendors/AllVendorsContent";
import MarketingTagsContent from "./vendors/MarketingTagsContent";
import PayoutsContent from "./vendors/PayoutsContent";
import { useVendorManagement } from "@/hooks/trunkline/useVendorManagement";
import { VendorTabType } from "./vendors/types";

const TrunklineVendorsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeTab, setActiveTab] = useState<VendorTabType>("all");

  const statusFilter = activeTab === "pending" ? "pending" : undefined;
  const { data: vendors = [], isLoading } = useVendorManagement(
    activeSearch || undefined,
    statusFilter
  );

  const handleSearch = () => {
    setActiveSearch(searchTerm);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-subtle border-border/80">
        <CardHeader className="border-b pb-4 border-border/60">
          <CardTitle className="text-lg font-medium text-foreground">Vendor Management</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <VendorSearch 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={handleSearch}
          />
          
          <Tabs defaultValue="all" className="mt-6" onValueChange={(value) => setActiveTab(value as VendorTabType)}>
            <TabsList className="bg-muted p-0.5 border border-border">
              <TabsTrigger value="all" className="text-sm">All Vendors</TabsTrigger>
              <TabsTrigger value="pending" className="text-sm">Pending Applications</TabsTrigger>
              <TabsTrigger value="marketing" className="text-sm">Marketing Tags</TabsTrigger>
              <TabsTrigger value="payouts" className="text-sm">Payouts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <AllVendorsContent 
                vendors={vendors}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <AllVendorsContent 
                vendors={vendors}
                isLoading={isLoading}
                emptyMessage="No pending vendor applications."
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
