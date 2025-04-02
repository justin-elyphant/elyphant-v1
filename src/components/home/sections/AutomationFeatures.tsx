
import React from "react";
import { Calendar, Clock, Heart } from "lucide-react";

const AutomationFeatures = () => {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6 text-center">The Power of Automated Gifting</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-7 w-7 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold mb-2">Scheduled Gifts</h3>
          <p className="text-muted-foreground">
            Set up recurring gifts for birthdays, anniversaries, or any special occasion with automated scheduling.
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-7 w-7 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold mb-2">Hands-Free Delivery</h3>
          <p className="text-muted-foreground">
            Our system automatically handles selection, payment, and delivery so you never miss an important date.
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Heart className="h-7 w-7 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold mb-2">Perfect Matches</h3>
          <p className="text-muted-foreground">
            Our smart algorithm ensures recipients get exactly what they want from their wishlists.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AutomationFeatures;
