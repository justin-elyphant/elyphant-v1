import { render, screen } from '@testing-library/react';
import { PaymentMethodHealthBadge } from '../PaymentMethodHealthBadge';

describe('PaymentMethodHealthBadge', () => {
  it('does not render for valid status', () => {
    const { container } = render(
      <PaymentMethodHealthBadge status="valid" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders expired badge', () => {
    render(
      <PaymentMethodHealthBadge 
        status="expired" 
        expirationDate={new Date('2023-01-01')}
      />
    );
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('renders expiring soon badge', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20); // 20 days from now
    
    render(
      <PaymentMethodHealthBadge 
        status="expiring_soon" 
        expirationDate={futureDate}
      />
    );
    expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
  });

  it('renders invalid badge', () => {
    render(
      <PaymentMethodHealthBadge status="invalid" />
    );
    expect(screen.getByText('Invalid - Update Required')).toBeInTheDocument();
  });

  it('renders detached badge', () => {
    render(
      <PaymentMethodHealthBadge status="detached" />
    );
    expect(screen.getByText('Detached from Stripe')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PaymentMethodHealthBadge 
        status="expired" 
        className="custom-class"
      />
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge?.className).toContain('custom-class');
  });
});
