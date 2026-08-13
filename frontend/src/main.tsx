/**
 * Application Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import App from './App';
import { ThemeProvider } from '@store/ThemeContext';
import { AuthProvider } from '@context/AuthContextProvider';
import '@styles/globals.css';

console.log('[Main] All imports complete');

try {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Root element not found');
  }

  console.log('[Main] Rendering...');

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );

  console.log('[Main] Render complete');
} catch (err) {
  console.error('[Main] Error:', err);
  document.body.innerHTML = '<h1>Error: ' + (err as Error).message + '</h1><pre>' + (err as Error).stack + '</pre>';
}

