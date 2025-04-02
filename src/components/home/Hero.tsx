
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Gift, ShoppingBag } from "lucide-react";

const Hero = () => {
  return (
    <div className="bg-gradient-to-r from-purple-100 to-purple-200 py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="text-4xl font-bold mb-4">The Future of Gifting is Automated</h2>
            <p className="text-xl text-gray-700 mb-6">
              Create wishlists, automate gift-giving, and never miss 
              an important celebration again. Our platform handles everything from selection to delivery.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
                <Link to="/gifting">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Start Gifting
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/gifting">
                  <Gift className="mr-2 h-5 w-5" />
                  Create Wishlist
                </Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-end">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1500673922987-e212871fec22" 
                alt="Easter Celebrations" 
                className="rounded-lg shadow-lg max-w-full h-auto"
              />
              <div className="absolute bottom-4 right-4 bg-white bg-opacity-80 rounded-lg px-3 py-2 text-sm font-medium text-purple-800 shadow-sm">
                Easter Gifts & Celebrations
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
