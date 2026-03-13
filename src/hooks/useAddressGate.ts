import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

export type AddressGateContext = 
  | 'wishlist' 
  | 'connection' 
  | 'auto_gift' 
  | 'checkout';

const CONTEXT_MESSAGES: Record<AddressGateContext, { title: string; description: string }> = {
  wishlist: {
    title: "Add your shipping address",
    description: "To create a wishlist, add your address so friends can ship gifts to you.",
  },
  connection: {
    title: "Share your shipping address",
    description: "Add your address so your connections can send you gifts.",
  },
  auto_gift: {
    title: "Shipping address required",
    description: "To set up auto-gifting, we need your shipping address for deliveries.",
  },
  checkout: {
    title: "Add delivery address",
    description: "Enter your shipping address to complete your purchase.",
  },
};

interface AddressGateState {
  isOpen: boolean;
  context: AddressGateContext | null;
  pendingAction: (() => void | Promise<void>) | null;
}

export const useAddressGate = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AddressGateState>({
    isOpen: false,
    context: null,
    pendingAction: null,
  });

  const checkHasAddress = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const { data } = await supabase
      .from("profiles")
      .select("shipping_address")
      .eq("id", user.id)
      .single();

    const addr = data?.shipping_address as Record<string, string> | null;
    return !!(addr?.street && addr?.city && addr?.state && addr?.zipCode);
  }, [user]);

  /**
   * Wrap an action that requires a shipping address.
   * If address exists, executes immediately; otherwise opens the gate modal.
   */
  const requireAddress = useCallback(
    async (context: AddressGateContext, action: () => void | Promise<void>) => {
      const hasAddress = await checkHasAddress();
      if (hasAddress) {
        await action();
      } else {
        setState({ isOpen: true, context, pendingAction: () => action() });
      }
    },
    [checkHasAddress]
  );

  const closeGate = useCallback(() => {
    setState({ isOpen: false, context: null, pendingAction: null });
  }, []);

  const completeGate = useCallback(async () => {
    const action = state.pendingAction;
    setState({ isOpen: false, context: null, pendingAction: null });
    if (action) {
      await action();
    }
  }, [state.pendingAction]);

  const contextMessage = state.context ? CONTEXT_MESSAGES[state.context] : null;

  return {
    isGateOpen: state.isOpen,
    gateContext: state.context,
    contextMessage,
    requireAddress,
    closeGate,
    completeGate,
  };
};
