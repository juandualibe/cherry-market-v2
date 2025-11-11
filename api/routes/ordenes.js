// routes/ordenes.js

const express = require('express');
const router = express.Router();
const OrdenCompra = require('../models/OrdenCompra');
const ProductoOrden = require('../models/ProductoOrden');
const Producto = require('../models/Producto'); // <-- NECESITAMOS EL CATÁLOGO
const Proveedor = require('../models/Proveedor'); // <-- NECESITAMOS PROVEEDORES

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
    // Ahora poblamos los datos del producto maestro
    const productos = await ProductoOrden.find({ ordenId: req.params.ordenId })
      .populate('productoMaestroId', 'nombre codigosDeBarras'); // Opcional, pero útil
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: error.message });
  }
});


// --- ¡CAMBIO IMPORTANTE! ---
// POST /api/ordenes/:ordenId/productos - Agregar producto A la orden DESDE el catálogo
router.post('/:ordenId/productos', async (req, res) => {
  try {
    // Ahora recibimos el ID del catálogo y la cantidad
    const { productoMaestroId, cantidadPedida } = req.body;
    const { ordenId } = req.params;

    // 1. Buscamos la orden para saber quién es el proveedor
    const orden = await OrdenCompra.findById(ordenId);
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    // 2. Buscamos el producto maestro en el catálogo
    const productoMaestro = await Producto.findById(productoMaestroId);
    if (!productoMaestro) return res.status(404).json({ error: 'Producto del catálogo no encontrado' });

    // 3. Buscamos el precio específico de ESE proveedor para ESE producto
    const infoPrecio = productoMaestro.preciosProveedores.find(
      (p) => p.proveedorId.toString() === orden.proveedorId.toString()
    );

    if (!infoPrecio) {
      const proveedor = await Proveedor.findById(orden.proveedorId);
      return res.status(400).json({ error: `Este producto no tiene un precio asignado para el proveedor: ${proveedor?.nombre || 'Desconocido'}` });
    }
    
    // 4. Creamos el item en la orden
    const nuevoProductoOrden = new ProductoOrden({
      ordenId: ordenId,
      productoMaestroId: productoMaestroId,
      nombre: productoMaestro.nombre, // Guardamos el nombre "cacheado"
      codigoBarrasPrincipal: productoMaestro.codigosDeBarras[0] || 'N/A', // Guardamos un código de referencia
      cantidadPedida: cantidadPedida,
      precioUnitarioAcordado: infoPrecio.precio // ¡Usamos el precio del catálogo!
    });
    
    await nuevoProductoOrden.save();
    
    // 5. Actualizar total de la orden
    const productos = await ProductoOrden.find({ ordenId: ordenId });
    const total = productos.reduce((sum, p) => sum + (p.cantidadPedida * p.precioUnitarioAcordado), 0);
    await OrdenCompra.findByIdAndUpdate(ordenId, { total });
    
    // Devolvemos el producto recién creado
    res.status(201).json(nuevoProductoOrden);

  } catch (error) {
    console.error('Error al agregar producto:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/ordenes/productos/:productoId - Actualizar producto
// (Esta ruta ahora es principalmente para CANTIDADES, ya que el precio/nombre vienen del maestro)
router.put('/productos/:productoId', async (req, res) => {
  try {
    // Solo permitimos actualizar la cantidad pedida (el resto es fijo del catálogo)
    const { cantidadPedida } = req.body;
    
    const producto = await ProductoOrden.findByIdAndUpdate(
      req.params.productoId,
      { cantidadPedida }, // Solo actualizamos esto
      { new: true, runValidators: true }
    );
    
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Actualizar total de la orden
    const productos = await ProductoOrden.find({ ordenId: producto.ordenId });
    const total = productos.reduce((sum, p) => sum + (p.cantidadPedida * p.precioUnitarioAcordado), 0);
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
    const total = productos.reduce((sum, p) => sum + (p.cantidadPedida * p.precioUnitarioAcordado), 0);
    await OrdenCompra.findByIdAndUpdate(producto.ordenId, { total });
    
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: error.message });
  }
});


// --- ¡CAMBIO IMPORTANTE! ---
// POST /api/ordenes/:ordenId/escanear - Escanear código de barras
router.post('/:ordenId/escanear', async (req, res) => {
  try {
    const { codigoBarras } = req.body;
    const { ordenId } = req.params;
    
    // 1. Buscamos en el CATÁLOGO MAESTRO a qué producto pertenece este código
    const productoMaestro = await Producto.findOne({ 
      codigosDeBarras: codigoBarras // Busca el código dentro del array
    });
    
    if (!productoMaestro) {
      return res.status(404).json({ 
        error: 'Código no encontrado en el catálogo maestro',
        mensaje: `Código ${codigoBarras} no existe en el catálogo`,
        codigoBarras 
      });
    }
    
    // 2. Ahora, buscamos si ese producto (por su ID maestro) está en ESTA orden
    const productoEnOrden = await ProductoOrden.findOne({
      ordenId: ordenId,
      productoMaestroId: productoMaestro._id // Buscamos por el ID maestro
    });

    if (!productoEnOrden) {
      return res.status(404).json({ 
        error: 'Producto no está en esta orden',
        mensaje: `${productoMaestro.nombre} no está en esta orden`,
        codigoBarras 
      });
    }

    // 3. (Lógica de validación que ya tenías)
    if (productoEnOrden.cantidadRecibida >= productoEnOrden.cantidadPedida) {
      return res.status(400).json({
        error: 'Cantidad máxima alcanzada',
        mensaje: `Cantidad máxima alcanzada para: ${productoEnOrden.nombre}`,
        producto: productoEnOrden
      });
    }

    // 4. Incrementar cantidad recibida
    productoEnOrden.cantidadRecibida += 1;
    
    if (productoEnOrden.cantidadRecibida >= productoEnOrden.cantidadPedida) {
      productoEnOrden.recibido = true;
    }
    
    await productoEnOrden.save();
    
    // 5. (Lógica de estado de la orden que ya tenías)
    const todosProductos = await ProductoOrden.find({ ordenId: ordenId });
    const todosRecibidos = todosProductos.every(p => p.recibido);
    
    // Si todos están recibidos, se completa. Si no, pero se empezó, se pone 'recibiendo'.
    const ordenActual = await OrdenCompra.findById(ordenId);
    let estadoOrden = ordenActual.estado;
    
    if (todosRecibidos) {
      estadoOrden = 'completada';
    } else if (productoEnOrden.cantidadRecibida > 0) {
      estadoOrden = 'recibiendo';
    }

    await OrdenCompra.findByIdAndUpdate(ordenId, { estado: estadoOrden });
    
    res.json({ 
      success: true, 
      producto: productoEnOrden, // Devolvemos el ProductoOrden actualizado
      mensaje: `${productoEnOrden.nombre} (${productoEnOrden.cantidadRecibida}/${productoEnOrden.cantidadPedida})`
    });
  } catch (error) {
    console.error('Error al escanear:', error);
    res.status(500).json({ error: error.message, mensaje: 'Error interno del servidor' });
  }
});

module.exports = router;