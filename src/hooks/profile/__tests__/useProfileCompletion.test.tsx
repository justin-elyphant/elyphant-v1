
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
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnValue({ data: null, error: null })
  }
}));

// Mock the auth context
jest.mock('@/contexts/auth', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: { id: 'test-user-id' }
  })
}));

describe('useProfileCompletion', () => {
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useProfileCompletion());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.isComplete).toBe(false);
  });

  it('should navigate to profile setup if shouldRedirect is true and profile is incomplete', async () => {
    const { result, rerender } = renderHook(() => useProfileCompletion(true));
    
    // Wait for the effect to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    rerender();
    
    expect(mockNavigate).toHaveBeenCalledWith('/profile-setup');
  });
  
  it('should not navigate if shouldRedirect is false', async () => {
    const { result, rerender } = renderHook(() => useProfileCompletion(false));
    
    // Wait for the effect to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    rerender();
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
