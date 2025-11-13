import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
// import { apiRegister } from '../services/authApi'; // Crearemos este archivo en el sig. paso

function RegisterPage() {
  const { register } = useAuth(); // <--- AÑADE ESTA LÍNEA
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
      // ¡Ahora llamamos a la función real del contexto!
      await register(nombre, email, password); // No necesitamos hacer más nada, el AuthContext se encarga de redirigir a /pending-approval
    } catch (err) {
      // Si la API (o el contexto) lanza un error, lo mostramos
      setError(err.message || "Error al registrarse");
      setLoading(false);
    }
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
        Crear Cuenta
      </h2>
                 {" "}
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
             {" "}
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre Completo"
          required
        />
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
                    {loading ? "Registrando..." : "Crear cuenta"}       {" "}
        </button>
             {" "}
      </form>
                 {" "}
      <p style={{ textAlign: "center", marginTop: "1.5rem", color: "#666" }}>
                ¿Ya tienes cuenta?{" "}
        <Link
          to="/login"
          style={{ color: "var(--color-primary)", fontWeight: "600" }}
        >
          Inicia sesión
        </Link>
             {" "}
      </p>
         {" "}
    </div>
  );
}

export default RegisterPage;
