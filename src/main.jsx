import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
// IMPORTANTE: Importamos el registro manual de PWA
import { registerSW } from 'virtual:pwa-register'; 
import './index.css';
import App from './App.jsx';

// Activamos la PWA inmediatamente
registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);