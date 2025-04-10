
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, Filter, Tag, Package, 
  Star, Gift, Calendar, Plus, 
  Upload, Download, Settings 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const VendorProductsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");

  const categories = [
    { id: "all", name: "All Products", icon: Package },
    { id: "featured", name: "Featured", icon: Star },
    { id: "gifts", name: "Gift Sets", icon: Gift },
    { id: "seasonal", name: "Seasonal", icon: Calendar },
    { id: "custom", name: "Custom Products", icon: Tag },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Categories Sidebar */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Browse by product type</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "ghost"}
                  className="w-full justify-start pl-6 font-normal"
                  onClick={() => setActiveCategory(category.id)}
                >
                  <category.icon className="mr-2 h-4 w-4" />
                  {category.name}
                  {category.id === "featured" && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      New
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Configure product options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Default Markup</label>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue placeholder="Select markup" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="40">40%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Applied to all products without a custom markup
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Default Fulfillment</label>
                <Select defaultValue="physical">
                  <SelectTrigger>
                    <SelectValue placeholder="Select fulfillment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Physical Shipping</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="pickup">In-Store Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" className="w-full" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Section */}
      <div className="md:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Product Management</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Import CSV
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Product
                </Button>
              </div>
            </div>
            <CardDescription>Manage all products from connected vendors</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search products, collections, or tags..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-sm text-muted-foreground">
                  Showing {activeCategory === "all" ? "all" : activeCategory} products
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-sm text-muted-foreground">Fulfillment:</label>
                <Select 
                  value={fulfillmentFilter} 
                  onValueChange={setFulfillmentFilter}
                >
                  <SelectTrigger className="w-[180px] h-8">
                    <SelectValue placeholder="Filter by fulfillment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="physical">Physical Shipping</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="pickup">In-Store Pickup</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="grid">
              <div className="flex justify-end mb-4">
                <TabsList>
                  <TabsTrigger value="grid" className="px-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="7" height="7" x="3" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="14" rx="1" />
                      <rect width="7" height="7" x="3" y="14" rx="1" />
                    </svg>
                  </TabsTrigger>
                  <TabsTrigger value="list" className="px-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" x2="21" y1="6" y2="6" />
                      <line x1="3" x2="21" y1="12" y2="12" />
                      <line x1="3" x2="21" y1="18" y2="18" />
                    </svg>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="grid">
                <div className="rounded-md border border-dashed p-8 text-center">
                  <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                    <Package className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No products yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add products manually or import from CSV to get started.
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline">Import CSV</Button>
                      <Button>Add Product</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="list">
                <div className="rounded-md border border-dashed p-8 text-center">
                  <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                    <Package className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No products yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add products manually or import from CSV to get started.
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline">Import CSV</Button>
                      <Button>Add Product</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorProductsTab;
