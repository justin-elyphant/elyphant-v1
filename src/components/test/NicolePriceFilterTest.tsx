import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

/**
 * Test component to verify Nicole contextual price filtering
 */
export const NicolePriceFilterTest: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('concerts cooking netflix gifts');
  const [minPrice, setMinPrice] = useState(50);
  const [maxPrice, setMaxPrice] = useState(150);
  const [recipient, setRecipient] = useState('Justin');
  const navigate = useNavigate();

  const testNicoleNavigation = () => {
    // Simulate Nicole navigation with budget context
    const marketplaceUrl = new URL('/marketplace', window.location.origin);
    marketplaceUrl.searchParams.set('search', searchQuery);
    marketplaceUrl.searchParams.set('source', 'nicole');
    marketplaceUrl.searchParams.set('minPrice', String(minPrice));
    marketplaceUrl.searchParams.set('maxPrice', String(maxPrice));
    marketplaceUrl.searchParams.set('recipient', recipient);
    
    console.log('🧪 Test: Navigating with Nicole context:', marketplaceUrl.pathname + marketplaceUrl.search);
    navigate(marketplaceUrl.pathname + marketplaceUrl.search);
  };

  const testRegularSearch = () => {
    // Simulate regular search without Nicole context
    navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>🧪 Nicole Price Filter Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Search Query</label>
          <Input 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="concerts cooking netflix gifts"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Min Price ($)</label>
            <Input 
              type="number" 
              value={minPrice} 
              onChange={(e) => setMinPrice(Number(e.target.value))}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Max Price ($)</label>
            <Input 
              type="number" 
              value={maxPrice} 
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Recipient</label>
          <Input 
            value={recipient} 
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Justin"
          />
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={testNicoleNavigation} 
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            🎯 Test Nicole Search (with price filter)
          </Button>
          <Button 
            onClick={testRegularSearch} 
            variant="outline" 
            className="w-full"
          >
            🔍 Test Regular Search (no price filter)
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p><strong>✅ Fixed - Expected behavior:</strong></p>
          <p>• Nicole search now includes minPrice/maxPrice in URL</p>
          <p>• Should filter products to ${minPrice}-${maxPrice} range</p>
          <p>• Should use ProductCatalogService with Nicole context</p>
          <p>• Check console for "🎯 Nicole Navigation with context" logs</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NicolePriceFilterTest;