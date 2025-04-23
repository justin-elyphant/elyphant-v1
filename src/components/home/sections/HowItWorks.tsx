
import React from "react";
import { Target, Clock, Package } from "lucide-react";

interface FeatureStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const HowItWorksSection = () => {
  const features: FeatureStep[] = [
    {
      icon: <Target className="h-10 w-10 text-purple-600" />,
      title: "Smart Matching",
      description: "We suggest gifts based on their style, interests, and wishlist items"
    },
    {
      icon: <Clock className="h-10 w-10 text-purple-600" />,
      title: "Auto Timing",
      description: "Never miss a birthday or celebration again — we'll handle the timing"
    },
    {
      icon: <Package className="h-10 w-10 text-purple-600" />,
      title: "Effortless Delivery",
      description: "Physical, digital, or redeemable — we get the gift there, on time"
    }
  ];
  
  return (
    <div className="py-16 bg-white">
      <div className="container px-4">
        <h2 className="text-3xl font-bold mb-3 text-center">How Elyphant Works</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Our automated gifting platform takes care of every step in the gifting process, making it simple to send the perfect gift every time.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="rounded-full bg-purple-100 p-4 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection;
