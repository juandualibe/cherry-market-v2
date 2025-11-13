const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Asegúrate de haber corrido npm install bcrypt
const jwt = require('jsonwebtoken'); // Asegúrate de haber corrido npm install jsonwebtoken
const User = require('../models/User'); // Importamos el modelo

// --- RUTA DE REGISTRO ---
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
  	const { nombre, email, password } = req.body;

  	// 1. Verificar si el email ya existe
  	let user = await User.findOne({ email });
  	if (user) {
  	  return res.status(400).json({ mensaje: 'El email ya está registrado' });
  	}

  	// 2. Crear el nuevo usuario (la contraseña se hashea sola gracias al .pre('save') del modelo)
  	user = new User({
  	  nombre,
  	  email,
  	  password,
  	  estado: 'pendiente', // ¡Estado clave!
  	  rol: 'usuario'
  	});

  	// 3. Guardar en la BD
  	await user.save();

  	// 4. Responder
  	res.status(201).json({ 
  	  mensaje: 'Usuario registrado exitosamente. Pendiente de aprobación.' 
  	});

  } catch (error) {
  	console.error(error);
  	res.status(500).json({ mensaje: 'Error del servidor al registrar', error: error.message });
  }
});

// --- RUTA DE LOGIN ---
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
  	const { email, password } = req.body;

  	// 1. Buscar al usuario por email
  	const user = await User.findOne({ email });
  	if (!user) {
  	  return res.status(400).json({ mensaje: 'Credenciales inválidas' });
  	}

  	// 2. Comparar la contraseña ingresada con la guardada (hasheada)
  	const isMatch = await bcrypt.compare(password, user.password);
  	if (!isMatch) {
  	  return res.status(400).json({ mensaje: 'Credenciales inválidas' });
  	}

  	// 3. ¡LA VALIDACIÓN CLAVE! Verificar si está aprobado
  	if (user.estado !== 'aprobado') {
  	  if (user.estado === 'pendiente') {
  		return res.status(403).json({ mensaje: 'Tu cuenta está pendiente de aprobación' });
  	  }
  	  if (user.estado === 'rechazado') {
  		return res.status(403).json({ mensaje: 'Tu cuenta ha sido rechazada' });
  	  }
  	}
  	
  	// 4. Si todo está OK, crear el Token (JWT)
  	const payload = {
  	  userId: user._id,
  	  rol: user.rol,
  	  nombre: user.nombre
  	};

  	const token = jwt.sign(
  	  payload,
  	  process.env.JWT_SECRET, // Usamos el secreto del .env
  	  { expiresIn: '1d' } // El token dura 1 día
  	);

  	// 5. Enviar el token y los datos del usuario al frontend
  	res.json({
  	  token,
  	  user: {
  		id: user._id,
  		nombre: user.nombre,
  		email: user.email,
  		rol: user.rol
  	  }
  	});

  } catch (error) {
  	console.error(error);
  	res.status(500).json({ mensaje: 'Error del servidor al iniciar sesión', error: error.message });
  }
});

module.exports = router;