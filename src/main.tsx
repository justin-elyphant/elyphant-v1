import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@fontsource/oswald/400.css";
import "@fontsource/oswald/700.css";

// Enhanced performance tracking
const startTime = performance.now();
const isLandingPage = window.location.pathname.startsWith("/lp/");

// Optimize initial render
const container = document.getElementById("root")!;
const root = createRoot(container);

const renderApp = async () => {
  const { default: RootApp } = isLandingPage
    ? await import("./LandingApp")
    : await import("./App");

  // Use concurrent rendering for better performance
  root.render(
    <StrictMode>
      <RootApp />
    </StrictMode>
  );

  if (!isLandingPage) {
    // Register service worker for performance optimizations
    await import("./utils/serviceWorkerRegistration");
  }
};

void renderApp();

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
  
  if (isLandingPage) return;

  // Preload critical marketplace components after initial load
  import('./components/marketplace/bundles/MarketplaceBundles').then(({ preloadSearchComponents, preloadProductComponents }) => {
    preloadSearchComponents();
    preloadProductComponents();
  });
});
