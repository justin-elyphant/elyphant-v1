import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Compass, TrendingUp, Gift, Users, Star } from "lucide-react";
import { Link } from "react-router-dom";

const DiscoverPage: React.FC = () => {
  const trendingCategories = [
    { name: "Electronics", count: 1234, icon: "📱" },
    { name: "Fashion", count: 856, icon: "👔" },
    { name: "Home & Garden", count: 642, icon: "🏠" },
    { name: "Books", count: 398, icon: "📚" },
  ];

  const featuredProducts = [
    { name: "Wireless Headphones", price: "$199", rating: 4.8, image: "🎧" },
    { name: "Smart Watch", price: "$299", rating: 4.6, image: "⌚" },
    { name: "Coffee Maker", price: "$89", rating: 4.7, image: "☕" },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Compass className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Discover</h1>
      </div>

      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Welcome to our marketplace!</h2>
            <p className="text-muted-foreground">
              Explore trending products, discover new categories, and find amazing deals.
            </p>
            <Button asChild className="mt-4">
              <Link to="/auth">
                Sign up to create wishlists and connect with friends
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trending Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {trendingCategories.map((category) => (
              <Link
                key={category.name}
                to={`/marketplace?category=${category.name.toLowerCase()}`}
                className="group"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <Badge variant="secondary" className="mt-1">
                      {category.count} items
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Featured Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Featured Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {featuredProducts.map((product) => (
              <Link
                key={product.name}
                to="/marketplace"
                className="block group"
              >
                <div className="flex items-center gap-4 p-4 rounded-lg border group-hover:bg-muted/50 transition-colors">
                  <div className="text-2xl">{product.image}</div>
                  <div className="flex-1">
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-semibold">{product.price}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">{product.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Join Our Community
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Connect with friends, share wishlists, and discover what others are loving.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link to="/auth">
                  <Gift className="h-4 w-4 mr-2" />
                  Create Wishlists
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/auth">
                  <Users className="h-4 w-4 mr-2" />
                  Find Friends
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscoverPage;