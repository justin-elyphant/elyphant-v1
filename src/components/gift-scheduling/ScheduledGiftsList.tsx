
import React from 'react';
import { ScheduledGift } from "@/types/gift-scheduling";
import ScheduledGiftCard from "./ScheduledGiftCard";
import EmptyStateDisplay from "./EmptyStateDisplay";
import { useNicoleExecutions } from "@/hooks/useNicoleExecutions";
import { transformAutoGiftProducts } from "@/utils/productDataTransforms";

interface ScheduledGiftsListProps {
  gifts: ScheduledGift[];
  type: 'upcoming' | 'history';
}

const ScheduledGiftsList: React.FC<ScheduledGiftsListProps> = ({ gifts, type }) => {
  const { executions } = useNicoleExecutions();

  if (gifts.length === 0) {
    return <EmptyStateDisplay type={type} />;
  }

  // Helper function to find Nicole attribution for a gift
  const getNicoleAttribution = (giftId: string) => {
    const execution = executions.find(exec => {
      // Transform products to ensure proper structure before checking
      const products = transformAutoGiftProducts(exec);
      return products.some((product: any) => product.id === giftId || product.product_id === giftId);
    });
    return execution?.ai_agent_source;
  };
  
  return (
    <div className="space-y-4">
      {gifts.map((gift) => (
        <ScheduledGiftCard 
          key={gift.id} 
          gift={gift} 
          showActions={type === 'upcoming'}
          nicoleAttribution={getNicoleAttribution(gift.id)}
        />
      ))}
    </div>
  );
};

export default ScheduledGiftsList;
