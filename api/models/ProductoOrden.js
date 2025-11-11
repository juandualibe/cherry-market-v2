// api/models/ProductoOrden.js
const mongoose = require('mongoose');

const productoOrdenSchema = new mongoose.Schema({
  ordenId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'OrdenCompra'
  },
  
  // --- ¡CAMBIO IMPORTANTE! ---
  // Ya no guardamos nombre/código, linkeamos al catálogo
  productoMaestroId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Producto'
  },
  // Guardamos estos datos "cacheados" para no tener que buscarlos
  // cada vez que listamos la orden
  nombre: {
    type: String,
    required: true,
  },
  codigoBarrasPrincipal: {
    type: String, // Guardamos el primer código, solo como referencia
    required: true,
  },
  // --- FIN DEL CAMBIO ---
  
  cantidadPedida: {
    type: Number,
    required: true
  },
  cantidadRecibida: {
    type: Number,
    default: 0
  },

  // Guardamos el precio al que se compró EN ESTA ORDEN
  precioUnitarioAcordado: {
    type: Number,
    required: true
  },
  
  recibido: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductoOrden', productoOrdenSchema);