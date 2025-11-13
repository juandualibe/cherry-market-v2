import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function RegisterPage() {
  const { register } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(nombre, email, password);
      console.log("¡Registro exitoso! (Simulado)");
      // navigate("/dashboard"); 
    } catch (err) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  // Estilos para los inputs (para que se vean mejor)
  const inputStyle = {
    width: '100%',
    padding: '0.9rem 1rem',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxSizing: 'border-box',
    fontSize: '1rem',
  };

  return (
    // --- DIV CONTENEDOR (¡LA SOLUCIÓN!) ---
    <div 
      style={{
        position: 'fixed', // <-- Clave 1: Lo saca del layout
        top: 0,
        left: 0,
        width: '100vw',      // <-- Clave 2: Ancho total de la ventana
        height: '100vh',     // <-- Clave 3: Alto total de la ventana
        zIndex: 2000,        // <-- Clave 4: Se asegura que esté por encima de todo
        
        // Estilos que ya tenías para centrar el form:
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem', // Mantiene el espacio en bordes (ej. móvil)
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        boxSizing: 'border-box' // (Ya lo tenías en index.css, pero no hace mal)
      }}
    >
      {/* --- CAJA DEL FORMULARIO (Sin cambios) --- */}
      <div
        style={{
          maxWidth: "400px",
          width: "100%",
          padding: "2.5rem",
          background: "rgba(255, 255, 255, 0.98)",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(5px)",
        }}
      >
        <h1 style={{ textAlign: "center", marginTop: 0, color: '#16213e' }}>🍒 Cherry App</h1>
        <h2 style={{ textAlign: "center", marginBottom: "2rem", color: '#333' }}>
          Crear Cuenta
        </h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre Completo"
            required
            style={inputStyle} 
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={inputStyle}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            style={inputStyle}
          />
          {error && (
            <p
              style={{
                color: "var(--color-danger, #D32F2F)", // Usa tu variable CSS si existe
                margin: "-0.5rem 0 0.5rem 0",
                textAlign: "center",
                fontSize: "0.9rem",
                fontWeight: 500
              }}
            >
              {error}
            </p>
          )}
          <button 
            type="submit" 
            className="btn" // <-- ¡Ahora usará tu clase .btn de index.css!
            disabled={loading} 
            style={{
              marginTop: '0.5rem',
              width: '100%' // Para que ocupe todo el ancho
            }}
          >
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--color-text-secondary, #666)" }}>
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/login"
            style={{ color: "var(--color-primary, #007bff)", fontWeight: "600", textDecoration: 'none' }}
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;