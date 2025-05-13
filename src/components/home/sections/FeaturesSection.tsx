
import React from "react";
import { Gift, Users, Bell, Star, ShoppingBag, Heart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const Feature: React.FC<FeatureProps> = ({ title, description, icon }) => (
  <div className="flex flex-col items-center md:items-start text-center md:text-left p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="bg-purple-100 p-3 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const FeaturesSection = () => {
  const isMobile = useIsMobile();
  
  const features = [
    {
      title: "Smart Wishlists",
      description: "Create and share detailed wishlists with friends and family for any occasion.",
      icon: <Gift className="h-6 w-6 text-purple-600" />
    },
    {
      title: "Gift Recommendations",
      description: "Get AI-powered gift suggestions based on interests, past preferences, and occasion.",
      icon: <Star className="h-6 w-6 text-purple-600" />
    },
    {
      title: "Event Reminders",
      description: "Never miss important dates with automated reminders for birthdays and special events.",
      icon: <Bell className="h-6 w-6 text-purple-600" />
    },
    {
      title: "Friend Connections",
      description: "Connect with friends and family to share wishlists and gift preferences easily.",
      icon: <Users className="h-6 w-6 text-purple-600" />
    },
    {
      title: "Gift Marketplace",
      description: "Browse curated selections of unique gifts from our trusted partner stores.",
      icon: <ShoppingBag className="h-6 w-6 text-purple-600" />
    },
    {
      title: "Preference Learning",
      description: "Our system learns your gift preferences over time for better recommendations.",
      icon: <Heart className="h-6 w-6 text-purple-600" />
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Features You'll Love</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our platform makes gift-giving meaningful, personal, and stress-free.
          </p>
        </div>
        
        <div className={`grid grid-cols-1 ${isMobile ? "md:grid-cols-2" : "md:grid-cols-3"} gap-6`}>
          {features.map((feature, index) => (
            <Feature 
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
