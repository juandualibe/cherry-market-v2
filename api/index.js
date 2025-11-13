// api/index.js
// Este es nuestro nuevo "mini-server" para Vercel

// --- 1. MOVER 'path' AL INICIO ---
const path = require('path');
// --- 2. CONFIGURAR DOTENV USANDO 'path' ---
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// 'path' ya está definido arriba

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Conectar a MongoDB
// (Vercel es inteligente y cacheará esta conexión)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Rutas
// ¡Importante! Usamos './' porque los archivos están ahora
// en la misma carpeta 'api'
const clientesRoutes = require('./routes/clientes');
const proveedoresRoutes = require('./routes/proveedores');
const verduleriaRoutes = require('./routes/verduleria');
const migracionRoutes = require('./routes/migracion');
const ordenesRoutes = require('./routes/ordenes');
const productosRoues = require('./routes/productos');
const authRoutes = require('./routes/auth'); // <-- 3. AÑADIR RUTA AUTH (¡importante!)

app.use('/api/clientes', clientesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/verduleria', verduleriaRoutes);
app.use('/api/migracion', migracionRoutes);
app.use('/api/ordenes', ordenesRoutes); 
app.use('/api/productos', productosRoues);
app.use('/api/auth', authRoutes); // <-- 4. USAR RUTA AUTH (¡importante!)

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({ mensaje: '🍒 API de Cherry funcionando desde Vercel' });
});

// ¡LA MAGIA!
// En lugar de app.listen(), exportamos la app para que Vercel la use.
module.exports = app;

// --- Lógica para servidor local ---
// Si NO estamos en producción (Vercel), iniciamos un servidor local
if (process.env.NODE_ENV !== 'production') {
  // Usará el PORT que definiste en tu archivo .env (o 5000 si no existe)
  const PORT = process.env.PORT || 5000; 
  app.listen(PORT, () => {
    console.log(`✅ Servidor API local corriendo en http://localhost:${PORT}`);
  });
}
// --- FIN ---