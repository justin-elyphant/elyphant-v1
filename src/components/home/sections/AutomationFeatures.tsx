import React from "react";
import { Calendar, Clock, Heart } from "lucide-react";
import { motion } from "framer-motion";

const AutomationFeatures = () => {
  const features = [
    {
      icon: Calendar,
      title: "Scheduled Gifts",
      description: "Set up recurring gifts for birthdays, anniversaries, or any special occasion with automated scheduling."
    },
    {
      icon: Clock,
      title: "Hands-Free Delivery",
      description: "Our system automatically handles selection, payment, and delivery so you never miss an important date."
    },
    {
      icon: Heart,
      title: "Perfect Matches",
      description: "Our smart algorithm ensures recipients get exactly what they want from their wishlists."
    }
  ];

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6 text-center">The Power of Automated Gifting</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div 
            key={index}
            className="text-center touch-manipulation"
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <feature.icon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AutomationFeatures;
