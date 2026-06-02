import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// IMPORTANTE: el Router vive solo en App.tsx (HashRouter).
// No envolver aquí para evitar el bug de doble Router con React 19.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
