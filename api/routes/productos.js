const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const Proveedor = require('../models/Proveedor'); // Necesitamos esto
const auth = require('../middleware/auth'); // Lo protegemos de una

// GET /api/productos - Obtener TODOS los productos del catálogo
router.get('/', auth, async (req, res) => {
  try {
    // Usamos .select() para traer solo lo necesario para un dropdown
    const productos = await Producto.find().select('nombre codigoBarras');
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/productos/:id - Obtener UN producto con todos sus precios
router.get('/:id', auth, async (req, res) => {
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
router.post('/', auth, async (req, res) => {
  try {
    const { nombre, codigoBarras, descripcion } = req.body;
    const nuevoProducto = new Producto({ nombre, codigoBarras, descripcion });
    await nuevoProducto.save();
    res.status(201).json(nuevoProducto);
  } catch (error) {
    // Error 11000 es 'código duplicado' (unique: true)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ya existe un producto con ese código de barras' });
    }
    res.status(400).json({ error: error.message });
  }
});

// --- RUTAS CLAVE PARA PRECIOS ---

// POST /api/productos/:id/precios - Agregar un precio de proveedor a un producto
router.post('/:id/precios', auth, async (req, res) => {
  try {
    const { proveedorId, precio } = req.body;
    
    // 1. Buscamos el producto
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // 2. Buscamos el proveedor para obtener su nombre
    const proveedor = await Proveedor.findById(proveedorId);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    // 3. (Opcional) Verificamos si ya existe un precio para este proveedor
    const precioExistente = producto.preciosProveedores.find(
      (p) => p.proveedorId.toString() === proveedorId
    );

    if (precioExistente) {
      // Si ya existe, lo actualizamos
      precioExistente.precio = precio;
    } else {
      // Si no existe, lo agregamos al array
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
router.delete('/:id/precios/:precioId', auth, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Buscamos el sub-documento del precio y lo quitamos
    producto.preciosProveedores.pull({ _id: req.params.precioId });
    
    await producto.save();
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;