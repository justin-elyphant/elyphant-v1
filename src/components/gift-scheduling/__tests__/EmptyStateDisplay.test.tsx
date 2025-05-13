
import React from 'react';
import { render, screen } from '@testing-library/react';
import EmptyStateDisplay from '../EmptyStateDisplay';

describe('EmptyStateDisplay', () => {
  it('renders the correct icon and message for upcoming type', () => {
    render(<EmptyStateDisplay type="upcoming" />);
    
    expect(screen.getByText('No scheduled gifts')).toBeInTheDocument();
  });

  it('renders the correct icon and message for history type', () => {
    render(<EmptyStateDisplay type="history" />);
    
    expect(screen.getByText('No gift history')).toBeInTheDocument();
  });
});
