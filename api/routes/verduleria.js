// routes/verduleria.js

const express = require('express');
const router = express.Router();
const { Mes, Venta, GastoFijo } = require('../models/Verduleria');

// ========== MESES ==========

// GET - Obtener todos los meses
router.get('/meses', async (req, res) => {
  try {
    const meses = await Mes.find().sort({ mesId: -1 });
    res.json(meses);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// POST - Crear mes
router.post('/meses', async (req, res) => {
  const mes = new Mes({
    mesId: req.body.mesId,
    nombre: req.body.nombre,
  });

  try {
    const nuevoMes = await mes.save();
    res.status(201).json(nuevoMes);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// DELETE - Eliminar mes (y sus ventas y gastos)
router.delete('/meses/:mesId', async (req, res) => {
  try {
    await Mes.findOneAndDelete({ mesId: req.params.mesId });
    await Venta.deleteMany({ mesId: req.params.mesId });
    await GastoFijo.deleteMany({ mesId: req.params.mesId });
    res.json({ mensaje: 'Mes eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// ========== VENTAS ==========

// GET - Obtener ventas de un mes
router.get('/meses/:mesId/ventas', async (req, res) => {
  try {
    const ventas = await Venta.find({ mesId: req.params.mesId }).sort({ fecha: 1 });
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// POST - Agregar venta
router.post('/meses/:mesId/ventas', async (req, res) => {
  const venta = new Venta({
    mesId: req.params.mesId,
    fecha: req.body.fecha,
    diaSemana: req.body.diaSemana,
    costoMercaderia: req.body.costoMercaderia,
    gastos: req.body.gastos,
    venta: req.body.venta,
    margen: req.body.margen,
  });

  try {
    const nuevaVenta = await venta.save();
    res.status(201).json(nuevaVenta);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// PUT - Editar venta
router.put('/ventas/:id', async (req, res) => {
  try {
    const ventaActualizada = await Venta.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(ventaActualizada);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// DELETE - Eliminar venta
router.delete('/ventas/:id', async (req, res) => {
  try {
    await Venta.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Venta eliminada' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// ========== GASTOS FIJOS ==========

// GET - Obtener gastos fijos de un mes
router.get('/meses/:mesId/gastos', async (req, res) => {
  try {
    const gastos = await GastoFijo.find({ mesId: req.params.mesId });
    res.json(gastos);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// POST - Agregar gasto fijo
router.post('/meses/:mesId/gastos', async (req, res) => {
  const gasto = new GastoFijo({
    mesId: req.params.mesId,
    concepto: req.body.concepto,
    total: req.body.total || 0,
    porcentaje: req.body.porcentaje || 0,
    verduleria: req.body.verduleria || 0,
  });

  try {
    const nuevoGasto = await gasto.save();
    res.status(201).json(nuevoGasto);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// PUT - Editar gasto fijo
router.put('/gastos/:id', async (req, res) => {
  try {
    const gastoActualizado = await GastoFijo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(gastoActualizado);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// DELETE - Eliminar gasto fijo
router.delete('/gastos/:id', async (req, res) => {
  try {
    await GastoFijo.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Gasto eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

module.exports = router;