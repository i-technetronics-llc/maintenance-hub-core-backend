import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { register as registerServiceWorker, setupInstallPrompt } from './utils/serviceWorkerRegistration';
import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

// Register service worker for PWA support
if (import.meta.env.PROD) {
  registerServiceWorker();
  setupInstallPrompt();
}

// Log PWA status
if ('serviceWorker' in navigator) {
  console.log('[PWA] Service Worker support detected');
} else {
  console.log('[PWA] Service Worker not supported in this browser');
}
