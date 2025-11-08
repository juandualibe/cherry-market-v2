// routes/proveedores.js

const express = require('express');
const router = express.Router();
const Proveedor = require('../models/Proveedor');
const Factura = require('../models/Factura');
const Pago = require('../models/Pago');

// GET - Obtener todos los proveedores
router.get('/', async (req, res) => {
  try {
    const proveedores = await Proveedor.find();
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// POST - Crear proveedor
router.post('/', async (req, res) => {
  const proveedor = new Proveedor({
    nombre: req.body.nombre,
  });

  try {
    const nuevoProveedor = await proveedor.save();
    res.status(201).json(nuevoProveedor);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// DELETE - Eliminar proveedor (y sus facturas y pagos)
router.delete('/:id', async (req, res) => {
  try {
    await Proveedor.findByIdAndDelete(req.params.id);
    await Factura.deleteMany({ proveedorId: req.params.id });
    await Pago.deleteMany({ proveedorId: req.params.id });
    res.json({ mensaje: 'Proveedor eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// GET - Obtener facturas de un proveedor
router.get('/:id/facturas', async (req, res) => {
  try {
    const facturas = await Factura.find({ proveedorId: req.params.id });
    res.json(facturas);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// POST - Agregar factura
router.post('/:id/facturas', async (req, res) => {
  const factura = new Factura({
    proveedorId: req.params.id,
    fecha: req.body.fecha,
    fechaVencimiento: req.body.fechaVencimiento,
    numero: req.body.numero,
    monto: req.body.monto,
    rechazo: req.body.rechazo || 0,
  });

  try {
    const nuevaFactura = await factura.save();
    res.status(201).json(nuevaFactura);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// PUT - Editar factura
router.put('/facturas/:id', async (req, res) => {
  try {
    const facturaActualizada = await Factura.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(facturaActualizada);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// DELETE - Eliminar factura
router.delete('/facturas/:id', async (req, res) => {
  try {
    await Factura.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Factura eliminada' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// GET - Obtener pagos de un proveedor
router.get('/:id/pagos', async (req, res) => {
  try {
    const pagos = await Pago.find({ proveedorId: req.params.id });
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// POST - Agregar pago
router.post('/:id/pagos', async (req, res) => {
  const pago = new Pago({
    proveedorId: req.params.id,
    fecha: req.body.fecha,
    monto: req.body.monto,
  });

  try {
    const nuevoPago = await pago.save();
    res.status(201).json(nuevoPago);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// PUT - Editar pago
router.put('/pagos/:id', async (req, res) => {
  try {
    const pagoActualizado = await Pago.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(pagoActualizado);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// DELETE - Eliminar pago
router.delete('/pagos/:id', async (req, res) => {
  try {
    await Pago.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Pago eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

module.exports = router;