/**
 * Main Entry Point (Routed Version)
 * Uses React Router for module-based navigation
 * 
 * To switch to this version:
 * 1. Rename main.jsx to main-legacy.jsx
 * 2. Rename main-routed.tsx to main.tsx
 * 3. Update index.html to point to main.tsx
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
