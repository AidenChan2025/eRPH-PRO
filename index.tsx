import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './src/i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <App />
);

// Signal that React has successfully mounted
(window as any).erphLoaded = true;