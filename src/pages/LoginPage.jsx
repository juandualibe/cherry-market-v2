import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// 'onLogin' es una 'prop' que conectaremos luego.
// Vendrá de nuestro "Contexto de Autenticación"
function LoginPage() {
  const { login } = useAuth(); // <--- AÑADE ESTA LÍNEA
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // ¡Ahora llamamos a la función real del contexto!
      await login(email, password); // No necesitamos hacer más nada, el AuthContext se encarga de redirigir
    } catch (err) {
      // Si la API (o el contexto) lanza un error, lo mostramos
      setError(err.message || "Error al iniciar sesión");
      setLoading(false);
    } // No necesitamos setLoading(false) aquí, porque la página redirigirá
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "5rem auto",
        padding: "2rem",
        background: "white",
        borderRadius: "12px",
        boxShadow: "var(--shadow-lg)",
      }}
    >
            <h1 style={{ textAlign: "center", marginTop: 0 }}>🍒 Cherry App</h1>
           {" "}
      <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>
        Iniciar Sesión
      </h2>
                 {" "}
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
               {" "}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
               {" "}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
        />
                     {" "}
        {error && (
          <p
            style={{
              color: "var(--color-danger)",
              margin: 0,
              textAlign: "center",
              fontSize: "0.9rem",
            }}
          >
                  {error}     {" "}
          </p>
        )}
               {" "}
        <button type="submit" className="btn" disabled={loading}>
                    {loading ? "Ingresando..." : "Ingresar"}       {" "}
        </button>
             {" "}
      </form>
                 {" "}
      <p style={{ textAlign: "center", marginTop: "1.5rem", color: "#666" }}>
                ¿No tienes cuenta?{" "}
        <Link
          to="/register"
          style={{ color: "var(--color-primary)", fontWeight: "600" }}
        >
          Regístrate
        </Link>
             {" "}
      </p>
         {" "}
    </div>
  );
}

export default LoginPage;
