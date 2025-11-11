// api/routes/productos.js

const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const Proveedor = require('../models/Proveedor');

// GET /api/productos - Obtener TODOS los productos del catálogo
router.get('/', async (req, res) => {
  try {
    // --- ¡AQUÍ ESTABA EL ERROR! ---
    // Decía 'codigoBarras' en singular. Ahora dice 'codigosDeBarras' en plural.
    const productos = await Producto.find().select('nombre codigosDeBarras').lean();
    // --- FIN DEL ARREGLO ---
    
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
    
    const nuevoProducto = new Producto({ 
      nombre, 
      codigosDeBarras: [codigoBarras], // Se guarda como un array
      descripcion 
    });
    
    await nuevoProducto.save();
    res.status(201).json(nuevoProducto);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ya existe un producto con ese nombre o código de barras' });
    }
    res.status(400).json({ error: error.message });
  }
});

// --- RUTAS CLAVE PARA PRECIOS ---

// POST /api/productos/:id/codigos - Agregar un CÓDIGO DE BARRAS a un producto
router.post('/:id/codigos', async (req, res) => {
  try {
    const { codigoBarras } = req.body;
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // $addToSet evita duplicados
    await Producto.updateOne(
      { _id: req.params.id },
      { $addToSet: { codigosDeBarras: codigoBarras } }
    );
    
    res.status(200).json({ mensaje: 'Código agregado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/productos/:id/precios - Agregar un PRECIO de proveedor a un producto
router.post('/:id/precios', async (req, res) => {
  try {
    const { proveedorId, precio } = req.body;
    
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    const proveedor = await Proveedor.findById(proveedorId);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    
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

// DELETE /api/productos/:id/precios/:precioId - Quitar un PRECIO de un producto
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