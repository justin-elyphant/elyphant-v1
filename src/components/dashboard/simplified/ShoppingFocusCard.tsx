import React from "react";
import { Link } from "react-router-dom";
import { Search, Bot, Gift, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const ShoppingFocusCard = () => {
  const isMobile = useIsMobile();

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-emerald-900/20 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Gift className="h-6 w-6 text-purple-600" />
          <span className="bg-gradient-to-r from-purple-700 to-emerald-700 bg-clip-text text-transparent">
            Find Perfect Gifts
          </span>
        </CardTitle>
        <p className="text-muted-foreground">
          Discover thoughtful gifts powered by AI recommendations
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Shopping Actions */}
        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-1" : "grid-cols-2"
        )}>
          {/* Browse Marketplace */}
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg"
          >
            <Link to="/marketplace" className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Browse Marketplace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          {/* Ask Nicole AI */}
          <Button 
            asChild 
            size="lg" 
            variant="outline" 
            className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20"
          >
            <Link to="/marketplace?mode=nicole&open=true&greeting=dashboard" className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              Ask Nicole AI
              <Badge variant="secondary" className="ml-1">
                <Sparkles className="h-3 w-3" />
              </Badge>
            </Link>
          </Button>
        </div>

        {/* Quick Categories */}
        <div className="pt-2">
          <p className="text-sm text-muted-foreground mb-3">Popular Categories</p>
          <div className={cn(
            "flex gap-2",
            isMobile ? "flex-wrap" : "flex-row"
          )}>
            {[
              { name: "Birthdays", query: "birthday gifts" },
              { name: "Anniversaries", query: "anniversary gifts" },
              { name: "Holidays", query: "holiday gifts" },
              { name: "For Him", query: "gifts for men" },
              { name: "For Her", query: "gifts for women" }
            ].map((category) => (
              <Button 
                key={category.name}
                asChild 
                variant="ghost" 
                size="sm"
                className="text-xs border border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20"
              >
                <Link to={`/marketplace?search=${encodeURIComponent(category.query)}`}>
                  {category.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShoppingFocusCard;