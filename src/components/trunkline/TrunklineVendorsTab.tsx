
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Tag, Store } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TrunklineVendorsTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vendor Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search vendors by name or product category..." 
                className="pl-8" 
              />
            </div>
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Vendors</TabsTrigger>
              <TabsTrigger value="marketing">Marketing Tags</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="border rounded-md p-8 text-center">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Enter a search term to find vendors.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="marketing">
              <div className="border rounded-md p-8 text-center">
                <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No marketing tags configured. Tags allow you to segment vendors for campaigns.</p>
                <Button className="mt-4">Create Tag</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="payouts">
              <div className="border rounded-md p-8 text-center">
                <p className="text-muted-foreground">Payout information will appear here once vendors complete Stripe Connect onboarding.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrunklineVendorsTab;
