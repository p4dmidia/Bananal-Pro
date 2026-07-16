import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';

// Catch chunk loading errors (typical in SPA redeployments) and force page reload
window.addEventListener('error', (event) => {
  const errorText = event.message || '';
  const isChunkError = errorText.includes('Loading chunk') || 
                       errorText.includes('Failed to fetch dynamically imported module') ||
                       (event.error && (event.error.name === 'ChunkLoadError' || event.error.message?.includes('dynamically imported module')));
  
  if (isChunkError) {
    console.warn('Chunk load error detected, reloading page to fetch latest version...', event.error);
    window.location.reload();
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (reason && (reason.name === 'ChunkLoadError' || reason.message?.includes('Failed to fetch dynamically imported module') || reason.message?.includes('Loading chunk'))) {
    console.warn('Unhandled chunk load rejection, reloading page to fetch latest version...', reason);
    window.location.reload();
  }
});

// Force unregister any existing service worker and clear caches to prevent cache issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister().then(success => {
        if (success) console.log('SW unregistered successfully.');
      });
    }
  });
}

if ('caches' in window) {
  caches.keys().then(keys => {
    for (const key of keys) {
      caches.delete(key).then(success => {
        if (success) console.log('Cache storage cleared:', key);
      });
    }
  });
}

import { Toaster } from 'sonner';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>,
);
