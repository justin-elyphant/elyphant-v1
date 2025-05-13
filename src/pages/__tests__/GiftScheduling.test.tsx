
import React from 'react';
import { render, screen } from '@testing-library/react';
import GiftScheduling from '../GiftScheduling';
import { AuthProvider } from '@/contexts/auth';

// Mock the useAuth hook
jest.mock('@/contexts/auth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user' }
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock the child components
jest.mock('@/components/gift-scheduling/GiftSchedulingTabs', () => ({
  __esModule: true,
  default: ({
    upcomingGifts,
    pastGifts,
    selectedTab,
    setSelectedTab
  }: any) => (
    <div data-testid="mock-scheduling-tabs">
      <div>Upcoming gifts: {upcomingGifts.length}</div>
      <div>Past gifts: {pastGifts.length}</div>
      <div>Selected tab: {selectedTab}</div>
    </div>
  )
}));

jest.mock('@/components/gift-scheduling/ScheduleGiftForm', () => ({
  __esModule: true,
  default: ({ recipients }: { recipients: string[] }) => (
    <div data-testid="mock-schedule-form">
      <div>Recipients: {recipients.join(', ')}</div>
    </div>
  )
}));

describe('GiftScheduling Page', () => {
  it('renders the page title correctly', () => {
    render(<GiftScheduling />);
    expect(screen.getByText('Gift Scheduling')).toBeInTheDocument();
  });

  it('renders GiftSchedulingTabs with correct props', () => {
    render(<GiftScheduling />);
    expect(screen.getByTestId('mock-scheduling-tabs')).toBeInTheDocument();
    expect(screen.getByText('Upcoming gifts: 1')).toBeInTheDocument();
    expect(screen.getByText('Past gifts: 1')).toBeInTheDocument();
    expect(screen.getByText('Selected tab: upcoming')).toBeInTheDocument();
  });

  it('renders ScheduleGiftForm with correct recipients', () => {
    render(<GiftScheduling />);
    expect(screen.getByTestId('mock-schedule-form')).toBeInTheDocument();
    expect(screen.getByText('Recipients: Alex Johnson, Morgan Smith, Jamie Williams')).toBeInTheDocument();
  });

  it('has the correct layout structure', () => {
    render(<GiftScheduling />);
    
    // Main container
    const mainContainer = screen.getByRole('heading', { name: 'Gift Scheduling' }).parentElement;
    expect(mainContainer).toBeInTheDocument();
    
    // Grid layout
    expect(mainContainer?.querySelector('.grid')).toBeInTheDocument();
  });
});
