// models/OrdenCompra.js

const mongoose = require('mongoose');

const ordenCompraSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    unique: true
  },
  proveedorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Proveedor'
  },
  fecha: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'recibiendo', 'completada', 'cancelada'],
    default: 'pendiente'
  },
  observaciones: {
    type: String,
    default: ''
  },
  total: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OrdenCompra', ordenCompraSchema);