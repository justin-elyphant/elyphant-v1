
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Check, Truck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShippingOptionsFormProps {
  selectedMethod: string;
  onSelect: (method: string) => void;
}

const ShippingOptionsForm: React.FC<ShippingOptionsFormProps> = ({ selectedMethod, onSelect }) => {
  const shippingOptions = [
    {
      id: "standard",
      name: "Standard Shipping",
      icon: Truck,
      price: 4.99,
      delivery: "3-5 business days",
      color: "text-blue-500"
    },
    {
      id: "express",
      name: "Express Shipping",
      icon: Zap,
      price: 12.99,
      delivery: "1-2 business days",
      color: "text-amber-500"
    }
  ];

  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-medium mb-4">Shipping Method</h3>
      
      <div className="space-y-3">
        {shippingOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedMethod === option.id;
          
          return (
            <Card 
              key={option.id}
              className={cn(
                "cursor-pointer transition-all hover:border-gray-400",
                isSelected && "border-2 border-primary"
              )}
              onClick={() => onSelect(option.id)}
            >
              <CardContent className="p-4 flex items-center">
                <div className={cn("p-2 rounded-full mr-3", isSelected ? "bg-primary/10" : "bg-muted")}>
                  <Icon className={cn("h-5 w-5", option.color)} />
                </div>
                
                <div className="flex-grow">
                  <p className="font-medium">{option.name}</p>
                  <p className="text-sm text-muted-foreground">{option.delivery}</p>
                </div>
                
                <div className="text-right">
                  <p className="font-medium">${option.price.toFixed(2)}</p>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary ml-auto" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ShippingOptionsForm;
