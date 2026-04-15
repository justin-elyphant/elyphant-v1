const SERVICE_WORKER_VERSION = '2026-04-15-cache-refresh';

// Register service worker for caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  let isRefreshing = false;

  const refreshToLatestVersion = () => {
    if (isRefreshing) return;
    isRefreshing = true;
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener('controllerchange', refreshToLatestVersion);

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`/sw.js?v=${SERVICE_WORKER_VERSION}`)
      .then(async (registration) => {
        console.log('Service Worker registered successfully:', registration.scope);

        await registration.update().catch((error) => {
          console.log('Service Worker update check failed:', error);
        });

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker available, activating latest version');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

export {};