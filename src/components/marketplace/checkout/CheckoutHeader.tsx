
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CheckoutHeaderProps {
  title: string;
}

const CheckoutHeader = ({ title }: CheckoutHeaderProps) => {
  return (
    <div className="flex items-center mb-6">
      <Button variant="ghost" className="mr-4" asChild>
        <a href="/cart">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </a>
      </Button>
      <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
    </div>
  );
};

export default CheckoutHeader;
