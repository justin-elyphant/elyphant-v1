
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ScheduledGiftCard from '../ScheduledGiftCard';
import { format } from 'date-fns';
import '@testing-library/jest-dom'; // Add this to access toHaveAttribute matcher

describe('ScheduledGiftCard', () => {
  const mockGift = {
    id: '1',
    productName: 'Leather Wallet',
    productImage: 'wallet.jpg',
    recipientName: 'John Doe',
    scheduledDate: new Date(2025, 11, 25),
    status: 'scheduled' as const // Use const assertion to match the union type
  };

  it('renders gift details correctly', () => {
    render(<ScheduledGiftCard gift={mockGift} />);
    
    expect(screen.getByText('Leather Wallet')).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(format(mockGift.scheduledDate, 'PPP'))).toBeInTheDocument();
    expect(screen.getByAltText('Leather Wallet')).toHaveAttribute('src', 'wallet.jpg');
  });

  it('shows action buttons when showActions is true', () => {
    render(<ScheduledGiftCard gift={mockGift} showActions={true} />);
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('shows status badge when showActions is false', () => {
    const sentGift = { ...mockGift, status: 'sent' as const };
    render(<ScheduledGiftCard gift={sentGift} showActions={false} />);
    
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('shows failed status badge for failed gifts', () => {
    const failedGift = { ...mockGift, status: 'failed' as const };
    render(<ScheduledGiftCard gift={failedGift} showActions={false} />);
    
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('uses showActions=true as default when prop is not provided', () => {
    render(<ScheduledGiftCard gift={mockGift} />);
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});
