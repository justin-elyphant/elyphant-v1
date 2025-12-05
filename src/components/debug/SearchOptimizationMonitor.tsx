
/**
 * Hidden debug component for monitoring search optimization
 * Access via browser console: window.showSearchStats()
 */

import React, { useState, useEffect } from 'react';
import { searchCache } from '../../services/cache/searchCache';
import { smartMockDataService } from '../../services/search/smartMockData';

const SearchOptimizationMonitor = () => {
  const [stats, setStats] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Make this accessible from browser console
    (window as any).showSearchStats = () => {
      setIsVisible(true);
      updateStats();
    };

    (window as any).hideSearchStats = () => {
      setIsVisible(false);
    };

    return () => {
      delete (window as any).showSearchStats;
      delete (window as any).hideSearchStats;
    };
  }, []);

  const updateStats = () => {
    const optimizationStats = { cache: { hits: 0, misses: 0 }, budget: { spent: 0, percentUsed: 0 }, optimization: { enabled: true } };
    const cacheInfo = searchCache.getCacheInfo();
    const mockAnalytics = smartMockDataService.getAnalytics();

    setStats({
      optimization: optimizationStats,
      cache: cacheInfo,
      mockData: mockAnalytics,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  if (!isVisible || !stats) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '400px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3>Search Optimization Stats</h3>
        <button onClick={() => setIsVisible(false)} style={{ 
          background: 'red', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}>×</button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>💰 Budget Status</strong><br/>
        Monthly: ${stats.optimization.budget.monthly}<br/>
        Spent: ${stats.optimization.budget.spent}<br/>
        Remaining: ${stats.optimization.budget.remaining}<br/>
        Used: {stats.optimization.budget.percentUsed}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>💾 Cache Performance</strong><br/>
        Hit Rate: {stats.cache.hitRate}<br/>
        Size: {stats.cache.size}/{stats.cache.maxSize}<br/>
        Total Saved: {stats.cache.totalSaved}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>📊 Search Analytics</strong><br/>
        Total API Calls Saved: {stats.optimization.cache.apiCallsSaved}<br/>
        Total Cost Saved: {stats.optimization.cache.totalCostSaved}<br/>
        Estimated Monthly Savings: {stats.optimization.optimization.estimatedMonthlySavings}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>🤖 Smart Mock Data</strong><br/>
        Unique Queries: {stats.mockData.totalUniqueQueries}<br/>
        Total Searches: {stats.mockData.totalSearches}<br/>
        Success Rate: {stats.mockData.averageSuccessRate}<br/>
        Recent Activity: {stats.mockData.recentActivity}
      </div>

      <div style={{ fontSize: '10px', color: '#ccc' }}>
        Last updated: {stats.timestamp}<br/>
        <button onClick={updateStats} style={{ 
          background: '#333', 
          color: 'white', 
          border: '1px solid #666', 
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '5px'
        }}>Refresh Stats</button>
      </div>
    </div>
  );
};

export default SearchOptimizationMonitor;
