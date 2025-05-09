
import { useProfileCompletion } from '../useProfileCompletion';
import { renderHook } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
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
    success: jest.fn()
  }
}));

describe('useProfileCompletion', () => {
  const mockNavigate = jest.fn();
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  
  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    jest.clearAllMocks();
  });

  it('should provide profile completion functions', () => {
    const { result } = renderHook(() => useProfileCompletion(mockUser));
    
    expect(typeof result.current.handleSetupComplete).toBe('function');
    expect(typeof result.current.handleSkip).toBe('function');
    expect(typeof result.current.handleBackToDashboard).toBe('function');
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
