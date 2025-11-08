// models/Deuda.js

const mongoose = require('mongoose');

const deudaSchema = new mongoose.Schema({
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
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

module.exports = mongoose.model('Deuda', deudaSchema);