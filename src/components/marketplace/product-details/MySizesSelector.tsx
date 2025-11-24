import React from "react";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface MySizesSelectorProps {
  userSizes: {
    tops?: string;
    bottoms?: string;
    shoes?: string;
    ring?: string;
    fitPreference?: string;
  };
  selectedSize: string | null;
  onSizeChange: (size: string) => void;
  productCategory?: string;
}

const MySizesSelector: React.FC<MySizesSelectorProps> = ({ 
  userSizes, 
  selectedSize, 
  onSizeChange,
  productCategory 
}) => {
  // Determine which size type to show based on product category
  const getSizeOptions = () => {
    if (!productCategory) return null;
    
    const category = productCategory.toLowerCase();
    
    if (category.includes('shirt') || category.includes('top') || category.includes('jacket')) {
      return userSizes.tops ? [userSizes.tops] : null;
    }
    
    if (category.includes('pant') || category.includes('jean') || category.includes('bottom')) {
      return userSizes.bottoms ? [userSizes.bottoms] : null;
    }
    
    if (category.includes('shoe') || category.includes('sneaker') || category.includes('boot')) {
      return userSizes.shoes ? [userSizes.shoes] : null;
    }
    
    if (category.includes('ring')) {
      return userSizes.ring ? [userSizes.ring] : null;
    }
    
    return null;
  };
  
  const sizeOptions = getSizeOptions();
  
  if (!sizeOptions) return null;
  
  return (
    <div className="p-4 bg-muted border border-border rounded-lg">
      <div className="flex items-start gap-2 mb-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Your Saved Size: {sizeOptions[0]}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            From your profile settings
          </p>
        </div>
      </div>
      
      <Button 
        size="sm"
        variant="outline"
        className="w-full"
        onClick={() => onSizeChange(sizeOptions[0])}
      >
        Use My Size ({sizeOptions[0]})
      </Button>
    </div>
  );
};

export default MySizesSelector;
