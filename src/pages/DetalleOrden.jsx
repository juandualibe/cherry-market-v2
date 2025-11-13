import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  obtenerOrden,
  obtenerProductosOrden,
  obtenerProveedores,
  agregarProductoOrden, // Esto ahora usa la nueva lógica del backend
  eliminarProductoOrden,
  escanearCodigo,
  obtenerProductos, // <-- NUEVO: Para el catálogo
  obtenerProductoDetalle // <-- NUEVO: Para buscar precios
} from "../services/apiPrincipal";
import EscanerBarras from "../components/EscanerBarras";
import { formatearFechaLocal } from "../utils/dateUtils";
import toast from "react-hot-toast";
import { confirmarAccion } from '../utils/confirmUtils';

function DetalleOrden() {
  const { ordenId } = useParams();
  const navigate = useNavigate();

  const [orden, setOrden] = useState(null);
  const [productos, setProductos] = useState([]); // Productos EN ESTA ORDEN
  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- INICIO DE CAMBIOS ---
  // Estados para el nuevo formulario de Catálogo
  const [catalogo, setCatalogo] = useState([]); // Productos del Catálogo Maestro
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precioAcordado, setPrecioAcordado] = useState('');
  const [loadingPrecio, setLoadingPrecio] = useState(false);
  // --- FIN DE CAMBIOS ---

  // Estados para escáner
  const [escaneadorAbierto, setEscaneadorAbierto] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [ordenId]);

  // --- CAMBIO: Cargar el catálogo de productos junto con la orden ---
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [ordenData, productosData, proveedoresData, catalogoData] = await Promise.all([
        obtenerOrden(ordenId),
        obtenerProductosOrden(ordenId),
        obtenerProveedores(),
        obtenerProductos() // Traemos el catálogo maestro
      ]);

      setOrden(ordenData);
      setProductos(productosData);
      setCatalogo(catalogoData.sort((a, b) => a.nombre.localeCompare(b.nombre))); // Guardamos el catálogo

      const prov = proveedoresData.find((p) => p._id === ordenData.proveedorId);
      setProveedor(prov);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar la orden: " + (error.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // --- ¡NUEVA LÓGICA! ---
  // Cuando el usuario selecciona un producto del dropdown,
  // buscamos automáticamente el precio para el proveedor de esta orden.
  useEffect(() => {
    const buscarPrecio = async () => {
      if (!productoSeleccionadoId || !proveedor) {
        setPrecioAcordado('');
        return;
      }
      
      setLoadingPrecio(true);
      try {
        // 1. Obtenemos el detalle completo del producto (que incluye la lista de precios)
        const productoDetalle = await obtenerProductoDetalle(productoSeleccionadoId);
        
        // 2. Buscamos el precio para el proveedor de ESTA orden
        const precioInfo = productoDetalle.preciosProveedores.find(
          p => p.proveedorId === proveedor._id
        );
        
        if (precioInfo) {
          setPrecioAcordado(precioInfo.precio);
        } else {
          setPrecioAcordado(''); // Limpiar si no hay precio asignado
          toast.error(`Este producto no tiene un precio asignado para ${proveedor.nombre}.`);
        }
      } catch (error) {
        toast.error('Error al buscar precio: ' + (error.error || error.message));
      } finally {
        setLoadingPrecio(false);
      }
    };
    
    buscarPrecio();
  }, [productoSeleccionadoId, proveedor]); // Se ejecuta si cambia el producto o el proveedor

  
  // --- ¡LÓGICA ACTUALIZADA! ---
  // Ahora envía el ID del producto maestro y la cantidad.
  const handleAgregarProducto = async (e) => {
    e.preventDefault();

    const cantidadNum = parseInt(cantidad);
    
    if (!productoSeleccionadoId || !cantidadNum || cantidadNum <= 0) {
      toast.error("Selecciona un producto y una cantidad válida.");
      return;
    }
    
    // Verificamos si el producto ya está en la orden
    const yaExiste = productos.find(p => p.productoMaestroId === productoSeleccionadoId);
    if (yaExiste) {
      toast.error("Este producto ya está en la orden. Edita la cantidad desde la tabla.");
      return;
    }

    try {
      const nuevoProducto = await agregarProductoOrden(ordenId, {
        productoMaestroId: productoSeleccionadoId,
        cantidadPedida: cantidadNum,
        // El precio se calcula en el backend basado en el proveedor
      });

      setProductos([...productos, nuevoProducto]);

      // Limpiar formulario
      setProductoSeleccionadoId("");
      setCantidad("");
      setPrecioAcordado("");

      // Recargar la orden para actualizar el total
      const ordenActualizada = await obtenerOrden(ordenId);
      setOrden(ordenActualizada);

      toast.success("✅ Producto agregado correctamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al agregar producto: " + (error.error || error.message));
    }
  };

  const handleEliminarProducto = async (productoId) => {
    // productoId ahora es el ID del *item* en la orden (ProductoOrden._id)
    const confirmar = await confirmarAccion({ // Usamos confirmarAccion en lugar de window.confirm
      title: "¿Eliminar este producto de la orden?",
      confirmText: "Eliminar",
      confirmColor: "#dc3545",
    });
    if (!confirmar) return;

    try {
      await eliminarProductoOrden(productoId);
      setProductos(productos.filter((p) => p._id !== productoId));

      // Recargar la orden para actualizar el total
      const ordenActualizada = await obtenerOrden(ordenId);
      setOrden(ordenActualizada);
      toast.success("Producto eliminado de la orden");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar producto: " + (error.error || error.message));
    }
  };

  
  // --- ¡LÓGICA ACTUALIZADA! ---
  // La validación ahora usa los datos del nuevo modelo
  const handleEscanear = async (codigoBarras) => {
  // 1. Ya no hacemos la validación local (la borramos)
  // const productoLocal = productos.find(...)
  // if (!productoLocal) { ... }
  // if (productoLocal.cantidadRecibida >= ...) { ... }

  // 2. Mostramos el toast de carga
  const loadingToastId = toast.loading(
    `Procesando código ${codigoBarras}...`
  );

  try {
    // 3. Llamamos a la API directamente.
    // El backend hará TODA la validación por nosotros.
    const resultado = await escanearCodigo(ordenId, codigoBarras);

    // 4. Actualizamos el estado si todo salió bien
    const productosActualizados = productos.map((p) =>
      p._id === resultado.producto._id ? resultado.producto : p
    );
    setProductos(productosActualizados);

    toast.success(resultado.mensaje, { id: loadingToastId });

    // (Sonido de éxito)

    const ordenActualizada = await obtenerOrden(ordenId);
    setOrden(ordenActualizada);

  } catch (error) {
    // 5. Si la API devuelve un error (404, 400), lo mostramos
    console.error("Error al escanear:", error);
    const mensajeError =
      error.mensaje || error.error || `Error procesando el producto`;

    toast.error(mensajeError, {
      id: loadingToastId,
      duration: 3000,
    });
      // (Sonido de error)
    }
  };

  const calcularProgreso = () => {
    if (productos.length === 0) return 0;
    const totalRecibido = productos.reduce(
      (sum, p) => sum + p.cantidadRecibida,
      0
    );
    const totalPedido = productos.reduce((sum, p) => sum + p.cantidadPedida, 0);
    return totalPedido > 0
      ? Math.round((totalRecibido / totalPedido) * 100)
      : 0;
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      pendiente: { bg: "#ffc107", color: "#000" },
      recibiendo: { bg: "#17a2b8", color: "#fff" },
      completada: { bg: "#28a745", color: "#fff" },
      cancelada: { bg: "#dc3545", color: "#fff" },
    };
    const style = estilos[estado] || estilos.pendiente;

    return (
      <span
        style={{
          padding: "0.25rem 0.75rem",
          borderRadius: "12px",
          fontSize: "0.85rem",
          fontWeight: "600",
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {estado.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <p>Cargando orden y catálogo...</p>
      </div>
    );
  }

  if (!orden) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <p>Orden no encontrada</p>
        <button className="btn" onClick={() => navigate("/ordenes")}>
          Volver a Órdenes
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* ... (HEADER e INFO DE LA ORDEN se quedan igual) ... */}
       <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>📦 {orden.numero}</h1>
          <p style={{ margin: "0.5rem 0", color: "#666" }}>
            {proveedor?.nombre || "Proveedor desconocido"}
          </p>
        </div>
        <button
          className="btn"
          onClick={() => navigate("/ordenes")}
          style={{ backgroundColor: "#6c757d" }}
        >
          ← Volver
        </button>
      </div>
      <div
        style={{
          background: "#fff",
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {/* ... (Info de la orden: Estado, Fecha, Total, Progreso) ... */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <div>
            <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
              Estado
            </p>
            <div style={{ marginTop: "0.5rem" }}>
              {getEstadoBadge(orden.estado)}
            </div>
          </div>
          <div>
            <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
              Fecha
            </p>
            <p
              style={{
                margin: "0.5rem 0 0 0",
                fontWeight: "600",
                fontSize: "1.1rem",
              }}
            >
              {formatearFechaLocal(orden.fecha)}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
              Total
            </p>
            <p
              style={{
                margin: "0.5rem 0 0 0",
                fontWeight: "600",
                fontSize: "1.1rem",
              }}
            >
              ${orden.total.toLocaleString("es-AR")}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
              Progreso
            </p>
            <p
              style={{
                margin: "0.5rem 0 0 0",
                fontWeight: "600",
                fontSize: "1.1rem",
              }}
            >
              {calcularProgreso()}%
            </p>
          </div>
        </div>
        {orden.observaciones && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.9rem", fontStyle: "italic" }}>
              📝 {orden.observaciones}
            </p>
          </div>
        )}
      </div>


      {/* --- ¡FORMULARIO ACTUALIZADO! --- */}
      <div
        style={{
          background: "#fff",
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Agregar Producto del Catálogo</h3>
        <form
          onSubmit={handleAgregarProducto}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "1rem",
            alignItems: 'flex-end'
          }}
        >
          {/* 1. Dropdown de Productos del Catálogo */}
          <div>
            <label>Producto</label>
            <select
              value={productoSeleccionadoId}
              onChange={(e) => setProductoSeleccionadoId(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="">-- Seleccionar un producto --</option>
              {catalogo.map(p => (
                <option key={p._id} value={p._id}>{p.nombre} ({p.codigosDeBarras[0]})</option>
              ))}
            </select>
          </div>
          
          {/* 2. Input de Cantidad */}
          <div>
            <label>Cantidad</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Cantidad"
              min="1"
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          
          {/* 3. Input de Precio (autocompletado) */}
          <div>
            <label>Precio (auto)</label>
            <input
              type="text"
              value={loadingPrecio ? '...' : (precioAcordado ? `$${precioAcordado}` : 'N/A')}
              readOnly
              disabled
              style={{ width: '100%', padding: '0.5rem', background: '#eee' }}
            />
          </div>

          {/* 4. Botón de Agregar */}
          <button type="submit" className="btn" disabled={loadingPrecio || !precioAcordado}>
            + Agregar
          </button>
        </form>
      </div>

      {/* --- ¡TABLA ACTUALIZADA! --- */}
      <div
        style={{
          background: "#fff",
          padding: "1.5rem",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: "2rem",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Productos ({productos.length})</h3>
        {/* ... (mensaje de productos.length === 0) ... */}
        
        {productos.length > 0 && (
          <table className="tabla-detalles">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Código (Ref)</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
                <th>Recibido</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto._id}>
                  <td style={{ fontWeight: "600" }}>{producto.nombre}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
                    {/* Usamos el código de referencia guardado */}
                    {producto.codigoBarrasPrincipal} 
                  </td>
                  <td>{producto.cantidadPedida}</td>
                  {/* Usamos el precio acordado guardado */}
                  <td>${producto.precioUnitarioAcordado.toLocaleString("es-AR")}</td>
                  <td style={{ fontWeight: "600" }}>
                    $
                    {(
                      producto.cantidadPedida * producto.precioUnitarioAcordado
                    ).toLocaleString("es-AR")}
                  </td>
                  <td>
                    {/* ... (span de recibido/cantidad) ... */}
                     <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        backgroundColor: producto.recibido
                          ? "#d4edda"
                          : (producto.cantidadRecibida > 0 ? "#fff3cd" : "#f8d7da"),
                        color: producto.recibido
                          ? "#155724"
                          : (producto.cantidadRecibida > 0 ? "#856404" : "#721c24"),
                        fontWeight: "600",
                      }}
                    >
                      {producto.cantidadRecibida}/{producto.cantidadPedida}
                    </span>
                  </td>
                  <td className="tabla-acciones">
                    <button
                      onClick={() => handleEliminarProducto(producto._id)}
                      className="btn-eliminar"
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

      {/* --- BOTÓN ESCANEAR (Sin cambios) --- */}
      {productos.length > 0 && (
        <>
          <div style={{ textAlign: "center" }}>
            <button
              className="btn"
              style={{
                backgroundColor: "#28a745",
                fontSize: "1.2rem",
                padding: "1.25rem 2.5rem",
                fontWeight: "700",
                boxShadow: "0 4px 12px rgba(40, 167, 69, 0.3)",
              }}
              onClick={() => setEscaneadorAbierto(true)}
            >
              📷 Escanear Productos
            </button>
          </div>
          {escaneadorAbierto && (
            <EscanerBarras
              onScan={(codigo) => {
                setEscaneadorAbierto(false);
                handleEscanear(codigo);
              }}
              onClose={() => setEscaneadorAbierto(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default DetalleOrden;