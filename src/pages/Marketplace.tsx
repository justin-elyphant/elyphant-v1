
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import VendorList from "@/components/marketplace/VendorList";
import FeaturedProducts from "@/components/marketplace/FeaturedProducts";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import SponsoredSection from "@/components/marketplace/SponsoredSection";

const Marketplace = () => {
  return (
    <div className="container mx-auto py-8">
      <MarketplaceHeader />
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mb-8">
        <div className="md:col-span-2">
          <SponsoredSection />
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Vendor Portal</CardTitle>
              <CardDescription>
                Connect your store or become a vendor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you a retailer who wants to connect your products? Join our marketplace to expand your reach.
                </p>
                <a href="/vendor-signup" className="text-primary hover:underline text-sm font-medium flex items-center">
                  Learn more about becoming a vendor
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <FeaturedProducts />
      <VendorList />
    </div>
  );
};

export default Marketplace;
