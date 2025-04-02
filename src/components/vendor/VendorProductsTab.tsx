
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Tag, Package, Star, Gift, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const VendorProductsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

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
      </div>

      {/* Products Section */}
      <div className="md:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Product Management</CardTitle>
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
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
            
            <div className="rounded-md border border-dashed p-8 text-center">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <Package className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No products yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your store or add products manually to get started.
                </p>
                <Button className="mt-4">Add Your First Product</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorProductsTab;
