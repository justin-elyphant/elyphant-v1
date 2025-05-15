
import React from "react";
import { Store, Utensils, Shirt, Dumbbell, Paintbrush } from "lucide-react";

export const BusinessTypesSection = () => {
  return (
    <div className="mb-16">
      <h2 className="font-sans text-2xl md:text-3xl font-semibold text-center mb-10">Perfect For All Types of Businesses</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
        <div className="flex flex-col items-center p-4">
          <Store className="h-10 w-10 text-purple-600 mb-2" />
          <span className="font-medium">Retailers</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <Utensils className="h-10 w-10 text-purple-600 mb-2" />
          <span className="font-medium">Restaurants</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <Shirt className="h-10 w-10 text-purple-600 mb-2" />
          <span className="font-medium">Fashion</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <Dumbbell className="h-10 w-10 text-purple-600 mb-2" />
          <span className="font-medium">Sport Shops</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <Paintbrush className="h-10 w-10 text-purple-600 mb-2" />
          <span className="font-medium">Wellness</span>
        </div>
      </div>
    </div>
  );
};
