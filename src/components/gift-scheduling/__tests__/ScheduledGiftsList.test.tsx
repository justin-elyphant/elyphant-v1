
import React from 'react';
import { render, screen } from '@testing-library/react';
import ScheduledGiftsList from '../ScheduledGiftsList';
import { ScheduledGift } from '@/types/gift-scheduling';

// Mock EmptyStateDisplay component to simplify testing
jest.mock('../EmptyStateDisplay', () => ({
  __esModule: true,
  default: ({ type }: { type: 'upcoming' | 'history' }) => <div data-testid={`empty-${type}`}>Empty {type}</div>
}));

// Mock ScheduledGiftCard component
jest.mock('../ScheduledGiftCard', () => ({
  __esModule: true,
  default: ({ gift }: { gift: ScheduledGift }) => (
    <div data-testid={`gift-card-${gift.id}`}>
      Gift: {gift.productName} for {gift.recipientName}
    </div>
  )
}));

describe('ScheduledGiftsList', () => {
  const mockGifts: ScheduledGift[] = [
    {
      id: '1',
      productName: 'Test Product',
      productImage: 'test-image.jpg',
      recipientName: 'Test Recipient',
      scheduledDate: new Date(2025, 5, 15),
      status: 'scheduled'
    },
    {
      id: '2',
      productName: 'Another Product',
      productImage: 'another-image.jpg',
      recipientName: 'Another Recipient',
      scheduledDate: new Date(2025, 6, 20),
      status: 'sent'
    }
  ];

  it('renders the empty state when no gifts are provided', () => {
    render(<ScheduledGiftsList gifts={[]} type="upcoming" />);
    expect(screen.getByTestId('empty-upcoming')).toBeInTheDocument();
  });

  it('renders the empty state for history when no gifts are provided', () => {
    render(<ScheduledGiftsList gifts={[]} type="history" />);
    expect(screen.getByTestId('empty-history')).toBeInTheDocument();
  });

  it('renders the list of gifts when gifts are provided', () => {
    render(<ScheduledGiftsList gifts={mockGifts} type="upcoming" />);
    
    // We should see both gift cards
    expect(screen.getByTestId('gift-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('gift-card-2')).toBeInTheDocument();
    
    // Check that content is rendered properly
    expect(screen.getByText('Gift: Test Product for Test Recipient')).toBeInTheDocument();
    expect(screen.getByText('Gift: Another Product for Another Recipient')).toBeInTheDocument();
  });
});
