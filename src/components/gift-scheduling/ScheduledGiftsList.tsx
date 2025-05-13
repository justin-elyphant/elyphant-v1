
import React from 'react';
import { ScheduledGift } from "@/types/gift-scheduling";
import ScheduledGiftCard from "./ScheduledGiftCard";
import EmptyStateDisplay from "./EmptyStateDisplay";

interface ScheduledGiftsListProps {
  gifts: ScheduledGift[];
  type: 'upcoming' | 'history';
}

const ScheduledGiftsList: React.FC<ScheduledGiftsListProps> = ({ gifts, type }) => {
  if (gifts.length === 0) {
    return <EmptyStateDisplay type={type} />;
  }
  
  return (
    <div className="space-y-4">
      {gifts.map((gift) => (
        <ScheduledGiftCard 
          key={gift.id} 
          gift={gift} 
          showActions={type === 'upcoming'}
        />
      ))}
    </div>
  );
};

export default ScheduledGiftsList;
