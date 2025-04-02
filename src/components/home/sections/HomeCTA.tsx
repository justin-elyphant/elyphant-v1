
import React from "react";
import { Link } from "react-router-dom";
import { Gift, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

const HomeCTA = () => {
  return (
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
  );
};

export default HomeCTA;
