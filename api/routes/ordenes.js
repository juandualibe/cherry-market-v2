// routes/ordenes.js

const express = require('express');
const router = express.Router();
const OrdenCompra = require('../models/OrdenCompra');
const ProductoOrden = require('../models/ProductoOrden');

// Generar número de orden automático
const generarNumeroOrden = async () => {
  const año = new Date().getFullYear();
  const ultimaOrden = await OrdenCompra.findOne()
    .sort({ createdAt: -1 })
    .limit(1);
  
  let numeroSecuencial = 1;
  if (ultimaOrden && ultimaOrden.numero.startsWith(`OC-${año}-`)) {
    const partes = ultimaOrden.numero.split('-');
    numeroSecuencial = parseInt(partes[2]) + 1;
  }
  
  return `OC-${año}-${String(numeroSecuencial).padStart(3, '0')}`;
};

// GET /api/ordenes - Obtener todas las órdenes
router.get('/', async (req, res) => {
  try {
    const ordenes = await OrdenCompra.find().sort({ createdAt: -1 });
    res.json(ordenes);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ordenes/:id - Obtener una orden específica
router.get('/:id', async (req, res) => {
  try {
    const orden = await OrdenCompra.findById(req.params.id);
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.json(orden);
  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ordenes - Crear nueva orden
router.post('/', async (req, res) => {
  try {
    const { proveedorId, fecha, observaciones } = req.body;
    
    const numero = await generarNumeroOrden();
    
    const nuevaOrden = new OrdenCompra({
      numero,
      proveedorId,
      fecha: fecha || new Date(),
      observaciones: observaciones || ''
    });
    
    await nuevaOrden.save();
    res.status(201).json(nuevaOrden);
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/ordenes/:id - Actualizar orden
router.put('/:id', async (req, res) => {
  try {
    const { estado, observaciones, total } = req.body;
    
    const orden = await OrdenCompra.findByIdAndUpdate(
      req.params.id,
      { estado, observaciones, total },
      { new: true, runValidators: true }
    );
    
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    res.json(orden);
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/ordenes/:id - Eliminar orden
router.delete('/:id', async (req, res) => {
  try {
    // Eliminar todos los productos de la orden
    await ProductoOrden.deleteMany({ ordenId: req.params.id });
    
    // Eliminar la orden
    const orden = await OrdenCompra.findByIdAndDelete(req.params.id);
    
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    res.json({ message: 'Orden eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ordenes/:ordenId/productos - Obtener productos de una orden
router.get('/:ordenId/productos', async (req, res) => {
  try {
    const productos = await ProductoOrden.find({ ordenId: req.params.ordenId });
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ordenes/:ordenId/productos - Agregar producto a orden
router.post('/:ordenId/productos', async (req, res) => {
  try {
    const { nombre, codigoBarras, cantidadPedida, precioUnitario } = req.body;
    
    const nuevoProducto = new ProductoOrden({
      ordenId: req.params.ordenId,
      nombre,
      codigoBarras,
      cantidadPedida,
      precioUnitario
    });
    
    await nuevoProducto.save();
    
    // Actualizar total de la orden
    const productos = await ProductoOrden.find({ ordenId: req.params.ordenId });
    const total = productos.reduce((sum, p) => sum + (p.cantidadPedida * p.precioUnitario), 0);
    await OrdenCompra.findByIdAndUpdate(req.params.ordenId, { total });
    
    res.status(201).json(nuevoProducto);
  } catch (error) {
    console.error('Error al agregar producto:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/ordenes/productos/:productoId - Actualizar producto
router.put('/productos/:productoId', async (req, res) => {
  try {
    const { nombre, codigoBarras, cantidadPedida, cantidadRecibida, precioUnitario, recibido } = req.body;
    
    const producto = await ProductoOrden.findByIdAndUpdate(
      req.productoId,
      { nombre, codigoBarras, cantidadPedida, cantidadRecibida, precioUnitario, recibido },
      { new: true, runValidators: true }
    );
    
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Actualizar total de la orden
    const productos = await ProductoOrden.find({ ordenId: producto.ordenId });
    const total = productos.reduce((sum, p) => sum + (p.cantidadPedida * p.precioUnitario), 0);
    await OrdenCompra.findByIdAndUpdate(producto.ordenId, { total });
    
    res.json(producto);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/ordenes/productos/:productoId - Eliminar producto
router.delete('/productos/:productoId', async (req, res) => {
  try {
    const producto = await ProductoOrden.findByIdAndDelete(req.params.productoId);
    
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Actualizar total de la orden
    const productos = await ProductoOrden.find({ ordenId: producto.ordenId });
    const total = productos.reduce((sum, p) => sum + (p.cantidadPedida * p.precioUnitario), 0);
    await OrdenCompra.findByIdAndUpdate(producto.ordenId, { total });
    
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ordenes/:ordenId/escanear - Escanear código de barras
router.post('/:ordenId/escanear', async (req, res) => {
  try {
    const { codigoBarras } = req.body;
    
    // Buscar el producto en esta orden
    const producto = await ProductoOrden.findOne({
      ordenId: req.params.ordenId,
      codigoBarras: codigoBarras
    });
    
    if (!producto) {
      return res.status(404).json({ 
        error: 'Producto no encontrado en esta orden',
        codigoBarras 
      });
    }
    
    // Incrementar cantidad recibida
    producto.cantidadRecibida += 1;
    
    // Marcar como recibido si se completó la cantidad
    if (producto.cantidadRecibida >= producto.cantidadPedida) {
      producto.recibido = true;
    }
    
    await producto.save();
    
    // Verificar si todos los productos fueron recibidos
    const todosProductos = await ProductoOrden.find({ ordenId: req.params.ordenId });
    const todosRecibidos = todosProductos.every(p => p.recibido);
    
    if (todosRecibidos) {
      await OrdenCompra.findByIdAndUpdate(req.params.ordenId, { estado: 'completada' });
    }
    
    res.json({ 
      success: true, 
      producto,
      mensaje: `${producto.nombre} - ${producto.cantidadRecibida}/${producto.cantidadPedida}`
    });
  } catch (error) {
    console.error('Error al escanear:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;