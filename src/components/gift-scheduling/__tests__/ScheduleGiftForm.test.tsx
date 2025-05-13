
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScheduleGiftForm from '../ScheduleGiftForm';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Mock the toast function
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('ScheduleGiftForm', () => {
  const mockRecipients = ['Alice', 'Bob', 'Charlie'];
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with correct initial state', () => {
    render(<ScheduleGiftForm recipients={mockRecipients} />);
    
    expect(screen.getByText('Schedule a Gift')).toBeInTheDocument();
    expect(screen.getByText('Choose when to deliver your gift')).toBeInTheDocument();
    expect(screen.getByText('Select recipient')).toBeInTheDocument();
    expect(screen.getByText('Delivery Date')).toBeInTheDocument();
    expect(screen.getByText('Schedule Gift')).toBeInTheDocument();
  });

  it('shows recipients in the dropdown', async () => {
    render(<ScheduleGiftForm recipients={mockRecipients} />);
    
    // Open the dropdown
    fireEvent.click(screen.getByText('Select recipient'));
    
    // Check that all recipients are shown
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });

  it('shows error toast when submitting without selecting recipient', () => {
    render(<ScheduleGiftForm recipients={mockRecipients} />);
    
    // Submit the form without selecting a recipient
    fireEvent.click(screen.getByText('Schedule Gift'));
    
    expect(toast.error).toHaveBeenCalledWith("Please select a date and recipient");
  });

  it('shows success toast when form is submitted correctly', async () => {
    const user = userEvent.setup();
    render(<ScheduleGiftForm recipients={mockRecipients} />);
    
    // Open the dropdown and select a recipient
    fireEvent.click(screen.getByText('Select recipient'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Alice'));
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Schedule Gift'));
    
    // Check that success toast is shown
    const today = new Date();
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining(`Gift scheduled for Alice on ${format(today, 'PPP')}`)
    );
  });
});
