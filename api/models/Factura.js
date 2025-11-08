// models/Factura.js

const mongoose = require('mongoose');

const facturaSchema = new mongoose.Schema({
  proveedorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proveedor',
    required: true,
  },
  fecha: {
    type: Date,
    required: true,
  },
  fechaVencimiento: {
    type: Date,
  },
  numero: {
    type: String,
    required: true,
  },
  monto: {
    type: Number,
    required: true,
  },
  rechazo: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Factura', facturaSchema);