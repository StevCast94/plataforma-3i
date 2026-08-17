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

// Retira el splash de index.html una vez React ya pintó el primer frame.
// requestAnimationFrame x2 asegura que el DOM real (no solo el commit de React)
// ya esté pintado antes de empezar el fade-out.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.getElementById('g3i-splash')?.setAttribute('data-hide', '');
    document.body.classList.add('g3i-ready');
  });
});
