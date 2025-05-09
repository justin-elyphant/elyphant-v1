
import { useProfileCompletion } from '../useProfileCompletion';
import { renderHook } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnValue({ data: null, error: null })
  }
}));

// Mock the auth context
jest.mock('@/contexts/auth', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: { id: 'test-user-id' },
    signOut: jest.fn()
  })
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn()
  }
}));

// Mock error handling utilities
jest.mock('@/utils/profileErrorUtils', () => ({
  handleProfileError: jest.fn()
}));

// Mock data format utilities
jest.mock('@/utils/dataFormatUtils', () => ({
  formatProfileForSubmission: jest.fn(data => data)
}));

describe('useProfileCompletion', () => {
  const mockNavigate = jest.fn();
  // Create a more complete mock user object that satisfies the User type
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
    role: '',
    updated_at: '',
  } as User;
  
  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    jest.clearAllMocks();
  });

  it('should provide profile completion functions', () => {
    const { result } = renderHook(() => useProfileCompletion(mockUser));
    
    expect(typeof result.current.handleSetupComplete).toBe('function');
    expect(typeof result.current.handleSkip).toBe('function');
    expect(typeof result.current.handleBackToDashboard).toBe('function');
    expect(typeof result.current.isSubmitting).toBe('boolean');
  });

  it('should navigate to dashboard when handleSkip is called', () => {
    const { result } = renderHook(() => useProfileCompletion(mockUser));
    
    result.current.handleSkip();
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
  
  it('should navigate to dashboard when handleBackToDashboard is called', () => {
    const { result } = renderHook(() => useProfileCompletion(mockUser));
    
    result.current.handleBackToDashboard();
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
