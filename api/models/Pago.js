// models/Pago.js

const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema({
  proveedorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proveedor',
    required: true,
  },
  fecha: {
    type: Date,
    required: true,
  },
  monto: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Pago', pagoSchema);