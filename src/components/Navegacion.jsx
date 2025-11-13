// src/components/Navegacion.jsx

import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Navegacion() {
  const { user, logout } = useAuth(); // <-- AÑADE ESTA LÍNEA
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // --- INICIO: Lógica para calcular iniciales ---
  let avatarInitials = '?'; // Valor por defecto si el usuario no ha cargado
  if (user && user.nombre) {
    const words = user.nombre.split(' ');
    const firstInitial = words[0] ? words[0][0] : '';
    const lastInitial = words.length > 1 ? words[words.length - 1][0] : '';
    avatarInitials = (firstInitial + lastInitial).toUpperCase();
  }
  // --- FIN: Lógica para calcular iniciales ---

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        <span className={`hamburger ${isMobileOpen ? "open" : ""}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {isMobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${
          isMobileOpen ? "mobile-open" : ""
        }`}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🍒</span>
            {!isCollapsed && <span className="logo-text">Cherry App</span>}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle sidebar"
            title={isCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            onClick={handleNavClick}
          >
            <span className="nav-icon">🏠</span>
            {!isCollapsed && <span className="nav-text">Dashboard</span>}
          </NavLink>

          <NavLink
            to="/clientes"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            onClick={handleNavClick}
          >
            <span className="nav-icon">👥</span>
            {!isCollapsed && <span className="nav-text">Clientes</span>}
          </NavLink>

          <NavLink
            to="/proveedores"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            onClick={handleNavClick}
          >
            <span className="nav-icon">🏢</span>
            {!isCollapsed && <span className="nav-text">Proveedores</span>}
          </NavLink>

          <NavLink
            to="/verduleria"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            onClick={handleNavClick}
          >
            <span className="nav-icon">🥬</span>
            {!isCollapsed && <span className="nav-text">Verdulería</span>}
          </NavLink>

          {/* --- 1. AQUÍ ESTÁ EL LINK A PRODUCTOS --- */}
          <NavLink
            to="/productos"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            onClick={handleNavClick}
          >
            <span className="nav-icon">🏷️</span>
            {!isCollapsed && <span className="nav-text">Productos</span>}
          </NavLink>
          <NavLink
          to="/ordenes"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          onClick={handleNavClick}
        >
          <span className="nav-icon">📦</span>
          {!isCollapsed && <span className="nav-text">Órdenes</span>}
        </NavLink>
        </nav>

        

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{avatarInitials}</div>
            {!isCollapsed && (
              <div className="user-details">
                <div className="user-name">
                  {user ? user.nombre : "Cargando..."}
                </div>
                <div className="user-role">{user ? user.rol : "..."}</div>
              </div>
            )}
            
          </div>
        </div>
        {/* --- ¡AQUÍ ESTÁ EL BOTÓN DE LOGOUT! --- */}       {" "}
            {!isCollapsed && (
              <button
                onClick={logout}
                className="btn"
                style={{
                  width: "calc(100% - 2rem)",
                  margin: "0.5rem 1rem 1rem 1rem",
                  backgroundColor: "var(--color-danger)",
                  fontSize: "0.9rem",
                  padding: "0.75rem",
                }}
              >
                            Cerrar Sesión          {" "}
              </button>
            )}
                    {/* --- FIN DEL BLOQUE AÑADIDO --- */}
      </aside>
    </>
  );
}

export default Navegacion;
