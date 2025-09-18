import React from "react";
import { Heart, Sparkles, Users, Calendar, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PersonalizedHeroStatsProps {
  recipientName: string;
  eventType?: string;
  relationship?: string;
  productCount: number;
  isDesktop: boolean;
}

const PersonalizedHeroStats: React.FC<PersonalizedHeroStatsProps> = ({
  recipientName,
  eventType,
  relationship,
  productCount,
  isDesktop
}) => {
  if (!isDesktop) return null;

  const stats = [
    {
      icon: Heart,
      label: "Curated for",
      value: recipientName,
      color: "text-red-500"
    },
    {
      icon: Calendar,
      label: "Occasion", 
      value: eventType || "Special Day",
      color: "text-blue-500"
    },
    {
      icon: Users,
      label: "Relationship",
      value: relationship || "Friend",
      color: "text-green-500"
    },
    {
      icon: Sparkles,
      label: "AI Recommendations",
      value: `${productCount} items`,
      color: "text-purple-500"
    }
  ];

  return (
    <div className="hidden lg:block mt-8">
      <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-center p-4">
            <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
            <div className="text-xs text-white/70 mb-1">{stat.label}</div>
            <div className="text-sm font-semibold text-white truncate">{stat.value}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PersonalizedHeroStats;