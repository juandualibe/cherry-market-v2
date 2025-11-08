// models/ProductoOrden.js

const mongoose = require('mongoose');

const productoOrdenSchema = new mongoose.Schema({
  ordenId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'OrdenCompra'
  },
  nombre: {
    type: String,
    required: true
  },
  codigoBarras: {
    type: String,
    required: true
  },
  cantidadPedida: {
    type: Number,
    required: true
  },
  cantidadRecibida: {
    type: Number,
    default: 0
  },
  precioUnitario: {
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