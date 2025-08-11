import React from 'react';
import { Button } from '@/components/ui/button';
import { UnifiedNicoleContext } from '@/services/ai/unified/types';

interface NicoleBudgetDebuggerProps {
  onNavigateToMarketplace: (searchQuery: string, context: UnifiedNicoleContext) => void;
}

/**
 * Debug component to test Nicole's budget context flow
 */
export const NicoleBudgetDebugger: React.FC<NicoleBudgetDebuggerProps> = ({ 
  onNavigateToMarketplace 
}) => {
  
  const testNicoleBudgetFlow = () => {
    console.log('🧪 TESTING Nicole Budget Flow');
    
    // Create a test context that simulates Nicole's conversation result
    const testContext: UnifiedNicoleContext = {
      conversationPhase: 'ready_to_search',
      capability: 'search',
      recipient: 'Justin',
      relationship: 'friend',
      occasion: 'birthday',
      exactAge: 25,
      interests: ['concerts', 'cooking', 'netflix', 'streaming devices'],
      detectedBrands: ['Amazon', 'Apple', 'Netflix'],
      budget: [75, 125], // This is the key - ensure budget is set as array
      searchQuery: 'concerts cooking netflix streaming devices gifts'
    };
    
    console.log('🧪 Test context created:', {
      budget: testContext.budget,
      budgetType: typeof testContext.budget,
      budgetIsArray: Array.isArray(testContext.budget),
      interests: testContext.interests,
      recipient: testContext.recipient
    });
    
    const searchQuery = 'concerts cooking netflix amazon gifts for Justin birthday';
    
    console.log('🧪 Calling onNavigateToMarketplace with test data');
    onNavigateToMarketplace(searchQuery, testContext);
  };

  const testWithAutoGiftIntelligence = () => {
    console.log('🧪 TESTING AutoGift Intelligence Budget Flow');
    
    const testContext: UnifiedNicoleContext = {
      conversationPhase: 'ready_to_search',
      capability: 'auto_gifting',
      recipient: 'Justin',
      autoGiftIntelligence: {
        hasIntelligence: true,
        primaryRecommendation: {
          recipientName: 'Justin',
          recipientId: 'user_123',
          occasionType: 'birthday',
          occasionDate: '2024-08-15',
          budgetRange: [75, 125],
          confidence: 0.9
        },
        canUseOptimalFlow: true
      },
      interests: ['concerts', 'cooking', 'netflix'],
      searchQuery: 'concerts cooking netflix gifts'
    };
    
    console.log('🧪 AutoGift test context created:', {
      autoGiftBudget: testContext.autoGiftIntelligence?.primaryRecommendation?.budgetRange,
      directBudget: testContext.budget,
      interests: testContext.interests
    });
    
    const searchQuery = 'concerts cooking netflix gifts for Justin birthday';
    onNavigateToMarketplace(searchQuery, testContext);
  };

  return (
    <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
      <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
        🧪 Nicole Budget Flow Debugger
      </h3>
      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
        Test Nicole's budget context flow to marketplace with real data structure
      </p>
      <div className="flex gap-2">
        <Button 
          onClick={testNicoleBudgetFlow}
          variant="outline"
          size="sm"
          className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700"
        >
          Test Direct Budget ($75-125)
        </Button>
        <Button 
          onClick={testWithAutoGiftIntelligence}
          variant="outline"
          size="sm"
          className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700"
        >
          Test AutoGift Budget
        </Button>
      </div>
    </div>
  );
};