const mongoose = require('mongoose');

// Este es el "sub-documento" que guarda los precios por proveedor
const PrecioProveedorSchema = new mongoose.Schema({
  proveedorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proveedor',
    required: true
  },
  // Guardamos el nombre del proveedor aquí para
  // no tener que hacer 'populate' (búsquedas extra)
  proveedorNombre: {
    type: String,
    required: true
  },
  precio: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: true }); // Le decimos a Mongoose que cree un _id único para cada precio

const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  codigoBarras: {
    type: String,
    required: true,
    unique: true, // Forzamos a que no haya dos productos con el mismo código
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  // Aquí está la magia: un producto tiene un ARRAY de precios
  preciosProveedores: [PrecioProveedorSchema] 
}, {
  timestamps: true,
});

module.exports = mongoose.model('Producto', productoSchema);