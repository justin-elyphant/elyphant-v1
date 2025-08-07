import { useState, useCallback, useEffect } from "react";
import { useAuthSession } from "@/contexts/auth/useAuthSession";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { unifiedNicoleAI } from "@/services/ai/unified/UnifiedNicoleAIService";
import { UnifiedNicoleContext, NicoleResponse, NicoleCapability } from "@/services/ai/unified/types";

interface UseUnifiedNicoleAIProps {
  sessionId?: string;
  initialContext?: Partial<UnifiedNicoleContext>;
  onResponse?: (response: NicoleResponse) => void;
  onError?: (error: Error) => void;
}

export const useUnifiedNicoleAI = ({
  sessionId,
  initialContext = {},
  onResponse,
  onError
}: UseUnifiedNicoleAIProps = {}) => {
  const { user } = useAuthSession();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<NicoleResponse | null>(null);
  const [currentSessionId] = useState(sessionId || `nicole-${Date.now()}`);
  
  // Extract user's first name from profile (using name field since first_name doesn't exist in type)
  const userFirstName = profile?.name?.split(' ')[0] || null;
  
  // Initialize context with user data and defaults
  const [context, setContext] = useState<UnifiedNicoleContext>(() => ({
    conversationPhase: 'greeting',
    capability: 'conversation',
    interests: [],
    detectedBrands: [],
    currentUserId: user?.id,
    userFirstName,
    ...initialContext
  }));

  // Update user context when user or profile changes
  useEffect(() => {
    const updates: Partial<UnifiedNicoleContext> = {};
    let needsUpdate = false;

    if (user?.id && context.currentUserId !== user.id) {
      console.log('🔄 Updating context with user ID:', user.id);
      updates.currentUserId = user.id;
      needsUpdate = true;
    }

    if (userFirstName && context.userFirstName !== userFirstName) {
      console.log('🔄 Updating context with user first name:', userFirstName);
      updates.userFirstName = userFirstName;
      needsUpdate = true;
    }

    if (needsUpdate) {
      setContext(prev => ({ ...prev, ...updates }));
    }
  }, [user?.id, userFirstName, context.currentUserId, context.userFirstName]);

  /**
   * Send a message to Nicole AI
   */
  const chatWithNicole = useCallback(async (message: string): Promise<NicoleResponse | null> => {
    if (!message.trim()) return null;

    setLoading(true);
    console.log('🚀 Sending message to Nicole with context:', {
      message: message.substring(0, 50) + '...',
      userId: context.currentUserId,
      hasUser: !!user
    });

    try {
      const response = await unifiedNicoleAI.chat(message, context, currentSessionId);
      
      // Update local context
      setContext(response.context);
      setLastResponse(response);
      
      // Call optional response handler
      onResponse?.(response);
      
      return response;
    } catch (error) {
      console.error('useUnifiedNicoleAI: Chat error:', error);
      const errorInstance = error instanceof Error ? error : new Error('Unknown error occurred');
      onError?.(errorInstance);
      return null;
    } finally {
      setLoading(false);
    }
  }, [context, currentSessionId, onResponse, onError, user]);

  /**
   * Update the conversation context
   */
  const updateContext = useCallback((updates: Partial<UnifiedNicoleContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
    unifiedNicoleAI.updateConversationContext(currentSessionId, updates);
  }, [currentSessionId]);

  /**
   * Generate a search query from current context
   */
  const generateSearchQuery = useCallback((): string => {
    return unifiedNicoleAI.generateSearchQuery(context);
  }, [context]);

  /**
   * Get available capabilities for current context
   */
  const getAvailableCapabilities = useCallback((): NicoleCapability[] => {
    return unifiedNicoleAI.getAvailableCapabilities(context);
  }, [context]);

  /**
   * Clear the conversation
   */
  const clearConversation = useCallback(() => {
    unifiedNicoleAI.clearConversation(currentSessionId);
    setContext({
      conversationPhase: 'greeting',
      capability: 'conversation',
      interests: [],
      detectedBrands: [],
      currentUserId: user?.id
    });
    setLastResponse(null);
  }, [currentSessionId, user?.id]);

  /**
   * Check if Nicole is ready to show search button
   */
  const isReadyToSearch = useCallback((): boolean => {
    return lastResponse?.showSearchButton || false;
  }, [lastResponse]);

  /**
   * Get Nicole's last message
   */
  const getLastMessage = useCallback((): string => {
    return lastResponse?.message || '';
  }, [lastResponse]);

  /**
   * Check if conversation has specific capability
   */
  const hasCapability = useCallback((capability: NicoleCapability): boolean => {
    return context.capability === capability;
  }, [context.capability]);

  /**
   * Get conversation context for external use
   */
  const getConversationContext = useCallback((): UnifiedNicoleContext => {
    return unifiedNicoleAI.getConversationContext(currentSessionId);
  }, [currentSessionId]);

  return {
    // State
    loading,
    context,
    lastResponse,
    sessionId: currentSessionId,

    // Actions
    chatWithNicole,
    updateContext,
    clearConversation,

    // Utilities
    generateSearchQuery,
    getAvailableCapabilities,
    isReadyToSearch,
    getLastMessage,
    hasCapability,
    getConversationContext,

    // Computed values
    isReady: !loading,
    hasContext: Object.keys(context).length > 0,
    conversationPhase: context.conversationPhase,
    currentCapability: context.capability
  };
};
