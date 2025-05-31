
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CheckoutHeaderProps {
  title: string;
}

const CheckoutHeader = ({ title }: CheckoutHeaderProps) => {
  return (
    <div className="mb-6">
      <div className="flex justify-start mb-4">
        <Button variant="outline" size="sm" asChild>
          <a href="/cart" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </a>
        </Button>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-left">{title}</h1>
    </div>
  );
};

export default CheckoutHeader;
