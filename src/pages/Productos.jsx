// src/pages/Productos.jsx

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  obtenerProductos,
  obtenerProductoDetalle,
  crearProducto,
  agregarPrecioProducto,
  eliminarPrecioProducto,
  obtenerProveedores // ¡Necesitamos esto!
} from '../services/apiPrincipal';
import { confirmarAccion } from '../utils/confirmUtils';

function Productos() {
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para el formulario de NUEVO PRODUCTO
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [codigoNuevo, setCodigoNuevo] = useState('');
  const [descNuevo, setDescNuevo] = useState('');
  
  // Estados para el formulario de ASIGNAR PRECIO
  const [proveedorPrecio, setProveedorPrecio] = useState('');
  const [montoPrecio, setMontoPrecio] = useState('');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [productosData, proveedoresData] = await Promise.all([
        obtenerProductos(),
        obtenerProveedores()
      ]);
      setProductos(productosData);
      setProveedores(proveedoresData.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    } catch (error) {
      toast.error('Error al cargar datos: ' + (error.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    if (!nombreNuevo.trim() || !codigoNuevo.trim()) {
      return toast.error('Nombre y Código de Barras son obligatorios');
    }

    try {
      const nuevoProducto = await crearProducto({
        nombre: nombreNuevo,
        codigoBarras: codigoNuevo,
        descripcion: descNuevo,
      });
      setProductos([...productos, nuevoProducto]); // Agregamos la versión simple a la lista
      setNombreNuevo('');
      setCodigoNuevo('');
      setDescNuevo('');
      toast.success('Producto creado exitosamente');
    } catch (error) {
      toast.error('Error al crear: ' + (error.error || error.message));
    }
  };

  const handleVerDetalle = async (productoId) => {
    if (productoSeleccionado && productoSeleccionado._id === productoId) {
      setProductoSeleccionado(null);
      return;
    }
    
    try {
      const detalle = await obtenerProductoDetalle(productoId);
      setProductoSeleccionado(detalle);
    } catch (error) {
      toast.error('Error al cargar detalle: ' + (error.error || error.message));
    }
  };
  
  const handleAgregarPrecio = async (e) => {
    e.preventDefault();
    const precioNum = parseFloat(montoPrecio);
    if (!proveedorPrecio || !precioNum || precioNum <= 0) {
      return toast.error('Debe seleccionar un proveedor y un precio válido');
    }

    try {
      const productoActualizado = await agregarPrecioProducto(
        productoSeleccionado._id,
        proveedorPrecio,
        precioNum
      );
      // Actualizamos el detalle
      setProductoSeleccionado(productoActualizado);
      setProveedorPrecio('');
      setMontoPrecio('');
      toast.success('Precio asignado/actualizado');
    } catch (error) {
      toast.error('Error al asignar precio: ' + (error.error || error.message));
    }
  };

  const handleEliminarPrecio = async (precioId) => {
    const confirmar = await confirmarAccion({
      title: '¿Quitar este precio?',
      confirmText: 'Quitar',
      confirmColor: '#dc3545',
    });
    if (!confirmar) return;

    try {
      const productoActualizado = await eliminarPrecioProducto(
        productoSeleccionado._id,
        precioId
      );
      setProductoSeleccionado(productoActualizado);
      toast.success('Precio quitado');
    } catch (error) {
      toast.error('Error al quitar precio: ' + (error.error || error.message));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <p>Cargando catálogo...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>🏷️ Catálogo de Productos</h1>

      {/* --- FORMULARIO PARA CREAR NUEVO PRODUCTO --- */}
      <div className="form-container" style={{background: '#fff', marginBottom: '2rem'}}>
        <h3 style={{ marginTop: 0, width: '100%' }}>Crear Nuevo Producto Maestro</h3>
        <form 
          onSubmit={handleCrearProducto} 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            width: '100%'
          }}
        >
          <input
            type="text"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder="Nombre del Producto (ej: Gaseosa Cola 2.25L)"
            required
          />
          <input
            type="text"
            value={codigoNuevo}
            onChange={(e) => setCodigoNuevo(e.target.value)}
            placeholder="Código de Barras"
            required
          />
          <input
            type="text"
            value={descNuevo}
            onChange={(e) => setDescNuevo(e.target.value)}
            placeholder="Descripción (opcional)"
          />
          <button type="submit" className="btn" style={{backgroundColor: 'var(--color-success)'}}>
            + Crear Producto
          </button>
        </form>
      </div>
      
      {/* --- LISTA DE PRODUCTOS CREADOS --- */}
      <h2>Productos en Catálogo ({productos.length})</h2>
      <table className="tabla-detalles">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Código de Barras</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map(p => (
            <tr 
              key={p._id} 
              style={{
                backgroundColor: productoSeleccionado?._id === p._id ? 'var(--color-primary-light)' : 'transparent',
                cursor: 'pointer'
              }}
              onClick={() => handleVerDetalle(p._id)}
            >
              <td style={{fontWeight: 600}}>{p.nombre}</td>
              <td style={{fontFamily: 'monospace'}}>{p.codigoBarras}</td>
              <td>
                <button className="btn btn-sm">
                  {productoSeleccionado?._id === p._id ? 'Ocultar Precios' : 'Ver Precios'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- DETALLE DE PRECIOS DEL PRODUCTO SELECCIONADO --- */}
      {productoSeleccionado && (
        <div style={{
          marginTop: '3rem', 
          background: '#fff', 
          padding: '1.5rem', 
          borderRadius: 'var(--border-radius-lg)', 
          boxShadow: 'var(--shadow-md)'
        }}>
          <h2>Precios de: {productoSeleccionado.nombre}</h2>
          
          {/* Formulario para ASIGNAR PRECIO */}
          <form 
            onSubmit={handleAgregarPrecio} 
            className="form-container"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr', 
              gap: '1rem',
              background: 'var(--color-gray-50)',
              marginBottom: '2rem'
            }}
          >
            <select
              value={proveedorPrecio}
              onChange={(e) => setProveedorPrecio(e.target.value)}
              required
            >
              <option value="">-- Seleccionar Proveedor --</option>
              {proveedores.map(prov => (
                <option key={prov._id} value={prov._id}>{prov.nombre}</option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              value={montoPrecio}
              onChange={(e) => setMontoPrecio(e.target.value)}
              placeholder="Precio ($)"
              required
            />
            <button type="submit" className="btn">
              Asignar Precio
            </button>
          </form>

          {/* Lista de precios YA asignados */}
          {productoSeleccionado.preciosProveedores.length === 0 ? (
            <p style={{textAlign: 'center', color: '#888'}}>Aún no hay precios asignados para este producto.</p>
          ) : (
            <table className="tabla-detalles" style={{marginTop: 0}}>
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Precio Asignado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productoSeleccionado.preciosProveedores
                  .sort((a,b) => a.proveedorNombre.localeCompare(b.proveedorNombre))
                  .map(precioProv => (
                  <tr key={precioProv._id}>
                    <td style={{fontWeight: 500}}>{precioProv.proveedorNombre}</td>
                    <td style={{fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-success)'}}>
                      ${precioProv.precio.toLocaleString('es-AR')}
                    </td>
                    <td className="tabla-acciones">
                      <button 
                        className="btn-eliminar"
                        onClick={() => handleEliminarPrecio(precioProv._id)}
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default Productos;