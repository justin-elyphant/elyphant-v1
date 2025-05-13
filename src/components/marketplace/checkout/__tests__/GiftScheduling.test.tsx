
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GiftScheduling from '../GiftScheduling';

describe('GiftScheduling Component (Checkout)', () => {
  const defaultProps = {
    giftScheduling: {
      scheduleDelivery: false,
      sendGiftMessage: false
    },
    onUpdate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct title and options', () => {
    render(<GiftScheduling {...defaultProps} />);
    
    expect(screen.getByText('Gift Scheduling Options')).toBeInTheDocument();
    expect(screen.getByText('Schedule delivery for a specific date')).toBeInTheDocument();
    expect(screen.getByText('Send gift message ahead of delivery')).toBeInTheDocument();
  });

  it('calls onUpdate when checkboxes are clicked', () => {
    render(<GiftScheduling {...defaultProps} />);
    
    // Find and click the first checkbox
    const scheduleDeliveryCheckbox = screen.getByLabelText('Schedule delivery for a specific date');
    fireEvent.click(scheduleDeliveryCheckbox);
    
    // Check that onUpdate was called with the correct value
    expect(defaultProps.onUpdate).toHaveBeenCalledWith({
      scheduleDelivery: true,
      sendGiftMessage: false
    });
    
    // Find and click the second checkbox
    const sendMessageCheckbox = screen.getByLabelText('Send gift message ahead of delivery');
    fireEvent.click(sendMessageCheckbox);
    
    // Check that onUpdate was called with the correct value
    expect(defaultProps.onUpdate).toHaveBeenCalledWith({
      scheduleDelivery: false,
      sendGiftMessage: true
    });
  });

  it('renders the surprise option when provided', () => {
    const propsWithSurprise = {
      giftScheduling: {
        scheduleDelivery: false,
        sendGiftMessage: false,
        isSurprise: false
      },
      onUpdate: jest.fn()
    };
    
    render(<GiftScheduling {...propsWithSurprise} />);
    
    expect(screen.getByText("Keep as a surprise (don't notify recipient)")).toBeInTheDocument();
    
    // Click the surprise checkbox
    const surpriseCheckbox = screen.getByLabelText("Keep as a surprise (don't notify recipient)");
    fireEvent.click(surpriseCheckbox);
    
    // Check that onUpdate was called with the correct value
    expect(propsWithSurprise.onUpdate).toHaveBeenCalledWith({
      scheduleDelivery: false,
      sendGiftMessage: false,
      isSurprise: true
    });
  });

  it('does not render the surprise option when not provided', () => {
    render(<GiftScheduling {...defaultProps} />);
    
    expect(screen.queryByText("Keep as a surprise (don't notify recipient)")).not.toBeInTheDocument();
  });
});
