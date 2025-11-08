import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  obtenerOrden,
  obtenerProductosOrden,
  obtenerProveedores,
  agregarProductoOrden,
  eliminarProductoOrden,
  escanearCodigo,
} from "../services/api";
import EscanerBarras from "../components/EscanerBarras";
import { formatearFechaLocal } from "../utils/dateUtils";
import toast from "react-hot-toast";

function DetalleOrden() {
  const { ordenId } = useParams();
  const navigate = useNavigate();

  const [orden, setOrden] = useState(null);
  const [productos, setProductos] = useState([]);
  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para agregar producto
  const [nombreProducto, setNombreProducto] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");

  // Estados para escáner
  const [escaneadorAbierto, setEscaneadorAbierto] = useState(false);

  // CÓDIGO NUEVO (simplificado)
  useEffect(() => {
    cargarDatos();
  }, [ordenId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [ordenData, productosData, proveedoresData] = await Promise.all([
        obtenerOrden(ordenId),
        obtenerProductosOrden(ordenId),
        obtenerProveedores(),
      ]);

      setOrden(ordenData);
      setProductos(productosData);

      const prov = proveedoresData.find((p) => p._id === ordenData.proveedorId);
      setProveedor(prov);
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error al cargar la orden");
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarProducto = async (e) => {
    e.preventDefault();

    if (
      !nombreProducto.trim() ||
      !codigoBarras.trim() ||
      !cantidad ||
      !precio
    ) {
      alert("Por favor completa todos los campos");
      return;
    }

    const cantidadNum = parseInt(cantidad);
    const precioNum = parseFloat(precio);

    if (cantidadNum <= 0 || precioNum <= 0) {
      alert("La cantidad y el precio deben ser mayores a 0");
      return;
    }

    try {
      const nuevoProducto = await agregarProductoOrden(ordenId, {
        nombre: nombreProducto.trim(),
        codigoBarras: codigoBarras.trim(),
        cantidadPedida: cantidadNum,
        precioUnitario: precioNum,
      });

      setProductos([...productos, nuevoProducto]);

      // Limpiar formulario
      setNombreProducto("");
      setCodigoBarras("");
      setCantidad("");
      setPrecio("");

      // Recargar la orden para actualizar el total
      const ordenActualizada = await obtenerOrden(ordenId);
      setOrden(ordenActualizada);

      alert("✅ Producto agregado correctamente");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al agregar producto");
    }
  };

  const handleEliminarProducto = async (productoId) => {
    const confirmar = window.confirm(
      "¿Estás seguro de eliminar este producto?"
    );
    if (!confirmar) return;

    try {
      await eliminarProductoOrden(productoId);
      setProductos(productos.filter((p) => p._id !== productoId));

      // Recargar la orden para actualizar el total
      const ordenActualizada = await obtenerOrden(ordenId);
      setOrden(ordenActualizada);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar producto");
    }
  };

  // REEMPLAZA OTRA VEZ la función handleEscanear con esta:

  // REEMPLAZA OTRA VEZ la función handleEscanear con esta:

  const handleEscanear = async (codigoBarras) => {
    // --- INICIO DE VALIDACIÓN FRONTEND ---

    // 1. Buscar el producto en el estado local
    const productoLocal = productos.find(
      (p) => p.codigoBarras === codigoBarras
    );

    // 2. Si el producto NO está en la orden
    if (!productoLocal) {
      const mensajeError = `Código ${codigoBarras} no encontrado en la orden`;
      toast.error(mensajeError, { duration: 3000 });

      const audioError = new Audio(
        "data:audio/wav;base64,UklGRhQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfACAAAAAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//"
      );
      audioError.play().catch((e) => console.log("Audio no disponible"));
      return; // Detener ejecución
    }

    // 3. Si el producto YA ALCANZÓ la cantidad pedida
    if (productoLocal.cantidadRecibida >= productoLocal.cantidadPedida) {
      const mensajeError = `Cantidad máxima alcanzada para: ${productoLocal.nombre}`;
      toast.error(mensajeError, { duration: 3000 });

      const audioError = new Audio(
        "data:audio/wav;base64,UklGRhQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfACAAAAAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//"
      );
      audioError.play().catch((e) => console.log("Audio no disponible"));
      return; // Detener ejecución
    }

    // --- FIN DE VALIDACIÓN ---

    // Si pasó las validaciones, llamamos a la API
    const loadingToastId = toast.loading(
      `Agregando ${productoLocal.nombre}...`
    );

    try {
      const resultado = await escanearCodigo(ordenId, codigoBarras);

      const productosActualizados = productos.map((p) =>
        p._id === resultado.producto._id ? resultado.producto : p
      );
      setProductos(productosActualizados);

      // El 'resultado.mensaje' del backend (ej: "Producto X (3/10)")
      toast.success(resultado.mensaje, { id: loadingToastId });

      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi2Lz/LUfjAGGm7A7+OZRQ4PVKrk7q5aGAg+ltryxnMpBSh+zPDajz4KFV627eeXSg0NUKXi8LZmHggykNXwzH4yBh1wwO7mnEgPC1Kn4e+zYBoGNI/U8Mp8MwUdbL/v5Z1LDwxPpeLvtmcdBzKN0/DLfDQGHm2+7uScTBAMTqPh8LhnHwcxjNLwyH02Bx9rv+7km04QDE+k4O+2aB8HMIrP8Md+Nwgfar3t5JxPEAxOpN/vt2kgCDCJzvDHfjcIH2m77OScUBALTaPf77dpIQgviM3vxn45CB9ou+zknFARC0yi3u+4aiIILofM78Z/Ogkfabvs5ZxRDw=="
      );
      audio.play().catch((e) => console.log("Audio no disponible"));

      const ordenActualizada = await obtenerOrden(ordenId);
      setOrden(ordenActualizada);
    } catch (error) {
      // Este catch ahora solo se activará si la API falla de verdad
      // (ej: se cae el servidor, o el backend SÍ devuelve un error 400)
      console.error("Error al escanear:", error);

      const mensajeError =
        error.mensaje || error.error || `Error procesando el producto`;

      toast.error(mensajeError, {
        id: loadingToastId,
        duration: 3000,
      });

      const audioError = new Audio(
        "data:audio/wav;base64,UklGRhQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfACAAAAAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//"
      );
      audioError.play().catch((e) => console.log("Audio no disponible"));
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
        <p>Cargando orden...</p>
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
      {/* HEADER */}
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

      {/* INFO DE LA ORDEN */}
      <div
        style={{
          background: "#fff",
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
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

      {/* FORMULARIO AGREGAR PRODUCTO */}
      <div
        style={{
          background: "#fff",
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Agregar Producto</h3>
        <form
          onSubmit={handleAgregarProducto}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
          }}
        >
          <input
            type="text"
            value={nombreProducto}
            onChange={(e) => setNombreProducto(e.target.value)}
            placeholder="Nombre del producto"
            required
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
          <input
            type="text"
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
            placeholder="Código de barras"
            required
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
          <input
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="Cantidad"
            min="1"
            required
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
          <input
            type="number"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="Precio unitario"
            min="0.01"
            required
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
          <button type="submit" className="btn">
            + Agregar
          </button>
        </form>
      </div>

      {/* LISTA DE PRODUCTOS */}
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

        {productos.length === 0 && (
          <p style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
            No hay productos en esta orden. Agrega el primer producto arriba.
          </p>
        )}

        {productos.length > 0 && (
          <table className="tabla-detalles">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Código</th>
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
                    {producto.codigoBarras}
                  </td>
                  <td>{producto.cantidadPedida}</td>
                  <td>${producto.precioUnitario.toLocaleString("es-AR")}</td>
                  <td style={{ fontWeight: "600" }}>
                    $
                    {(
                      producto.cantidadPedida * producto.precioUnitario
                    ).toLocaleString("es-AR")}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        backgroundColor: producto.recibido
                          ? "#d4edda"
                          : "#fff3cd",
                        color: producto.recibido ? "#155724" : "#856404",
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

      {/* BOTÓN ESCANEAR Y ALERTAS */}
      {productos.length > 0 && (
        <>
          {/* Botón escanear */}
          <div
            style={{
              textAlign: "center",
            }}
          >
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
          {/* Modal del escáner */}
          // CÓDIGO NUEVO
          {escaneadorAbierto && (
            <EscanerBarras
              onScan={(codigo) => {
                // 1. Cierra el modal INMEDIATAMENTE
                setEscaneadorAbierto(false);

                // 2. Procesa el código (esto llamará a la API)
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
