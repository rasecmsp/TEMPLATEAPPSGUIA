
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import { AuthProvider } from './contexts/AuthContext';
import { GuideProvider } from './contexts/GuideContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <GuideProvider>
        <App />
      </GuideProvider>
    </AuthProvider>
  </React.StrictMode>
);
