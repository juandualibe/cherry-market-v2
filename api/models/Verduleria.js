// models/Verduleria.js

const mongoose = require('mongoose');

// Modelo de Mes
const mesSchema = new mongoose.Schema({
  mesId: {
    type: String,
    required: true,
    unique: true,
  },
  nombre: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Modelo de Venta
const ventaSchema = new mongoose.Schema({
  mesId: {
    type: String,
    required: true,
  },
  fecha: {
    type: Date,
    required: true,
  },
  diaSemana: {
    type: String,
    required: true,
  },
  costoMercaderia: {
    type: Number,
    required: true,
  },
  gastos: {
    type: Number,
    required: true,
  },
  venta: {
    type: Number,
    required: true,
  },
  margen: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

// Modelo de Gasto Fijo
const gastoFijoSchema = new mongoose.Schema({
  mesId: {
    type: String,
    required: true,
  },
  concepto: {
    type: String,
    required: true,
  },
  total: {
    type: Number,
    default: 0,
  },
  porcentaje: {
    type: Number,
    default: 0,
  },
  verduleria: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = {
  Mes: mongoose.model('Mes', mesSchema),
  Venta: mongoose.model('Venta', ventaSchema),
  GastoFijo: mongoose.model('GastoFijo', gastoFijoSchema),
};