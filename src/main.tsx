import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './utils/performanceMonitoring'

// Start performance tracking
const startTime = performance.now();

// Register service worker for caching
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);

// Track initial load time
setTimeout(() => {
  const loadTime = performance.now() - startTime;
  console.log(`Initial app load time: ${loadTime.toFixed(2)}ms`);
}, 0);
