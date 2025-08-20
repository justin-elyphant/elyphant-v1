
import React from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { generateDynamicButtonText, generateSearchQuery } from '@/components/marketplace/utils/buttonTextUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface GiftCountdownProps {
  event: {
    name: string;
    date: Date;
    type: string;
    personName?: string;  // For friend events
    personId?: string;    // For friend events  
    personImage?: string; // For friend events
  };
}

const GiftCountdown: React.FC<GiftCountdownProps> = ({ event }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const now = new Date();
  const days = differenceInDays(event.date, now);
  const hours = differenceInHours(event.date, now) % 24;
  const minutes = differenceInMinutes(event.date, now) % 60;

  // Generate dynamic button text using existing utility
  const buttonText = generateDynamicButtonText(event, true, event.personName);
  
  // Handle marketplace navigation with wishlist-first logic for friend events
  const handleShopGifts = () => {
    const searchQuery = generateSearchQuery(event, event.personName);
    
    // For friend events, include personId to trigger wishlist-first logic
    if (event.personId && event.personName) {
      const encodedQuery = encodeURIComponent(searchQuery);
      navigate(`/marketplace?search=${encodedQuery}&personId=${event.personId}`);
    } else {
      // For holidays or generic events, use standard search
      const encodedQuery = encodeURIComponent(searchQuery);
      navigate(`/marketplace?search=${encodedQuery}`);
    }
  };

  // Mobile compact banner
  if (isMobile) {
    return (
      <div className="bg-white/10 backdrop-blur-sm text-white border-b border-white/20 px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold">{event.name}</span>
            <span>•</span>
            <span>{days} days</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-gray-900 bg-white/90 border-white/40 hover:bg-white hover:text-gray-900 text-xs px-3 py-1"
            onClick={handleShopGifts}
          >
            Shop Gifts
          </Button>
        </div>
      </div>
    );
  }

  // Desktop card layout
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white border border-white/20">
      <h3 className="text-sm font-medium mb-2">{event.name} Countdown</h3>
      <div className="flex gap-4 mb-3">
        <div>
          <span className="text-2xl font-bold">{days}</span>
          <span className="text-xs block">days</span>
        </div>
        <div>
          <span className="text-2xl font-bold">{hours}</span>
          <span className="text-xs block">hours</span>
        </div>
        <div>
          <span className="text-2xl font-bold">{minutes}</span>
          <span className="text-xs block">mins</span>
        </div>
      </div>
      
      {/* Connection-aware shop button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-gray-900 bg-white/90 border-white/40 hover:bg-white hover:text-gray-900 text-xs"
        onClick={handleShopGifts}
      >
        {buttonText}
      </Button>
    </div>
  );
};

export default GiftCountdown;
