
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, ShoppingBag, BadgeDollarSign, BarChart4, CalendarClock, Zap } from "lucide-react";

export const VendorPortalFeaturesSection = () => {
  return (
    <div className="mb-24">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground tracking-tight">
        A Complete Vendor Platform
      </h2>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
        Everything you need to manage products, track performance, and tap into 
        automated gifting — all from one dashboard.
      </p>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-border rounded-none">
          <CardContent className="pt-6">
            <div className="flex items-start mb-4">
              <div className="bg-muted p-3 rounded-full mr-4">
                <ShoppingBag className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Product Management</h3>
                <p className="text-muted-foreground text-sm">
                  Upload your catalog in minutes. Bulk editing and inventory tools 
                  keep everything current without the busywork.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border rounded-none">
          <CardContent className="pt-6">
            <div className="flex items-start mb-4">
              <div className="bg-muted p-3 rounded-full mr-4">
                <CalendarClock className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Auto-Gift & Scheduling</h3>
                <p className="text-muted-foreground text-sm">
                  Your products are surfaced for automated and scheduled gift deliveries — 
                  recurring revenue without extra effort.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border rounded-none">
          <CardContent className="pt-6">
            <div className="flex items-start mb-4">
              <div className="bg-muted p-3 rounded-full mr-4">
                <BarChart4 className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Real-Time Analytics</h3>
                <p className="text-muted-foreground text-sm">
                  Track views, conversions, and revenue with intuitive dashboards. 
                  See which products land on the most wishlists.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border rounded-none">
          <CardContent className="pt-6">
            <div className="flex items-start mb-4">
              <div className="bg-muted p-3 rounded-full mr-4">
                <BadgeDollarSign className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Flexible Pricing</h3>
                <p className="text-muted-foreground text-sm">
                  Set base prices, run promotions, and create seasonal offers. 
                  Full control over your pricing strategy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border rounded-none">
          <CardContent className="pt-6">
            <div className="flex items-start mb-4">
              <div className="bg-muted p-3 rounded-full mr-4">
                <Zap className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Platform Integrations</h3>
                <p className="text-muted-foreground text-sm">
                  Connect Shopify, WooCommerce, or your existing e-commerce stack. 
                  Automatic inventory syncing keeps everything aligned.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border rounded-none">
          <CardContent className="pt-6">
            <div className="flex items-start mb-4">
              <div className="bg-muted p-3 rounded-full mr-4">
                <LayoutDashboard className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Simple Dashboard</h3>
                <p className="text-muted-foreground text-sm">
                  Built for speed, not complexity. Manage orders, track shipments, 
                  and review performance — no technical expertise needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
