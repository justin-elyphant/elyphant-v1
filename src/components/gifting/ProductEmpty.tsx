
import React from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProductEmpty: React.FC = () => {
  return (
    <div className="text-center py-12">
      <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-xl font-medium mb-2">No products available</h3>
      <p className="text-muted-foreground mb-6">
        Connect your Shopify store in the Vendor Management section to import products.
      </p>
      <Button asChild>
        <a href="/vendor-management">Go to Vendor Management</a>
      </Button>
    </div>
  );
};

export default ProductEmpty;
