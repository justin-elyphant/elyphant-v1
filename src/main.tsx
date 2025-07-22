import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Start performance tracking
const startTime = performance.now();

createRoot(document.getElementById("root")!).render(<App />);

// Track initial load time
setTimeout(() => {
  const loadTime = performance.now() - startTime;
  console.log(`Initial app load time: ${loadTime.toFixed(2)}ms`);
}, 0);
