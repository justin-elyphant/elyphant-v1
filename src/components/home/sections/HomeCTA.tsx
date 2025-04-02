
import React from "react";
import { Link } from "react-router-dom";
import { Gift, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/contexts/ProductContext";

const HomeCTA = () => {
  const { products } = useProducts();
  
  // Get up to 4 featured products for display
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="bg-purple-100 rounded-xl p-8 mb-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
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
      
      {featuredProducts.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Featured Products</h3>
            <Link to="/gifting" className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <Link key={product.id} to={`/gifting?product=${product.id}`} className="group">
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeCTA;
