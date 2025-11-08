// api/index.js
// Este es nuestro nuevo "mini-server" para Vercel

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

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

app.use('/api/clientes', clientesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/verduleria', verduleriaRoutes);
app.use('/api/migracion', migracionRoutes);
app.use('/api/ordenes', ordenesRoutes); 

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({ mensaje: '🍒 API de Cherry funcionando desde Vercel' });
});

// ¡LA MAGIA!
// En lugar de app.listen(), exportamos la app para que Vercel la use.
module.exports = app;