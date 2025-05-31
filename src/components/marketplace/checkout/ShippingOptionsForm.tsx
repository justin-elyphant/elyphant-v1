
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Check, Truck, Zap, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShippingOption } from "@/components/marketplace/zinc/services/shippingQuoteService";

interface ShippingOptionsFormProps {
  selectedMethod: string;
  onSelect: (method: string) => void;
  shippingOptions: ShippingOption[];
  isLoading: boolean;
}

const ShippingOptionsForm: React.FC<ShippingOptionsFormProps> = ({ 
  selectedMethod, 
  onSelect, 
  shippingOptions,
  isLoading 
}) => {
  const getShippingIcon = (optionId: string) => {
    if (optionId.includes('prime')) return Crown;
    if (optionId.includes('expedited') || optionId.includes('express')) return Zap;
    return Truck;
  };

  const getIconColor = (optionId: string) => {
    if (optionId.includes('prime')) return "text-yellow-600";
    if (optionId.includes('expedited') || optionId.includes('express')) return "text-amber-500";
    return "text-blue-500";
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-medium mb-4">Shipping Method</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading shipping options...</span>
        </div>
      </div>
    );
  }

  if (shippingOptions.length === 0) {
    return (
      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-medium mb-4">Shipping Method</h3>
        <div className="text-center py-8 text-muted-foreground">
          <p>Please complete your shipping address to see available options</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-medium mb-4">Shipping Method</h3>
      
      <div className="space-y-3">
        {shippingOptions.map((option) => {
          const Icon = getShippingIcon(option.id);
          const iconColor = getIconColor(option.id);
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
                  <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                
                <div className="flex-grow">
                  <p className="font-medium">{option.name}</p>
                  <p className="text-sm text-muted-foreground">{option.delivery_time}</p>
                  {option.description && (
                    <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="font-medium">
                    {option.price === 0 ? "FREE" : `$${option.price.toFixed(2)}`}
                  </p>
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
