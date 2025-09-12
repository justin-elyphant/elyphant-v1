
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GiftScheduling from '../GiftScheduling';

describe('GiftScheduling Component (Checkout)', () => {
  const defaultProps = {
    giftOptions: {
      isGift: false,
      recipientName: "",
      giftMessage: "",
      isSurpriseGift: false,
      scheduleDelivery: false,
      sendGiftMessage: false
    },
    onChange: jest.fn()
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

  it('calls onChange when checkboxes are clicked', () => {
    render(<GiftScheduling {...defaultProps} />);
    
    // Find and click the first checkbox
    const scheduleDeliveryCheckbox = screen.getByLabelText('Schedule delivery for a specific date');
    fireEvent.click(scheduleDeliveryCheckbox);
    
    // Check that onChange was called with the correct value
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      scheduleDelivery: true
    });
    
    // Find and click the second checkbox
    const sendMessageCheckbox = screen.getByLabelText('Send gift message ahead of delivery');
    fireEvent.click(sendMessageCheckbox);
    
    // Check that onChange was called with the correct value
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      sendGiftMessage: true
    });
  });

  it('renders the surprise option when provided', () => {
    const propsWithSurprise = {
      giftOptions: {
        isGift: false,
        recipientName: "",
        giftMessage: "",
        isSurpriseGift: false,
        scheduleDelivery: false,
        sendGiftMessage: false,
        isSurprise: false
      },
      onChange: jest.fn()
    };
    
    render(<GiftScheduling {...propsWithSurprise} />);
    
    expect(screen.getByText("Keep as a surprise (don't notify recipient)")).toBeInTheDocument();
    
    // Click the surprise checkbox
    const surpriseCheckbox = screen.getByLabelText("Keep as a surprise (don't notify recipient)");
    fireEvent.click(surpriseCheckbox);
    
    // Check that onChange was called with the correct value
    expect(propsWithSurprise.onChange).toHaveBeenCalledWith({
      isSurprise: true
    });
  });

  it('does not render the surprise option when not provided', () => {
    render(<GiftScheduling {...defaultProps} />);
    
    expect(screen.queryByText("Keep as a surprise (don't notify recipient)")).not.toBeInTheDocument();
  });
});
