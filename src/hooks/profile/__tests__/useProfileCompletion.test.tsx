
import { renderHook, waitFor } from '@testing-library/react';
import { useProfileCompletion } from '../useProfileCompletion';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock the auth hook
jest.mock('@/contexts/auth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'mock-user-id' },
    isDebugMode: false
  }))
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'mock-user-id',
              name: 'Test User',
              dob: '01-01',
              shipping_address: { street: '123 Main St', city: 'Test City', state: 'TS', zipCode: '12345', country: 'Test Country' },
              gift_preferences: [{ category: 'Books', importance: 'high' }],
              data_sharing_settings: { dob: 'friends', shipping_address: 'private', gift_preferences: 'public' }
            },
            error: null
          }))
        }))
      }))
    }))
  }
}));

// Wrapper component for tests
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('useProfileCompletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return profile as complete when all required fields are present', async () => {
    const { result } = renderHook(() => useProfileCompletion(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    await waitFor(() => {
      expect(result.current.isComplete).toBe(true);
    });
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should redirect to profile setup if shouldRedirect is true and profile is incomplete', async () => {
    // Mock incomplete profile
    jest.spyOn(require('@/integrations/supabase/client'), 'supabase').mockImplementation(() => ({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'mock-user-id', name: 'Test User' }, // Missing required fields
              error: null
            }))
          }))
        }))
      }))
    }));

    const { result } = renderHook(() => useProfileCompletion({ shouldRedirect: true }), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile-setup');
    });
  });
});
