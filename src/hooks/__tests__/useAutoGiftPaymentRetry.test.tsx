import { renderHook, act } from '@testing-library/react';
import { useAutoGiftPaymentRetry } from '../useAutoGiftPaymentRetry';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn()
    }
  }
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('useAutoGiftPaymentRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('retryPayment', () => {
    it('successfully retries payment', async () => {
      const mockData = { success: true };
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useAutoGiftPaymentRetry());

      let response;
      await act(async () => {
        response = await result.current.retryPayment('execution-123', true);
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith('retry-auto-gift-payment', {
        body: {
          execution_id: 'execution-123',
          force_immediate: true
        }
      });
      expect(toast.success).toHaveBeenCalledWith('Payment retry initiated successfully');
      expect(response).toEqual({ success: true, data: mockData });
    });

    it('handles retry failure', async () => {
      const mockError = { message: 'Payment failed' };
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { success: false, error: 'Payment failed' },
        error: null
      });

      const { result } = renderHook(() => useAutoGiftPaymentRetry());

      let response;
      await act(async () => {
        response = await result.current.retryPayment('execution-123', false);
      });

      expect(toast.error).toHaveBeenCalledWith('Payment failed');
      expect(response).toEqual({ success: false, error: 'Payment failed' });
    });

    it('handles network errors', async () => {
      const mockError = new Error('Network error');
      (supabase.functions.invoke as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAutoGiftPaymentRetry());

      let response;
      await act(async () => {
        response = await result.current.retryPayment('execution-123');
      });

      expect(toast.error).toHaveBeenCalled();
      expect(response).toEqual({ success: false, error: 'Network error' });
    });
  });

  describe('updatePaymentMethod', () => {
    it('successfully updates payment method', async () => {
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useAutoGiftPaymentRetry());

      let response;
      await act(async () => {
        response = await result.current.updatePaymentMethod('execution-123', 'pm-456');
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith('update-execution-payment-method', {
        body: {
          execution_id: 'execution-123',
          payment_method_id: 'pm-456'
        }
      });
      expect(toast.success).toHaveBeenCalledWith('Payment method updated. Retry the payment now.');
      expect(response).toEqual({ success: true });
    });

    it('handles update failure', async () => {
      const mockError = new Error('Update failed');
      (supabase.functions.invoke as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAutoGiftPaymentRetry());

      let response;
      await act(async () => {
        response = await result.current.updatePaymentMethod('execution-123', 'pm-456');
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to update payment method');
      expect(response).toEqual({ success: false, error: 'Update failed' });
    });
  });

  describe('isRetrying state', () => {
    it('updates isRetrying state during retry', async () => {
      (supabase.functions.invoke as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { success: true }, error: null }), 100))
      );

      const { result } = renderHook(() => useAutoGiftPaymentRetry());

      expect(result.current.isRetrying).toBe(false);

      act(() => {
        result.current.retryPayment('execution-123');
      });

      // isRetrying should be true immediately after calling retryPayment
      expect(result.current.isRetrying).toBe(true);

      // Wait for the promise to resolve
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // isRetrying should be false after completion
      expect(result.current.isRetrying).toBe(false);
    });
  });
});
