
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { testGoogleMapsApiKey, clearApiKeyCache } from '@/utils/googleMapsConfig';
import { googlePlacesService } from '@/services/googlePlacesService';

const GoogleMapsDebugPanel: React.FC = () => {
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [isTestingAutocomplete, setIsTestingAutocomplete] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleTestApiKey = async () => {
    setIsTestingApiKey(true);
    addTestResult('🧪 Starting API key test...');
    
    try {
      await testGoogleMapsApiKey();
      addTestResult('✅ API key test completed - check console for details');
    } catch (error) {
      addTestResult(`❌ API key test failed: ${error.message}`);
    } finally {
      setIsTestingApiKey(false);
    }
  };

  const handleTestAutocomplete = async () => {
    setIsTestingAutocomplete(true);
    addTestResult('🔍 Testing autocomplete with "123 Main"...');
    
    try {
      const predictions = await googlePlacesService.getAddressPredictions('123 Main');
      addTestResult(`✅ Got ${predictions.length} predictions`);
      
      if (predictions.length > 0) {
        addTestResult(`📍 Testing place details for first prediction...`);
        const details = await googlePlacesService.getPlaceDetails(predictions[0].place_id);
        addTestResult(`✅ Got place details: ${details?.formatted_address || 'No address'}`);
      }
    } catch (error) {
      addTestResult(`❌ Autocomplete test failed: ${error.message}`);
    } finally {
      setIsTestingAutocomplete(false);
    }
  };

  const handleClearCache = () => {
    clearApiKeyCache();
    addTestResult('🗑️ API key cache cleared');
  };

  const handleGetStatus = () => {
    const status = googlePlacesService.getStatus();
    setServiceStatus(status);
    addTestResult(`📊 Service status updated - Mock: ${status.usingMockData}, API Key: ${status.hasApiKey}, Loaded: ${status.isLoaded}`);
  };

  const handleClearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Google Maps Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleTestApiKey} 
            disabled={isTestingApiKey}
            variant="outline"
          >
            {isTestingApiKey ? 'Testing...' : 'Test API Key'}
          </Button>
          
          <Button 
            onClick={handleTestAutocomplete} 
            disabled={isTestingAutocomplete}
            variant="outline"
          >
            {isTestingAutocomplete ? 'Testing...' : 'Test Autocomplete'}
          </Button>
          
          <Button onClick={handleClearCache} variant="outline">
            Clear Cache
          </Button>
          
          <Button onClick={handleGetStatus} variant="outline">
            Get Status
          </Button>
          
          <Button onClick={handleClearResults} variant="outline">
            Clear Results
          </Button>
        </div>

        {serviceStatus && (
          <div className="flex gap-2">
            <Badge variant={serviceStatus.usingMockData ? "destructive" : "default"}>
              {serviceStatus.usingMockData ? "Using Mock Data" : "Using Real API"}
            </Badge>
            <Badge variant={serviceStatus.hasApiKey ? "default" : "destructive"}>
              {serviceStatus.hasApiKey ? "Has API Key" : "No API Key"}
            </Badge>
            <Badge variant={serviceStatus.isLoaded ? "default" : "secondary"}>
              {serviceStatus.isLoaded ? "Loaded" : "Not Loaded"}
            </Badge>
          </div>
        )}

        {testResults.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto">
            <h4 className="font-medium mb-2">Test Results:</h4>
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {result}
              </div>
            ))}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Open browser console (F12) for detailed logs</li>
            <li>Test API Key: Verifies edge function and API key retrieval</li>
            <li>Test Autocomplete: Tests the complete prediction + details flow</li>
            <li>Look for 🗺️ and 🏗️ prefixed logs in console</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleMapsDebugPanel;
