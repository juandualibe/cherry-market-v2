import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiLogin, apiRegister } from '../services/authApi';
import { jwtDecode } from 'jwt-decode'; // ¡Necesitaremos instalar esto!

// 1. Crear el Contexto
const AuthContext = createContext(null);

// 2. Crear el Proveedor del Contexto
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // Estado de carga inicial
  const navigate = useNavigate();

  // 3. Efecto para cargar el token desde localStorage al iniciar
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token');
    if (tokenGuardado) {
  	try {
  	  // Verificamos si el token no ha expirado
  	  const decodedToken = jwtDecode(tokenGuardado);
  	  if (decodedToken.exp * 1000 > Date.now()) {
  		// Si el token es válido, cargamos los datos del usuario
  		setToken(tokenGuardado);
  		const userGuardado = localStorage.getItem('user');
  		if (userGuardado) {
  		  setUser(JSON.parse(userGuardado));
  		}
  	  } else {
  		// Si el token expiró, lo limpiamos
  		localStorage.removeItem('token');
  		localStorage.removeItem('user');
  	  }
  	} catch (error) {
  	  console.error("Error decodificando token:", error);
  	  localStorage.removeItem('token');
  	  localStorage.removeItem('user');
  	}
    }
    setLoading(false); // Terminamos la carga inicial
  }, []);

  // 4. Función de Login
  const login = async (email, password) => {
    try {
  	  // Llamamos a la API de login
  	  const data = await apiLogin(email, password); 
  	  
  	  // Guardamos todo
  	  setUser(data.user);
  	  setToken(data.token);
  	  localStorage.setItem('user', JSON.stringify(data.user));
  	  localStorage.setItem('token', data.token);
  	  
  	  // Redirigimos al Dashboard
  	  navigate('/'); 
  	} catch (error) {
  	  console.error("Error en login:", error.message);
  	  // Re-lanzamos el error para que el formulario de LoginPage lo muestre
  	  throw error; 
  	}
  };

  // 5. Función de Registro
  const register = async (nombre, email, password) => {
    try {
  	  // Llamamos a la API de registro
  	  const data = await apiRegister(nombre, email, password);
  	  
  	  // Redirigimos a la página de espera
  	  navigate('/pending-approval');
  	  return data;
  	} catch (error) {
  	  console.error("Error en registro:", error.message);
  	  // Re-lanzamos el error para que el formulario de RegisterPage lo muestre
  	  throw error;
  	}
  };

  // 6. Función de Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login'); // Llevamos al login
  };

  // 7. Valor que compartiremos con toda la app
  const value = {
    user,
    token,
  	loading, // Para saber si ya comprobó el token inicial
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 8. Exportamos el contexto para usarlo en el hook
export default AuthContext;