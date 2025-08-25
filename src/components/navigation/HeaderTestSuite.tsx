import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createPerformanceBudget } from '@/utils/performanceOptimizations';

// Development-only component for testing header behavior across pages
const HeaderTestSuite: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    headerHeight: number;
    zIndexCount: number;
    stickyElements: number;
    performanceViolations: string[];
  }>({
    headerHeight: 0,
    zIndexCount: 0,
    stickyElements: 0,
    performanceViolations: []
  });

  const location = useLocation();
  const performanceBudget = createPerformanceBudget();

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    const runTests = () => {
      // Test 1: Header height consistency
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 0;
      performanceBudget.checkHeaderHeight(headerHeight);

      // Test 2: Count sticky elements
      const stickyElements = document.querySelectorAll('[class*="sticky"]').length;

      // Test 3: Z-index audit
      const allElements = document.querySelectorAll('*');
      const zIndexElements = Array.from(allElements).filter(el => {
        const zIndex = window.getComputedStyle(el).zIndex;
        return zIndex !== 'auto' && !isNaN(parseInt(zIndex));
      });

      zIndexElements.forEach(el => {
        const zIndex = parseInt(window.getComputedStyle(el).zIndex);
        performanceBudget.checkZIndex(zIndex);
      });

      setTestResults({
        headerHeight,
        zIndexCount: zIndexElements.length,
        stickyElements,
        performanceViolations: performanceBudget.getViolations()
      });

      performanceBudget.reset();
    };

    // Run tests after page load and DOM updates
    const timer = setTimeout(runTests, 1000);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs z-[9999] max-w-xs">
      <div className="font-bold mb-2">Header Test Results</div>
      <div>Page: {location.pathname}</div>
      <div>Header Height: {testResults.headerHeight}px</div>
      <div>Sticky Elements: {testResults.stickyElements}</div>
      <div>Z-Index Elements: {testResults.zIndexCount}</div>
      
      {testResults.performanceViolations.length > 0 && (
        <div className="mt-2 text-red-400">
          <div className="font-bold">Violations:</div>
          {testResults.performanceViolations.map((violation, i) => (
            <div key={i} className="text-xs">{violation}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeaderTestSuite;