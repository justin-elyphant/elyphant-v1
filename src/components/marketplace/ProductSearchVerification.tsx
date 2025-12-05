/**
 * Product Search Verification Component
 * Quick component to verify and test product search functionality
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductSearchDebugger } from '@/utils/productSearchDebugger';
import { TestProductSearch } from '@/services/testProductSearch';
import { useMarketplace } from '@/hooks/useMarketplace';

export const ProductSearchVerification: React.FC = () => {
  const [verificationStatus, setVerificationStatus] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
    details?: any;
  }>({ status: 'idle', message: 'Click to verify product search functionality' });

  const { search, products, isLoading, error } = useMarketplace({ autoLoadOnMount: false });

  const runVerification = async () => {
    setVerificationStatus({ status: 'testing', message: 'Running verification tests...' });
    
    try {
      // Test 1: Health check
      console.log('[ProductSearchVerification] Running health check...');
      const healthCheck = await ProductSearchDebugger.healthCheck();
      
      if (healthCheck.status === 'unhealthy') {
        setVerificationStatus({
          status: 'error',
          message: 'Product search system is unhealthy',
          details: healthCheck
        });
        return;
      }
      
      // Test 2: Basic search functionality
      console.log('[ProductSearchVerification] Testing basic search...');
      await TestProductSearch.testBasicSearch('test search');
      
      // Test 3: Test unified marketplace hook
      console.log('[ProductSearchVerification] Testing unified marketplace...');
      await search('verification test');
      
      setVerificationStatus({
        status: 'success',
        message: `Verification successful! System status: ${healthCheck.status}`,
        details: {
          healthCheck,
          hookWorking: true,
          hasProducts: products.length > 0
        }
      });
      
    } catch (error) {
      console.error('[ProductSearchVerification] Verification failed:', error);
      setVerificationStatus({
        status: 'error',
        message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      });
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus.status) {
      case 'testing': return 'border-yellow-500 bg-yellow-50';
      case 'success': return 'border-green-500 bg-green-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus.status) {
      case 'testing': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '🔍';
    }
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto ${getStatusColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{getStatusIcon()}</span>
          Product Search Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Status: <span className="font-medium">{verificationStatus.message}</span>
          </p>
          
          {verificationStatus.details && (
            <details className="text-xs bg-gray-100 p-2 rounded">
              <summary className="cursor-pointer font-medium">View Details</summary>
              <pre className="mt-2 overflow-auto">
                {JSON.stringify(verificationStatus.details, null, 2)}
              </pre>
            </details>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={runVerification}
            disabled={verificationStatus.status === 'testing' || isLoading}
            variant="outline"
          >
            {verificationStatus.status === 'testing' ? 'Testing...' : 'Run Verification'}
          </Button>
          
          <Button 
            onClick={() => search('bluetooth headphones')}
            disabled={isLoading}
            variant="secondary"
          >
            Test Search
          </Button>
        </div>

        {error && (
          <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
            Search Error: {error}
          </div>
        )}

        {products.length > 0 && (
          <div className="text-green-600 text-sm p-2 bg-green-50 rounded">
            ✅ Found {products.length} products - search is working!
          </div>
        )}
      </CardContent>
    </Card>
  );
};