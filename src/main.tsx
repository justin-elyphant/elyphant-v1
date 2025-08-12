import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadCriticalRoutes } from './utils/lazyComponentLoader'

// Enhanced performance tracking
const startTime = performance.now();

// Optimize initial render
const container = document.getElementById("root")!;
const root = createRoot(container);

// Use concurrent rendering for better performance
root.render(<App />);

// Track comprehensive load metrics
const trackLoadMetrics = () => {
  const loadTime = performance.now() - startTime;
  
  // Web Vitals
  if ('performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    console.log('🚀 Performance Metrics:', {
      initialLoad: `${loadTime.toFixed(2)}ms`,
      domContentLoaded: `${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`,
      firstByte: `${navigation.responseStart - navigation.requestStart}ms`,
      totalLoadTime: `${navigation.loadEventEnd - navigation.loadEventStart}ms`
    });
  }
};

// Track on next tick and when fully loaded
setTimeout(trackLoadMetrics, 0);
window.addEventListener('load', () => {
  trackLoadMetrics();
  // Preload critical routes after initial load
  preloadCriticalRoutes();
});
