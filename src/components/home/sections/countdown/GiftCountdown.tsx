
import React, { useState } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { generateDynamicButtonText, generateSearchQuery } from '@/components/marketplace/utils/buttonTextUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { getAlternativeHolidays, GiftOccasion } from '@/components/marketplace/utils/upcomingOccasions';

interface GiftCountdownProps {
  event: {
    name: string;
    date: Date;
    type: string;
    personName?: string;
    personId?: string;
    personImage?: string;
  };
  friendOccasions?: GiftOccasion[];
}

const GiftCountdown: React.FC<GiftCountdownProps> = ({ event, friendOccasions }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedVariant, setSelectedVariant] = useState<'primary' | 'alternative' | 'connection'>('primary');
  
  // Get alternative holidays if available
  const alternatives = getAlternativeHolidays(event.name);
  const hasAlternatives = alternatives.length > 0;

  // Get the closest friend event (if any)
  const closestFriendEvent = friendOccasions && friendOccasions.length > 0
    ? [...friendOccasions].sort((a, b) => a.date.getTime() - b.date.getTime())[0]
    : null;

  // Determine current display based on selection
  const getCurrentEvent = () => {
    if (selectedVariant === 'connection' && closestFriendEvent) {
      return {
        name: `${closestFriendEvent.personName}'s ${closestFriendEvent.type === 'birthday' ? 'Birthday' : 'Anniversary'}`,
        date: closestFriendEvent.date,
        type: closestFriendEvent.type,
        personName: closestFriendEvent.personName,
        personId: closestFriendEvent.personId,
      };
    }
    if (selectedVariant === 'alternative' && hasAlternatives) {
      return { ...event, name: alternatives[0].name };
    }
    return event;
  };

  const currentEvent = getCurrentEvent();
  const now = new Date();
  const days = differenceInDays(currentEvent.date, now);
  const hours = differenceInHours(currentEvent.date, now) % 24;
  const minutes = differenceInMinutes(currentEvent.date, now) % 60;

  // Generate dynamic button text using existing utility
  const buttonText = generateDynamicButtonText(currentEvent, true, currentEvent.personName);
  
  // Handle marketplace navigation with wishlist-first logic for friend events
  const handleShopGifts = () => {
    if (selectedVariant === 'connection' && closestFriendEvent) {
      // Navigate with personId for wishlist-first logic
      const searchTerm = `${closestFriendEvent.type} gift`;
      const encodedQuery = encodeURIComponent(searchTerm);
      navigate(`/marketplace?search=${encodedQuery}&personId=${closestFriendEvent.personId}`);
      return;
    }

    const searchTerm = selectedVariant === 'alternative' && hasAlternatives
      ? alternatives[0].searchTerm
      : event.type === 'holiday' ? event.name.toLowerCase().replace(' gifts', '') + ' gifts' : generateSearchQuery(event, event.personName);
    
    // For friend events, include personId to trigger wishlist-first logic
    if (event.personId && event.personName) {
      const encodedQuery = encodeURIComponent(searchTerm);
      navigate(`/marketplace?search=${encodedQuery}&personId=${event.personId}`);
    } else {
      // For holidays or generic events, use standard search
      const encodedQuery = encodeURIComponent(searchTerm);
      navigate(`/marketplace?search=${encodedQuery}`);
    }
  };

  // Dot toggle component
  const DotToggle = ({ className = '' }: { className?: string }) => {
    const showAlternativeHoliday = hasAlternatives;
    const showConnectionEvent = !!closestFriendEvent;
    
    if (!showAlternativeHoliday && !showConnectionEvent) return null;
    
    return (
      <div className={`flex justify-center gap-2 ${className}`}>
        {/* Dot 1: Primary Holiday */}
        <button
          onClick={() => setSelectedVariant('primary')}
          className={`w-2 h-2 rounded-full transition-all ${
            selectedVariant === 'primary' 
              ? 'bg-white' 
              : 'bg-transparent border border-white/50'
          }`}
          aria-label={event.name}
        />
        
        {/* Dot 2: Alternative Holiday (Hanukkah) - only if available */}
        {showAlternativeHoliday && (
          <button
            onClick={() => setSelectedVariant('alternative')}
            className={`w-2 h-2 rounded-full transition-all ${
              selectedVariant === 'alternative' 
                ? 'bg-white' 
                : 'bg-transparent border border-white/50'
            }`}
            aria-label={alternatives[0]?.name}
          />
        )}
        
        {/* Dot 3: Connection Event - only if user has upcoming friend events */}
        {showConnectionEvent && (
          <button
            onClick={() => setSelectedVariant('connection')}
            className={`w-2 h-2 rounded-full transition-all ${
              selectedVariant === 'connection' 
                ? 'bg-white' 
                : 'bg-transparent border border-white/50'
            }`}
            aria-label={closestFriendEvent?.personName}
          />
        )}
      </div>
    );
  };

  // Mobile compact banner
  if (isMobile) {
    return (
      <div className="bg-white/10 backdrop-blur-sm text-white border-b border-white/20 px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold truncate max-w-[140px]">{currentEvent.name}</span>
            <span>•</span>
            <span>{days} days</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-900 bg-white/90 border-white/40 hover:bg-white hover:text-gray-900 text-xs px-3 py-1"
              onClick={handleShopGifts}
            >
              Shop Gifts
            </Button>
            <DotToggle />
          </div>
        </div>
      </div>
    );
  }

  // Desktop card layout
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white border border-white/20">
      <h3 className="text-sm font-medium mb-2 truncate">{currentEvent.name} Countdown</h3>
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
      
      {/* Pure dot toggle */}
      <DotToggle className="mt-3" />
    </div>
  );
};

export default GiftCountdown;
