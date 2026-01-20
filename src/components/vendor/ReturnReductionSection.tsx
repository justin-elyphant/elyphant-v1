import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, DollarSign, ShoppingCart, Target } from "lucide-react";

export const ReturnReductionSection = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-red-50 to-orange-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            The $850 Billion Problem We're Solving Together
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Returns are crushing retail margins. Elyphant's wishlist technology helps retailers 
            dramatically reduce returns while increasing customer satisfaction.
          </p>
        </div>

        {/* Crisis Stats */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12 border-l-4 border-red-500">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">$850B</div>
              <div className="text-gray-700">Total US returns in 2025</div>
              <div className="text-sm text-gray-500 mt-1">Source: NRF 2025</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">15.8%</div>
              <div className="text-gray-700">Average return rate</div>
              <div className="text-sm text-gray-500 mt-1">Nearly 1 in 6 purchases</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">25%+</div>
              <div className="text-gray-700">Gift return rate</div>
              <div className="text-sm text-gray-500 mt-1">Even higher during holidays</div>
            </div>
          </div>
        </div>

        {/* Solution Benefits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <TrendingDown className="mx-auto mb-4 h-12 w-12 text-green-600" />
              <h3 className="text-lg font-semibold mb-2 text-green-800">
                80% Fewer Returns
              </h3>
              <p className="text-green-700 text-sm">
                Our wishlist technology ensures customers get exactly what they want, 
                dramatically reducing return rates.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6 text-center">
              <DollarSign className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2 text-blue-800">
                Higher Margins
              </h3>
              <p className="text-blue-700 text-sm">
                Reduce processing costs, restocking fees, and inventory write-offs 
                from returned merchandise.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="pt-6 text-center">
              <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-purple-600" />
              <h3 className="text-lg font-semibold mb-2 text-purple-800">
                Increased Sales
              </h3>
              <p className="text-purple-700 text-sm">
                Customers are more likely to complete purchases when they know 
                recipients actually want the items.
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6 text-center">
              <Target className="mx-auto mb-4 h-12 w-12 text-orange-600" />
              <h3 className="text-lg font-semibold mb-2 text-orange-800">
                Better Targeting
              </h3>
              <p className="text-orange-700 text-sm">
                Access rich preference data to understand what customers 
                actually want before they buy.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Turn the Returns Crisis Into Your Competitive Advantage
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Join retailers who are already reducing returns and increasing customer satisfaction 
              with Elyphant's intelligent wishlist platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="text-sm opacity-75">
                ✓ No upfront costs  ✓ Easy integration  ✓ Proven results
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};