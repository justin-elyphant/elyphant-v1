
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ShoppingBag, Store, Users, Gift } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Elyphant</h1>
          <nav className="flex items-center space-x-4">
            <Link to="/gifting" className="text-sm font-medium hover:text-primary">
              Gifting
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="container mx-auto py-12 px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Welcome to Elyphant</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The ultimate platform to connect with loved ones through meaningful gifts
              and celebrations. Never miss an important date again.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="mr-4">
                <Link to="/gifting">
                  <Gift className="mr-2 h-5 w-5" />
                  Explore Gifting
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Gift className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Create Wishlists</CardTitle>
                <CardDescription>
                  Build custom wishlists for any occasion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create personalized wishlists for birthdays, holidays, or any special occasion.
                  Share them with friends and family to get exactly what you want.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/gifting">
                    Create Wishlist
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Friend Connections</CardTitle>
                <CardDescription>
                  Connect with loved ones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Add friends and family to your network to view their wishlists and important dates.
                  Coordinate group gifts for special occasions.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/gifting">
                    Connect with Friends
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <ShoppingBag className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Automated Gifting</CardTitle>
                <CardDescription>
                  Never miss an important date
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Set up automatic gifting for important events. We'll handle everything
                  from selection to delivery based on your preferences.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/gifting">
                    Set Up Auto-Gifting
                  </Link>
                </Button>
              </CardFooter>
            </Card>
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
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm">Documentation</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm">API Reference</a></li>
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
