const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const Proveedor = require('../models/Proveedor');

// GET /api/productos - Obtener TODOS los productos del catálogo
router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find().select('nombre codigoBarras');
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/productos/:id - Obtener UN producto con todos sus precios
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/productos - Crear un nuevo producto MAESTRO
router.post('/', async (req, res) => {
  try {
    const { nombre, codigoBarras, descripcion } = req.body;
    const nuevoProducto = new Producto({ nombre, codigoBarras, descripcion });
    await nuevoProducto.save();
    res.status(201).json(nuevoProducto);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ya existe un producto con ese código de barras' });
    }
    res.status(400).json({ error: error.message });
  }
});

// --- RUTAS CLAVE PARA PRECIOS ---

// POST /api/productos/:id/precios - Agregar un precio de proveedor a un producto
router.post('/:id/precios', async (req, res) => {
  try {
    const { proveedorId, precio } = req.body;
    
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const proveedor = await Proveedor.findById(proveedorId);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    const precioExistente = producto.preciosProveedores.find(
      (p) => p.proveedorId.toString() === proveedorId
    );

    if (precioExistente) {
      precioExistente.precio = precio;
    } else {
      producto.preciosProveedores.push({
        proveedorId: proveedorId,
        proveedorNombre: proveedor.nombre,
        precio: precio
      });
    }

    await producto.save();
    res.status(201).json(producto);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/productos/:id/precios/:precioId - Quitar un precio de un producto
router.delete('/:id/precios/:precioId', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    producto.preciosProveedores.pull({ _id: req.params.precioId });
    
    await producto.save();
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;