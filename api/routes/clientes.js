// routes/clientes.js

const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
const Deuda = require('../models/Deuda');

// GET - Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// POST - Crear cliente
router.post('/', async (req, res) => {
  const cliente = new Cliente({
    nombre: req.body.nombre,
  });

  try {
    const nuevoCliente = await cliente.save();
    res.status(201).json(nuevoCliente);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// DELETE - Eliminar cliente (y sus deudas)
router.delete('/:id', async (req, res) => {
  try {
    await Cliente.findByIdAndDelete(req.params.id);
    await Deuda.deleteMany({ clienteId: req.params.id });
    res.json({ mensaje: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// GET - Obtener deudas de un cliente
router.get('/:id/deudas', async (req, res) => {
  try {
    const deudas = await Deuda.find({ clienteId: req.params.id });
    res.json(deudas);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// POST - Agregar deuda a un cliente
router.post('/:id/deudas', async (req, res) => {
  const deuda = new Deuda({
    clienteId: req.params.id,
    fecha: req.body.fecha,
    monto: req.body.monto,
  });

  try {
    const nuevaDeuda = await deuda.save();
    res.status(201).json(nuevaDeuda);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// DELETE - Eliminar deuda
router.delete('/deudas/:id', async (req, res) => {
  try {
    await Deuda.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Deuda eliminada' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// PUT /api/clientes/deudas/:deudaId - Editar una deuda
router.put('/deudas/:deudaId', async (req, res) => {
  try {
    const { deudaId } = req.params;
    const { fecha, monto } = req.body;

    const deuda = await Deuda.findByIdAndUpdate(
      deudaId,
      { fecha, monto },
      { new: true, runValidators: true }
    );

    if (!deuda) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    res.json(deuda);
  } catch (error) {
    console.error('Error al editar deuda:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;