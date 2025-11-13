import React from "react";
// 1. Quita BrowserRouter, añade Navigate y Outlet
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// 2. Importa el hook de autenticación
import { useAuth } from "./hooks/useAuth"; 

// Componente de Layout (ya estaba)
import Navegacion from "./components/Navegacion.jsx";

// Páginas Principales (Protegidas) (ya estaban)
import Inicio from "./pages/Inicio.jsx";
import Clientes from "./pages/Clientes.jsx";
import Proveedores from "./pages/Proveedores.jsx";
import Verduleria from "./pages/Verduleria.jsx";
// FIX: Añadimos .jsx a las rutas que faltaban
import OrdenesCompra from "./pages/OrdenesCompra.jsx";
import DetalleOrden from "./pages/DetalleOrden.jsx";
import Productos from "./pages/Productos.jsx";

// 3. Importa las nuevas páginas de autenticación
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import PendingPage from "./pages/PendingPage.jsx";


/**
 * COMPONENTE "GUARDIÁN" PARA RUTAS PROTEGIDAS
 * - Muestra "Verificando..." mientras carga el estado de auth.
 * - Si el usuario NO está logueado, lo redirige a /login.
 * - Si el usuario SÍ está logueado, muestra el Layout (Navegacion) 
 * y el contenido de la ruta anidada (Outlet).
 */
function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    // Muestra esto mientras verifica el token en localStorage
    return <div style={{ padding: '5rem', textAlign: 'center', fontSize: '1.2rem' }}>Verificando sesión...</div>;
  }

  if (!user) {
    // Si no hay usuario (y ya no está cargando), redirige a login
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, muestra el layout de la app
  return (
    <div className="app-container">
      <Navegacion />
      <div className="main-wrapper">
        <main className="page-content">
          {/* Outlet renderiza la ruta anidada (Inicio, Clientes, etc.) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/**
 * COMPONENTE "GUARDIÁN" PARA RUTAS PÚBLICAS
 * - Muestra "Verificando..." mientras carga.
 * - Si el usuario YA está logueado, lo redirige al Dashboard (/).
 * - Si NO está logueado, le permite ver Login y Register (Outlet).
 */
function PublicLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '5rem', textAlign: 'center', fontSize: '1.2rem' }}>Verificando sesión...</div>;
  }

  if (user) {
    // Si ya está logueado, no puede ver el login de nuevo
    return <Navigate to="/" replace />;
  }
  
  // Muestra Login o Register
  return <Outlet />;
}

// 4. Función App actualizada
function App() {
  // Quitamos BrowserRouter (ahora está en main.jsx)
  return (
    <>
      {/* Ponemos Toaster aquí para que funcione en TODA la app */}
      <Toaster />
      
      {/* Esta es la nueva estructura de rutas */}
      <Routes>
        
        {/* RUTAS PÚBLICAS (Solo para no logueados) */}
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        
        {/* RUTA DE ESPERA (Pública para que se vea fácil) */}
        <Route path="/pending-approval" element={<PendingPage />} />

        {/* RUTAS PROTEGIDAS (Toda tu app va aquí adentro) */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/verduleria" element={<Verduleria />} />
          <Route path="/ordenes" element={<OrdenesCompra />} />
          <Route path="/ordenes/:ordenId" element={<DetalleOrden />} />
          <Route path="/productos" element={<Productos />} />
        </Route>
        
        {/* Redirección por si se escribe cualquier otra cosa */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </>
  );
}

export default App;