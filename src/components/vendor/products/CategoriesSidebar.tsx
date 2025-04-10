
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Star, Gift, Calendar, Tag } from "lucide-react";

interface CategoriesSidebarProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export const CategoriesSidebar = ({ 
  activeCategory, 
  setActiveCategory 
}: CategoriesSidebarProps) => {
  const categories = [
    { id: "all", name: "All Products", icon: Package },
    { id: "featured", name: "Featured", icon: Star },
    { id: "gifts", name: "Gift Sets", icon: Gift },
    { id: "seasonal", name: "Seasonal", icon: Calendar },
    { id: "custom", name: "Custom Products", icon: Tag },
  ];

  return (
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
  );
};
