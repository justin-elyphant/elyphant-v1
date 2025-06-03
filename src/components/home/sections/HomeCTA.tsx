
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, List } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/auth";

const HomeCTA = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  return (
    <section className="bg-gradient-to-r from-purple-600 to-indigo-600 py-16 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Gift className={`mx-auto ${isMobile ? "h-12 w-12" : "h-16 w-16"} opacity-75 mb-6`} />
          
          <h2 className={`${isMobile ? "text-2xl" : "text-4xl"} font-bold mb-4`}>
            Ready to Transform Your Gift-Giving Experience?
          </h2>
          
          <p className="text-lg opacity-90 mb-8">
            Join thousands of users who have made gifting meaningful, personal, and stress-free.
          </p>
          
          {user ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                asChild
                size={isMobile ? "default" : "lg"}
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
              >
                <Link to="/marketplace?search=gift ideas">
                  <Gift className="mr-2 h-5 w-5" />
                  Find Perfect Gifts
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size={isMobile ? "default" : "lg"}
                className="border-white text-purple-600 hover:bg-white/10 font-semibold"
              >
                <Link to="/wishlists">
                  <List className="mr-2 h-5 w-5" />
                  Create a Wishlist
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button
                asChild
                size={isMobile ? "default" : "lg"}
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
              >
                <Link to="/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeCTA;
