import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fortawesome/fontawesome-free/css/all.min.css'

// Toggle this to test refactored version
const USE_REFACTOR = true;

// Lazy load components to avoid loading unnecessary styles
const loadApp = async () => {
  if (USE_REFACTOR) {
    const module = await import('./_refactor/BadmintonQueue_refactor.jsx');
    return module.default;
  } else {
    const module = await import('./BadmintonQueue.jsx');
    return module.default;
  }
};

// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);

        // Check for updates on visibility change
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            registration.update();
          }
        });

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available, could show a notification
              console.log('New content available! Refresh to update.');
            }
          });
        });
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Load and render the app
loadApp().then(BadmintonQueue => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BadmintonQueue />
    </StrictMode>,
  )
})
