import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Heart, Gift, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const HomeContent = () => {
  // Featured products data (would come from API in production)
  const featuredProducts = [
    {
      id: 1,
      name: "Premium Headphones",
      price: 149.99,
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Headphones",
      vendor: "Audio Shop",
    },
    {
      id: 2,
      name: "Smart Watch Series 5",
      price: 299.99,
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Watch",
      vendor: "Tech Store",
    },
    {
      id: 3,
      name: "Wireless Earbuds",
      price: 89.99,
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Earbuds",
      vendor: "Audio Shop",
    },
    {
      id: 4,
      name: "Fitness Tracker",
      price: 79.99,
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Tracker",
      vendor: "Health Gadgets",
    },
  ];

  // Featured collections
  const collections = [
    { 
      id: 1, 
      name: "Birthday Gifts", 
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Birthday", 
      count: 120 
    },
    { 
      id: 2, 
      name: "Anniversary", 
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Anniversary", 
      count: 85 
    },
    { 
      id: 3, 
      name: "For Her", 
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=For+Her", 
      count: 150 
    },
    { 
      id: 4, 
      name: "For Him", 
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=For+Him", 
      count: 145 
    },
  ];

  // Top brands data
  const topBrands = [
    { id: 1, name: "Nike", logoUrl: "/placeholder.svg", productCount: 245 },
    { id: 2, name: "Apple", logoUrl: "/placeholder.svg", productCount: 189 },
    { id: 3, name: "Samsung", logoUrl: "/placeholder.svg", productCount: 167 },
    { id: 4, name: "Sony", logoUrl: "/placeholder.svg", productCount: 142 },
    { id: 5, name: "Adidas", logoUrl: "/placeholder.svg", productCount: 134 },
    { id: 6, name: "Bose", logoUrl: "/placeholder.svg", productCount: 98 },
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      {/* 1. Gift Collections (Shop by Occasion) */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Shop by Occasion</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {collections.map((collection) => (
            <Link to="/gifting" key={collection.id}>
              <div className="group relative overflow-hidden rounded-lg">
                <div className="aspect-[4/3]">
                  <img 
                    src={collection.image} 
                    alt={collection.name}
                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="text-white font-semibold">{collection.name}</h3>
                    <p className="text-white/80 text-sm">{collection.count} items</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 2. Top Brands */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Featured Brands</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {topBrands.map((brand) => (
            <Link to="/gifting" key={brand.id}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <img 
                      src={brand.logoUrl} 
                      alt={brand.name} 
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <h3 className="font-medium text-center text-sm">{brand.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Featured Products Carousel */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Link to="/gifting" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
            View all products
          </Link>
        </div>
        
        <Carousel className="w-full">
          <CarouselContent>
            {featuredProducts.map((product) => (
              <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4">
                <div className="p-1">
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square relative">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{product.vendor}</p>
                      <p className="font-semibold">${product.price.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious />
            <CarouselNext />
          </div>
        </Carousel>
      </div>

      {/* Key Features */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">The Power of Automated Gifting</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="mx-auto w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-7 w-7 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Scheduled Gifts</h3>
            <p className="text-muted-foreground">
              Set up recurring gifts for birthdays, anniversaries, or any special occasion with automated scheduling.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-7 w-7 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Hands-Free Delivery</h3>
            <p className="text-muted-foreground">
              Our system automatically handles selection, payment, and delivery so you never miss an important date.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-7 w-7 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Perfect Matches</h3>
            <p className="text-muted-foreground">
              Our smart algorithm ensures recipients get exactly what they want from their wishlists.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-purple-100 rounded-xl p-8 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="md:w-1/2 mb-6 md:mb-0">
            <h2 className="text-2xl font-bold mb-6">Two Ways to Get Started</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <Gift className="h-6 w-6 text-purple-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Need a gift for someone?</h3>
                  <p className="text-muted-foreground text-sm">
                    Browse gifts, set up automated gifting, and never miss an important date.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <ShoppingBag className="h-6 w-6 text-purple-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Want to receive gifts?</h3>
                  <p className="text-muted-foreground text-sm">
                    Create a wishlist and share it with friends and family to get exactly what you want.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-end space-y-3 md:space-y-0 md:space-x-3 flex-col md:flex-row">
            <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto">
              <Link to="/gifting">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Start Gifting
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full md:w-auto">
              <Link to="/gifting">
                <Gift className="mr-2 h-5 w-5" />
                Create Wishlist
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeContent;
