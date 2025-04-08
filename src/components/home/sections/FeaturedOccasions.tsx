
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Calendar, Heart, GraduationCap, Baby, PartyPopper } from "lucide-react";

const occasions = [
  {
    id: 1,
    name: "Birthdays",
    icon: <PartyPopper className="h-6 w-6 text-blue-500" />,
    description: "Find the perfect birthday gifts",
    url: "/marketplace?category=birthday",
    color: "bg-blue-50 border-blue-200",
    cta: "Gifts for Birthdays"
  },
  {
    id: 2,
    name: "Weddings",
    icon: <Heart className="h-6 w-6 text-pink-500" />,
    description: "Celebrate special unions",
    url: "/marketplace?category=wedding",
    color: "bg-pink-50 border-pink-200",
    cta: "Wedding Gift Ideas"
  },
  {
    id: 3,
    name: "Anniversaries",
    icon: <Calendar className="h-6 w-6 text-purple-500" />,
    description: "Commemorate years together",
    url: "/marketplace?category=anniversary",
    color: "bg-purple-50 border-purple-200",
    cta: "Anniversary Gifts"
  },
  {
    id: 4,
    name: "Graduations",
    icon: <GraduationCap className="h-6 w-6 text-green-500" />,
    description: "Celebrate academic achievements",
    url: "/marketplace?category=graduation",
    color: "bg-green-50 border-green-200",
    cta: "Graduation Gift Ideas"
  },
  {
    id: 5,
    name: "Baby Showers",
    icon: <Baby className="h-6 w-6 text-yellow-500" />,
    description: "Welcome new arrivals",
    url: "/marketplace?category=baby_shower",
    color: "bg-yellow-50 border-yellow-200",
    cta: "Baby Shower Gifts"
  },
  {
    id: 6,
    name: "All Occasions",
    icon: <Gift className="h-6 w-6 text-teal-500" />,
    description: "Explore gifts for any event",
    url: "/marketplace",
    color: "bg-teal-50 border-teal-200",
    cta: "Browse All Gift Ideas"
  },
];

const FeaturedOccasions = () => {
  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Featured Occasions</h2>
        <Link to="/marketplace" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
          View all categories
        </Link>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {occasions.map((occasion) => (
          <Link to={occasion.url} key={occasion.id}>
            <Card className={`h-full hover:shadow-md transition-shadow border ${occasion.color}`}>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="rounded-full p-3 bg-white shadow-sm mb-3">
                  {occasion.icon}
                </div>
                <h3 className="font-medium">{occasion.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{occasion.description}</p>
                <span className="text-xs font-medium text-purple-600 hover:text-purple-800 mt-2">
                  {occasion.cta}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedOccasions;
