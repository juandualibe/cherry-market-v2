// api/models/Producto.js
const mongoose = require('mongoose');

// Sub-documento para precios por proveedor (esto se queda igual)
const PrecioProveedorSchema = new mongoose.Schema({
  proveedorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proveedor',
    required: true
  },
  proveedorNombre: {
    type: String,
    required: true
  },
  precio: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: true });

// --- ESQUEMA DEL PRODUCTO MAESTRO ---
const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    unique: true // Aseguramos que no haya dos "Coca-Cola 2.25L"
  },

  // --- ¡CAMBIO IMPORTANTE! ---
  // Ahora es un array de códigos.
  // Un producto puede tener múltiples códigos de barra.
  codigosDeBarras: [{
    type: String,
    trim: true,
    unique: true,
    sparse: true // Permite 'null' o arrays vacíos sin romper el 'unique'
  }],
  // --- FIN DEL CAMBIO ---

  descripcion: {
    type: String,
    trim: true
  },
  preciosProveedores: [PrecioProveedorSchema] 
}, {
  timestamps: true,
});


module.exports = mongoose.model('Producto', productoSchema);