
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ShoppingBag, Store, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Elyphant Marketplace</h1>
          <nav className="flex items-center space-x-4">
            <Link to="/marketplace" className="text-sm font-medium hover:text-primary">
              Marketplace
            </Link>
            <Link to="/vendor-signup" className="text-sm font-medium hover:text-primary">
              Become a Vendor
            </Link>
            <Link to="/vendor-management" className="text-sm font-medium hover:text-primary">
              Vendor Management
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="container mx-auto py-12 px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Welcome to Vendor Marketplace</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect retailers and vendors, integrate with Shopify and Amazon, and create 
              a powerful product marketplace with sponsored placements.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="mr-4">
                <Link to="/marketplace">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Browse Marketplace
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/vendor-signup">
                  <Store className="mr-2 h-5 w-5" />
                  Become a Vendor
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Store className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Vendor Integration</CardTitle>
                <CardDescription>
                  Connect with multiple retailers and vendors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Easily integrate with Shopify stores, access Amazon products via Zinc API,
                  or connect using our custom API endpoints.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/vendor-management">
                    Manage Integrations
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <ShoppingBag className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Product Marketplace</CardTitle>
                <CardDescription>
                  Unified shopping experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Browse products from multiple vendors in one place with 
                  a seamless shopping experience for customers.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/marketplace">
                    View Marketplace
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Sponsored Placements</CardTitle>
                <CardDescription>
                  Advertising platform for vendors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Offer vendors premium advertising space to boost visibility
                  and sales with targeted sponsored placements.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/vendor-management">
                    Explore Advertising
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
              <h3 className="text-lg font-semibold mb-2">Vendor Marketplace</h3>
              <p className="text-gray-400 text-sm max-w-md">
                A platform connecting retailers and vendors with customers,
                featuring sponsored advertising opportunities.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium mb-3">Platform</h4>
                <ul className="space-y-2">
                  <li><Link to="/marketplace" className="text-gray-400 hover:text-white text-sm">Marketplace</Link></li>
                  <li><Link to="/vendor-signup" className="text-gray-400 hover:text-white text-sm">Become a Vendor</Link></li>
                  <li><Link to="/vendor-management" className="text-gray-400 hover:text-white text-sm">Vendor Management</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Resources</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm">Documentation</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm">API Reference</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white text-sm">Support</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-6 text-sm text-gray-400">
            <p>© 2023 Vendor Marketplace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
