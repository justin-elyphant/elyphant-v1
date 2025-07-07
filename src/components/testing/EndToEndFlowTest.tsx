import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";

interface TestStep {
  id: string;
  name: string;
  description: string;
  test: () => Promise<boolean>;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
}

interface FlowTest {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
}

const EndToEndFlowTest: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<FlowTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  // Define test flows
  useEffect(() => {
    const testFlows: FlowTest[] = [
      {
        id: 'signup-flow',
        name: 'Complete Signup Flow',
        description: 'Test the entire signup process from start to dashboard',
        steps: [
          {
            id: 'navigate-signup',
            name: 'Navigate to Signup',
            description: 'Navigate to the signup page',
            test: async () => {
              navigate('/signin');
              await new Promise(resolve => setTimeout(resolve, 1000));
              return window.location.pathname === '/signin';
            },
            status: 'pending'
          },
          {
            id: 'check-intent-modal',
            name: 'Intent Modal Display',
            description: 'Verify intent modal shows during verification',
            test: async () => {
              // This would test the OnboardingIntentModal component
              const modalElement = document.querySelector('[data-testid="intent-modal"]');
              return modalElement !== null;
            },
            status: 'pending'
          },
          {
            id: 'profile-completion',
            name: 'Profile Setup',
            description: 'Navigate to profile completion flow',
            test: async () => {
              navigate('/signup?intent=complete-profile');
              await new Promise(resolve => setTimeout(resolve, 1000));
              return window.location.search.includes('intent=complete-profile');
            },
            status: 'pending'
          }
        ]
      },
      {
        id: 'marketplace-flow',
        name: 'Marketplace Search Flow',
        description: 'Test marketplace search and product interactions',
        steps: [
          {
            id: 'navigate-marketplace',
            name: 'Navigate to Marketplace',
            description: 'Navigate to the marketplace page',
            test: async () => {
              navigate('/marketplace');
              await new Promise(resolve => setTimeout(resolve, 1000));
              return window.location.pathname === '/marketplace';
            },
            status: 'pending'
          },
          {
            id: 'search-products',
            name: 'Search Products',
            description: 'Perform a product search',
            test: async () => {
              navigate('/marketplace?search=shoes');
              await new Promise(resolve => setTimeout(resolve, 1500));
              const products = document.querySelectorAll('[data-testid="product-card"]');
              return products.length > 0;
            },
            status: 'pending'
          },
          {
            id: 'connection-integration',
            name: 'Connection Integration',
            description: 'Verify connection integration appears for authenticated users',
            test: async () => {
              if (!user) return false;
              navigate('/marketplace');
              await new Promise(resolve => setTimeout(resolve, 1000));
              const connectionSection = document.querySelector('[data-testid="connection-integration"]');
              return connectionSection !== null;
            },
            status: 'pending'
          }
        ]
      },
      {
        id: 'wishlist-flow',
        name: 'Wishlist Management Flow',
        description: 'Test wishlist creation and management',
        steps: [
          {
            id: 'navigate-wishlists',
            name: 'Navigate to Wishlists',
            description: 'Navigate to the wishlists page',
            test: async () => {
              navigate('/my-wishlists');
              await new Promise(resolve => setTimeout(resolve, 1000));
              return window.location.pathname === '/my-wishlists';
            },
            status: 'pending'
          },
          {
            id: 'wishlist-loading',
            name: 'Wishlist Data Loading',
            description: 'Verify wishlists load correctly',
            test: async () => {
              // Wait for loading to complete
              await new Promise(resolve => setTimeout(resolve, 2000));
              const loadingElement = document.querySelector('[data-testid="loading-wishlists"]');
              return loadingElement === null; // Loading should be complete
            },
            status: 'pending'
          }
        ]
      },
      {
        id: 'dashboard-flow',
        name: 'Dashboard Real Data Flow',
        description: 'Test dashboard with real user data',
        steps: [
          {
            id: 'navigate-dashboard',
            name: 'Navigate to Dashboard',
            description: 'Navigate to the main dashboard',
            test: async () => {
              navigate('/dashboard');
              await new Promise(resolve => setTimeout(resolve, 1000));
              return window.location.pathname === '/dashboard';
            },
            status: 'pending'
          },
          {
            id: 'dashboard-stats',
            name: 'Dashboard Statistics',
            description: 'Verify real statistics load correctly',
            test: async () => {
              await new Promise(resolve => setTimeout(resolve, 2000));
              const statsElements = document.querySelectorAll('[data-testid="dashboard-stat"]');
              return statsElements.length >= 4;
            },
            status: 'pending'
          }
        ]
      }
    ];

    setTests(testFlows);
  }, [navigate, user]);

  const runStep = async (testId: string, step: TestStep): Promise<boolean> => {
    setCurrentStep(step.id);
    
    try {
      const result = await step.test();
      
      setTests(prev => prev.map(test => ({
        ...test,
        steps: test.steps.map(s => 
          s.id === step.id 
            ? { ...s, status: result ? 'passed' : 'failed', error: result ? undefined : 'Test assertion failed' }
            : s
        )
      })));
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setTests(prev => prev.map(test => ({
        ...test,
        steps: test.steps.map(s => 
          s.id === step.id 
            ? { ...s, status: 'failed', error: errorMessage }
            : s
        )
      })));
      
      return false;
    }
  };

  const runTest = async (testFlow: FlowTest) => {
    setCurrentTest(testFlow.id);
    
    // Reset all steps to pending
    setTests(prev => prev.map(test => 
      test.id === testFlow.id 
        ? {
            ...test,
            steps: test.steps.map(step => ({ ...step, status: 'pending' as const, error: undefined }))
          }
        : test
    ));
    
    let allPassed = true;
    
    for (const step of testFlow.steps) {
      // Mark step as running
      setTests(prev => prev.map(test => ({
        ...test,
        steps: test.steps.map(s => 
          s.id === step.id ? { ...s, status: 'running' as const } : s
        )
      })));
      
      const result = await runStep(testFlow.id, step);
      
      if (!result) {
        allPassed = false;
        break; // Stop on first failure
      }
      
      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setCurrentStep(null);
    
    if (allPassed) {
      toast.success(`Test "${testFlow.name}" passed!`);
    } else {
      toast.error(`Test "${testFlow.name}" failed!`);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    for (const test of tests) {
      await runTest(test);
      // Delay between test flows
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsRunning(false);
    setCurrentTest(null);
  };

  const resetTests = () => {
    setTests(prev => prev.map(test => ({
      ...test,
      steps: test.steps.map(step => ({ 
        ...step, 
        status: 'pending' as const, 
        error: undefined 
      }))
    })));
    setCurrentTest(null);
    setCurrentStep(null);
  };

  const getStepIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getTestProgress = (test: FlowTest) => {
    const completedSteps = test.steps.filter(s => s.status === 'passed' || s.status === 'failed').length;
    return (completedSteps / test.steps.length) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">End-to-End Flow Testing</h2>
          <p className="text-muted-foreground">Test critical user flows and data consistency</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={resetTests}
            variant="outline"
            disabled={isRunning}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={runAllTests}
            disabled={isRunning}
          >
            <Play className="h-4 w-4 mr-2" />
            Run All Tests
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {tests.map((test) => (
          <Card key={test.id} className={currentTest === test.id ? "border-blue-500" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {test.name}
                    {currentTest === test.id && (
                      <Badge variant="secondary">Running</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{test.description}</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runTest(test)}
                  disabled={isRunning}
                >
                  Run Test
                </Button>
              </div>
              <Progress value={getTestProgress(test)} className="h-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {test.steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      currentStep === step.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    {getStepIcon(step.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{step.name}</p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {step.error && (
                        <p className="text-sm text-red-600 mt-1">{step.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EndToEndFlowTest;