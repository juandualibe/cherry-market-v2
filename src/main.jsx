import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // <-- 1. Importar el Provider
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> {/* <--- 2. Envolver todo con el Router */}
      <AuthProvider> {/* <--- 3. Envolver App con el AuthProvider */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);