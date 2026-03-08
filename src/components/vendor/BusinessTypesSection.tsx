
import React from "react";
import { Store, Utensils, Shirt, Dumbbell, Paintbrush } from "lucide-react";

export const BusinessTypesSection = () => {
  return (
    <div className="mb-24">
      <h2 className="font-sans text-2xl md:text-3xl font-bold text-center mb-12 text-foreground tracking-tight">
        Perfect for All Types of Businesses
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
        <div className="flex flex-col items-center p-4">
          <Store className="h-10 w-10 text-foreground mb-3" />
          <span className="font-medium text-foreground">Retailers</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <Utensils className="h-10 w-10 text-foreground mb-3" />
          <span className="font-medium text-foreground">Restaurants</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <Shirt className="h-10 w-10 text-foreground mb-3" />
          <span className="font-medium text-foreground">Fashion</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <Dumbbell className="h-10 w-10 text-foreground mb-3" />
          <span className="font-medium text-foreground">Sport Shops</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <Paintbrush className="h-10 w-10 text-foreground mb-3" />
          <span className="font-medium text-foreground">Wellness</span>
        </div>
      </div>
    </div>
  );
};
