
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, BarChart, Wallet } from "lucide-react";

export const BenefitsSection = () => {
  return (
    <div className="grid md:grid-cols-3 gap-8 mb-16">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <Globe className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold">Expand Your Reach</h3>
          </div>
          <p className="text-gray-600">
            Access our growing network of gift-givers looking for unique products from businesses like yours.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <BarChart className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold">Boost Your Sales</h3>
          </div>
          <p className="text-gray-600">
            Our gift recommendation engine promotes your products to the perfect customers at the right time.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <Wallet className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold">Simple Revenue Model</h3>
          </div>
          <p className="text-gray-600">
            We handle the customer experience while you focus on your products, with a straightforward 30% marketplace fee.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
