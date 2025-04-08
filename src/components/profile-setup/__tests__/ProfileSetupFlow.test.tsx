
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileSetupFlow from '../ProfileSetupFlow';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: {}, error: null }))
          }))
        }))
      }))
    })),
  }
}));

// Mock Auth context
jest.mock('@/contexts/auth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user-id' },
    isDebugMode: false
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('ProfileSetupFlow', () => {
  const mockOnComplete = jest.fn();
  const mockOnSkip = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the first step by default', () => {
    render(
      <BrowserRouter>
        <ProfileSetupFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      </BrowserRouter>
    );
    
    // Wait for the component to render and check for the presence of the basic info step
    waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });
  });

  it('should navigate through steps when clicking next', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ProfileSetupFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      </BrowserRouter>
    );

    // Step 1 - Basic Info
    await waitFor(() => {
      expect(screen.getByText(/Complete Your Profile/i)).toBeInTheDocument();
    });
    
    // Click next to go to step 2
    await user.click(screen.getByText('Next Step'));
    
    // Step 2 - Birthday
    await waitFor(() => {
      expect(screen.getByText(/When is your birthday/i)).toBeInTheDocument();
    });
  });

  it('completes the profile setup process', async () => {
    render(
      <BrowserRouter>
        <ProfileSetupFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      </BrowserRouter>
    );

    // Fill out name in first step
    fireEvent.change(screen.getByPlaceholderText('Your full name'), {
      target: { value: 'John Doe' }
    });
    
    // Navigate through all steps
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByText('Next Step'));
      await waitFor(() => {
        // Just wait for the next step to render
      });
    }
    
    // Now we should be at the final step
    expect(screen.getByText('Complete Setup')).toBeInTheDocument();
    
    // Complete the setup
    fireEvent.click(screen.getByText('Complete Setup'));
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('allows skipping the profile setup', () => {
    render(
      <BrowserRouter>
        <ProfileSetupFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      </BrowserRouter>
    );
    
    // Skip the setup
    fireEvent.click(screen.getByText('Skip for now'));
    
    expect(mockOnSkip).toHaveBeenCalled();
  });
});
