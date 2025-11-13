const API_URL = '/api/auth';

/**
 * Registra un nuevo usuario.
 * @param {string} nombre 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>} Respuesta del servidor
 */
export const apiRegister = async (nombre, email, password) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
  	// Si no es OK, lanza un error con el mensaje del backend
  	throw new Error(data.mensaje || 'Error al registrarse');
  }
  return data; // Devuelve { mensaje: "..." }
};

/**
 * Inicia sesión de un usuario.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>} { token, user: {...} }
 */
export const apiLogin = async (email, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
  	// Si no es OK, lanza un error con el mensaje del backend
  	throw new Error(data.mensaje || 'Credenciales inválidas');
  }
  return data; // Devuelve { token, user }
};