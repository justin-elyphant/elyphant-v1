/**
 * NICOLE AUTO-GIFTING TEST COMPONENT
 * 
 * Simple test component to verify Nicole-enhanced auto-gifting integration
 * while preserving all existing protective measures.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, MessageCircle, Gift, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { nicoleAIService } from '@/services/ai/unified/nicoleAIService';
import { toast } from 'sonner';

const NicoleAutoGiftingTest: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    giftSelection?: any;
    ruleCreation?: any;
    approvalTest?: any;
    insights?: any;
  }>({});
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');

  const testGiftSelection = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const context = {
        recipientId: user.id, // Test with self for safety
        budget: 50,
        occasion: 'birthday',
        relationshipType: 'friend',
        recipientProfile: { name: 'Test User' }
      };

      const result = await nicoleAIService.enhanceGiftSelection(context);
      
      setTestResults(prev => ({ ...prev, giftSelection: result }));
      toast.success('Nicole gift selection test completed!');
      
    } catch (error) {
      console.error('Gift selection test failed:', error);
      toast.error('Gift selection test failed');
      setTestResults(prev => ({ 
        ...prev, 
        giftSelection: { error: error.message } 
      }));
    } finally {
      setLoading(false);
    }
  };

  const testRuleCreation = async () => {
    if (!user || !naturalLanguageInput.trim()) {
      toast.error('Please enter a rule description');
      return;
    }
    
    setLoading(true);
    try {
      const result = await nicoleAIService.createRuleFromConversation({
        userId: user.id,
        naturalLanguageInput: naturalLanguageInput.trim()
      });

      setTestResults(prev => ({ ...prev, ruleCreation: result }));
      toast.success('Nicole rule creation test completed!');
      
    } catch (error) {
      console.error('Rule creation test failed:', error);
      toast.error('Rule creation test failed');
      setTestResults(prev => ({ 
        ...prev, 
        ruleCreation: { error: error.message } 
      }));
    } finally {
      setLoading(false);
    }
  };

  const testPredictiveInsights = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await nicoleAIService.generatePredictiveInsights(user.id);
      
      setTestResults(prev => ({ ...prev, insights: result }));
      toast.success('Predictive insights test completed!');
      
    } catch (error) {
      console.error('Insights test failed:', error);
      toast.error('Insights test failed');
      setTestResults(prev => ({ 
        ...prev, 
        insights: { error: error.message } 
      }));
    } finally {
      setLoading(false);
    }
  };

  const TestResultCard: React.FC<{ 
    title: string; 
    result: any; 
    icon: React.ReactNode; 
  }> = ({ title, result, icon }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {result ? (
          <div className="space-y-2">
            {result.error ? (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Error: {result.error}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Success</span>
              </div>
            )}
            
            {result.confidence && (
              <Badge variant="secondary">
                {(result.confidence * 100).toFixed(0)}% confidence
              </Badge>
            )}
            
            {result.reasoning && (
              <p className="text-xs text-muted-foreground mt-2">
                {result.reasoning.substring(0, 100)}...
              </p>
            )}
            
            <details className="mt-2">
              <summary className="text-xs cursor-pointer text-blue-600">
                View full result
              </summary>
              <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not tested yet</p>
        )}
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to test Nicole auto-gifting features</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Nicole Auto-Gifting Test Suite
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test Nicole AI integration with auto-gifting system
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={testGiftSelection}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Gift className="h-4 w-4" />
              Test Gift Selection
            </Button>
            
            <Button 
              onClick={testPredictiveInsights}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              Test Insights
            </Button>
          </div>

          {/* Rule Creation Test */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Rule Creation:</label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Set up birthday gifts for my family under $100"
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
                disabled={loading}
              />
              <Button 
                onClick={testRuleCreation}
                disabled={loading || !naturalLanguageInput.trim()}
                size="sm"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Test Rule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TestResultCard
          title="Gift Selection"
          result={testResults.giftSelection}
          icon={<Gift className="h-4 w-4" />}
        />
        
        <TestResultCard
          title="Rule Creation"
          result={testResults.ruleCreation}
          icon={<MessageCircle className="h-4 w-4" />}
        />
        
        <TestResultCard
          title="Predictive Insights"
          result={testResults.insights}
          icon={<Brain className="h-4 w-4" />}
        />
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Nicole Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs">Service Layer</p>
            </div>
            <div>
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs">Database Schema</p>
            </div>
            <div>
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs">Type Definitions</p>
            </div>
            <div>
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs">Edge Functions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NicoleAutoGiftingTest;