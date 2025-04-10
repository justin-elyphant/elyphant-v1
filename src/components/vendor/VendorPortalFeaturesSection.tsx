
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, ShoppingBag, BadgeDollarSign, BarChart4, Truck, Zap } from "lucide-react";

export const VendorPortalFeaturesSection = () => {
  return (
    <div className="mb-16">
      <h2 className="text-3xl font-bold text-center mb-4">A Complete Vendor Platform</h2>
      <p className="text-lg text-gray-600 text-center mb-10 max-w-3xl mx-auto">
        Our vendor portal gives you powerful tools to manage your products, 
        track performance, and grow your business effortlessly.
      </p>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start mb-4">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Seamless Product Management</h3>
                <p className="text-gray-600">
                  Upload your entire catalog in minutes or add products individually. 
                  Bulk editing tools make inventory management simple.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start mb-4">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <BadgeDollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Flexible Pricing Controls</h3>
                <p className="text-gray-600">
                  Set your base prices and control promotions directly. Create special 
                  offers and seasonal discounts with just a few clicks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start mb-4">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <BarChart4 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
                <p className="text-gray-600">
                  Track product performance, customer trends, and revenue with 
                  our intuitive dashboards and detailed reports.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start mb-4">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Streamlined Fulfillment</h3>
                <p className="text-gray-600">
                  Receive order notifications instantly and manage shipping with our 
                  integrated fulfillment tools and shipping label generation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start mb-4">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Automated Integrations</h3>
                <p className="text-gray-600">
                  Connect with Shopify, WooCommerce, or any e-commerce platform you already use.
                  Automatic inventory syncing keeps everything up to date.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start mb-4">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <LayoutDashboard className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Intuitive Dashboard</h3>
                <p className="text-gray-600">
                  Our user-friendly interface makes management simple. Get started in 
                  minutes with no technical expertise required.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
