import React from 'react';
import { Button } from '@/components/ui/button';
import { Gift, ShoppingCart, List, Sparkles } from 'lucide-react';

interface CTAData {
  type: 'auto_gift_setup' | 'gift_recommendations' | 'wishlist_creation';
  label: string;
  recipientName?: string;
  occasion?: string;
  budgetRange?: [number, number];
  confidence?: number;
}

interface NicoleCTAButtonsProps {
  ctaData: CTAData;
  onCTAClick: (cta: CTAData) => void;
}

const getIconForCTAType = (type: CTAData['type']) => {
  switch (type) {
    case 'auto_gift_setup':
      return Gift;
    case 'gift_recommendations':
      return ShoppingCart;
    case 'wishlist_creation':
      return List;
    default:
      return Sparkles;
  }
};

const getVariantForCTAType = (type: CTAData['type']) => {
  switch (type) {
    case 'auto_gift_setup':
      return 'default' as const;
    case 'gift_recommendations':
      return 'outline' as const;
    case 'wishlist_creation':
      return 'outline' as const;
    default:
      return 'default' as const;
  }
};

export const NicoleCTAButtons: React.FC<NicoleCTAButtonsProps> = ({
  ctaData,
  onCTAClick,
}) => {
  const Icon = getIconForCTAType(ctaData.type);
  const variant = getVariantForCTAType(ctaData.type);

  return (
    <div className="flex flex-col gap-2 mt-3 animate-in slide-in-from-bottom-2 duration-300">
      <Button
        onClick={() => onCTAClick(ctaData)}
        variant={variant}
        size="sm"
        className="bg-elyphant-gradient text-white shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-200 rounded-full px-4 py-2 text-sm font-medium"
      >
        <Icon className="w-4 h-4 mr-2" />
        {ctaData.label}
        <Sparkles className="w-3 h-3 ml-2" />
      </Button>
      
      {ctaData.budgetRange && (
        <div className="text-xs text-muted-foreground text-center">
          Budget: ${ctaData.budgetRange[0]} - ${ctaData.budgetRange[1]}
        </div>
      )}
    </div>
  );
};