
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ShoppingBag, Gift, Award, Heart } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Index = () => {
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <Gift className="h-6 w-6 text-purple-600 mr-2" />
            <h1 className="text-2xl font-bold">Elyphant</h1>
          </div>
          <nav className="flex items-center space-x-4">
            <Link to="/gifting" className="text-sm font-medium hover:text-primary">
              Wishlists
            </Link>
            <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Link to="/gifting">
                <Gift className="mr-2 h-4 w-4" />
                Create Wishlist
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-purple-100 to-purple-200 py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <h2 className="text-4xl font-bold mb-4">Discover Perfect Gifts</h2>
                <p className="text-xl text-gray-700 mb-6">
                  Create wishlists, connect with loved ones, and never miss 
                  an important celebration again.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
                    <Link to="/gifting">
                      <Gift className="mr-2 h-5 w-5" />
                      Explore Wishlists
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/gifting">
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Shop Now
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-end">
                <img 
                  src="https://placehold.co/600x400/e2e8f0/64748b?text=Gift+Giving" 
                  alt="Gift Giving" 
                  className="rounded-lg shadow-lg max-w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Featured Products Carousel */}
        <div className="container mx-auto py-12 px-4">
          <div className="mb-8">
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

          {/* Gift Collections */}
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

          {/* Key Features */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Why Choose Elyphant?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Gift className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Create Wishlists</h3>
                <p className="text-muted-foreground">
                  Create personalized wishlists for any occasion and share them with friends and family.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Heart className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Connect with Loved Ones</h3>
                <p className="text-muted-foreground">
                  Never miss an important date and coordinate group gifts for special occasions.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Automated Gifting</h3>
                <p className="text-muted-foreground">
                  Set up automatic gifting for important events, from selection to delivery.
                </p>
              </div>
            </div>
          </div>

          {/* Top Brands */}
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

          {/* Call to Action */}
          <div className="bg-purple-100 rounded-xl p-8 mb-12">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-2/3 mb-6 md:mb-0">
                <h2 className="text-2xl font-bold mb-2">Ready to start gifting?</h2>
                <p className="text-muted-foreground mb-0">
                  Create your first wishlist and share it with friends and family.
                </p>
              </div>
              <div>
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Link to="/gifting">
                    <Gift className="mr-2 h-5 w-5" />
                    Create Wishlist
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-lg font-semibold mb-2">Elyphant</h3>
              <p className="text-gray-400 text-sm max-w-md">
                Connect with loved ones through meaningful gifts and never miss
                an important celebration again.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium mb-3">Platform</h4>
                <ul className="space-y-2">
                  <li><Link to="/gifting" className="text-gray-400 hover:text-white text-sm">Gifting</Link></li>
                  <li><Link to="/marketplace" className="text-gray-400 hover:text-white text-sm">Marketplace</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Vendors</h4>
                <ul className="space-y-2">
                  <li><Link to="/vendor-signup" className="text-gray-400 hover:text-white text-sm">Become a Vendor</Link></li>
                  <li><Link to="/vendor-management" className="text-gray-400 hover:text-white text-sm">Vendor Management</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-6 text-sm text-gray-400">
            <p>© 2023 Elyphant. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
