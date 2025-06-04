
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Heart, Users, ShoppingCart, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface NextStepsStepProps {
  onSelectOption: (option: string) => void;
  selectedOption: string;
}

const options = [
  {
    id: "create_wishlist",
    title: "Create your wishlist",
    description: "Add items you'd love to receive as gifts",
    icon: Gift,
    color: "bg-blue-100 text-blue-600"
  },
  {
    id: "find_friends",
    title: "Connect with friends",
    description: "Find friends and family to share wishlists with",
    icon: Users,
    color: "bg-purple-100 text-purple-600"
  },
  {
    id: "shop_gifts",
    title: "Shop for gifts",
    description: "Find the perfect gifts for your loved ones",
    icon: ShoppingCart,
    color: "bg-green-100 text-green-600"
  },
  {
    id: "explore_marketplace",
    title: "Explore marketplace",
    description: "Discover trending and popular gift ideas",
    icon: Search,
    color: "bg-amber-100 text-amber-600"
  },
  {
    id: "dashboard",
    title: "Go to dashboard",
    description: "View your personalized dashboard",
    icon: Heart,
    color: "bg-red-100 text-red-600"
  }
];

const NextStepsStep: React.FC<NextStepsStepProps> = ({ onSelectOption, selectedOption }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">What would you like to do next?</h3>
        <p className="text-sm text-muted-foreground">
          Your profile is almost complete! Choose what you'd like to do next.
        </p>
      </div>
      
      <div className="grid gap-4">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedOption === option.id;
          
          return (
            <Card 
              key={option.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected ? "ring-2 ring-primary ring-offset-2" : ""
              )}
              onClick={() => onSelectOption(option.id)}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className={cn("p-2 rounded-full", option.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">{option.title}</h4>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default NextStepsStep;
