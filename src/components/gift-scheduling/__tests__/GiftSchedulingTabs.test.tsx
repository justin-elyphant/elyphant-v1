
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GiftSchedulingTabs from '../GiftSchedulingTabs';
import { ScheduledGift } from '@/types/gift-scheduling';

// Mock ScheduledGiftsList component
jest.mock('../ScheduledGiftsList', () => ({
  __esModule: true,
  default: ({ gifts, type }: { gifts: ScheduledGift[], type: 'upcoming' | 'history' }) => (
    <div data-testid={`gifts-list-${type}`}>
      {gifts.length} gifts for {type}
    </div>
  )
}));

describe('GiftSchedulingTabs', () => {
  const upcomingGifts: ScheduledGift[] = [
    {
      id: '1',
      productName: 'Test Product',
      productImage: 'test-image.jpg',
      recipientName: 'Test Recipient',
      scheduledDate: new Date(2025, 5, 15),
      status: 'scheduled'
    }
  ];
  
  const pastGifts: ScheduledGift[] = [
    {
      id: '2',
      productName: 'Past Product',
      productImage: 'past-image.jpg',
      recipientName: 'Past Recipient',
      scheduledDate: new Date(2024, 5, 15),
      status: 'sent'
    }
  ];
  
  const mockSetSelectedTab = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upcoming tab content by default', () => {
    render(
      <GiftSchedulingTabs 
        upcomingGifts={upcomingGifts}
        pastGifts={pastGifts}
        selectedTab="upcoming"
        setSelectedTab={mockSetSelectedTab}
      />
    );
    
    expect(screen.getByTestId('gifts-list-upcoming')).toBeInTheDocument();
    expect(screen.queryByTestId('gifts-list-history')).not.toBeInTheDocument();
    
    // Check that tab labels show correct counts
    expect(screen.getByText('Upcoming (1)')).toBeInTheDocument();
    expect(screen.getByText('History (1)')).toBeInTheDocument();
  });

  it('renders history tab content when selected', () => {
    render(
      <GiftSchedulingTabs 
        upcomingGifts={upcomingGifts}
        pastGifts={pastGifts}
        selectedTab="history"
        setSelectedTab={mockSetSelectedTab}
      />
    );
    
    expect(screen.queryByTestId('gifts-list-upcoming')).not.toBeInTheDocument();
    expect(screen.getByTestId('gifts-list-history')).toBeInTheDocument();
  });

  it('calls setSelectedTab when a tab is clicked', () => {
    render(
      <GiftSchedulingTabs 
        upcomingGifts={upcomingGifts}
        pastGifts={pastGifts}
        selectedTab="upcoming"
        setSelectedTab={mockSetSelectedTab}
      />
    );
    
    fireEvent.click(screen.getByText('History (1)'));
    expect(mockSetSelectedTab).toHaveBeenCalledWith('history');
  });
});
