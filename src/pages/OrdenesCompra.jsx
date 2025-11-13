import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  obtenerOrdenes,
  obtenerProveedores,
  crearOrden,
  eliminarOrden,
} from "../services/apiPrincipal";
import { obtenerFechaLocal, formatearFechaLocal } from "../utils/dateUtils";

// --- ¡SOLUCIÓN AQUÍ! ---
// Faltaban estas dos importaciones
import toast from "react-hot-toast";
import { confirmarAccion } from "../utils/confirmUtils";
// --- FIN DE LA SOLUCIÓN ---

function OrdenesCompra() {
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para nueva orden
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("");
  const [fechaOrden, setFechaOrden] = useState(obtenerFechaLocal());
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [ordenesData, proveedoresData] = await Promise.all([
      	obtenerOrdenes(),
      	obtenerProveedores(),
     ]);
      setOrdenes(ordenesData);
      setProveedores(proveedoresData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      // alert("Error al cargar los datos"); // <-- REEMPLAZADO
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearOrden = async (e) => {
    e.preventDefault();
    if (!proveedorSeleccionado) {
      // alert('Selecciona un proveedor');
      toast.error("Selecciona un proveedor");
      return;
    }

    try {
      const nuevaOrden = await crearOrden(
      	proveedorSeleccionado,
      	fechaOrden,
      	observaciones
      );
      setOrdenes([nuevaOrden, ...ordenes]);

      setProveedorSeleccionado("");
      setFechaOrden(obtenerFechaLocal());
      setObservaciones("");

      // alert(`✅ Orden ${nuevaOrden.numero} creada correctamente`);
      toast.success(`✅ Orden ${nuevaOrden.numero} creada`);
    } catch (error) {
      console.error("Error:", error);
      // alert('Error al crear la orden');
      toast.error("Error al crear la orden");
    }
  };

  const handleEliminarOrden = async (ordenId) => {
    // const confirmar = window.confirm('...');
    const confirmar = await confirmarAccion({
      title: "¿Eliminar esta orden?",
      message: "Se borrarán todos los productos asociados.",
      confirmText: "Eliminar",
      confirmColor: "#dc3545",
    });
    if (!confirmar) return;

    try {
      await eliminarOrden(ordenId);
      setOrdenes(ordenes.filter((o) => o._id !== ordenId));
      toast.success("Orden eliminada"); // En lugar de alert
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar la orden"); // En lugar de alert
    }
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
      	<p>Cargando órdenes...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>📦 Órdenes de Compra</h1>
      <p>Gestiona los pedidos a proveedores con control de códigos de barras</p>

      {/* FORMULARIO CREAR ORDEN */}
      <div
      	style={{
      	  background: "#fff",
      	  padding: "1.5rem",
      	  borderRadius: "12px",
      	  marginBottom: "2rem",
      	  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      	}}
      >
    	<h3 style={{ marginTop: 0 }}>Nueva Orden de Compra</h3>
    	<form
      	  onSubmit={handleCrearOrden}
      	  style={{
      		display: "grid",
      		gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      		gap: "1rem",
      	  }}
    	>
    	  <div>
    		<label
      		  style={{
      			display: "block",
      			marginBottom: "0.5rem",
      			fontWeight: "600",
      		  }}
    		>
    		  Proveedor
    		</label>
    		<select
      		  value={proveedorSeleccionado}
      		  onChange={(e) => setProveedorSeleccionado(e.target.value)}
      		  required
      		  style={{
      			width: "100%",
      			padding: "0.5rem",
      			borderRadius: "4px",
      			border: "1px solid #ddd",
      		  }}
    		>
    		  <option value="">Seleccionar proveedor</option>
    		  {proveedores.map((p) => (
    			<option key={p._id} value={p._id}>
    			  {p.nombre}
    			</option>
    		  ))}
    		</select>
    	  </div>

    	  <div>
    		<label
      		  style={{
      			display: "block",
      			marginBottom: "0.5rem",
      			fontWeight: "600",
      		  }}
    		>
    		  Fecha
    		</label>
    		<input
      		  type="date"
      		  value={fechaOrden}
      		  onChange={(e) => setFechaOrden(e.target.value)}
      		  required
      		  style={{
      			width: "100%",
      			padding: "0.5rem",
      			borderRadius: "4px",
      			border: "1px solid #ddd",
      		  }}
    		/>
    	  </div>

    	  <div>
    		<label
      		  style={{
      			display: "block",
      			marginBottom: "0.5rem",
      			fontWeight: "600",
      		  }}
    		>
    		  Observaciones (opcional)
    		</label>
    		<input
      		  type="text"
      		  value={observaciones}
      		  onChange={(e) => setObservaciones(e.target.value)}
      		  placeholder="Notas adicionales"
      		  style={{
      			width: "100%",
      			padding: "0.5rem",
      			borderRadius: "4px",
      			border: "1px solid #ddd",
      		  }}
    		/>
    	  </div>

    	  <div style={{ display: "flex", alignItems: "flex-end" }}>
  		<button type="submit" className="btn" style={{ width: "100%" }}>
  		  Crear Orden
  		</button>
  	  </div>
    	</form>
      </div>

      {/* LISTA DE ÓRDENES */}
      <h2>Órdenes Creadas ({ordenes.length})</h2>

      {ordenes.length === 0 && (
    	<p style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
    	  No hay órdenes creadas. Crea la primera orden arriba.
    	</p>
      )}

      <div
    	style={{
    	  display: "grid",
    	  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    	  gap: "1.5rem",
    	}}
      >
    	{ordenes.map((orden) => {
    	  const proveedor = proveedores.find(
    		(p) => p._id === orden.proveedorId
    	  );

    	  return (
  		<div
  		  key={orden._id}
  		  className="card"
  		  style={{
  			position: "relative",
  			padding: "1.5rem",
  		  }}
  		>
  		  <button
  			onClick={() => handleEliminarOrden(orden._id)}
  			style={{
  			  position: "absolute",
  			  top: "10px",
  			  right: "10px",
  			  background: "none",
  			  border: "none",
  			  color: "#999",
  			  cursor: "pointer",
  			  fontSize: "1.2rem",
  			  fontWeight: "bold",
  			}}
  		  >
  			X
  		  </button>

  		  <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
  			{orden.numero}
  		  </h3>

  		  <div style={{ marginBottom: "1rem" }}>
  			{getEstadoBadge(orden.estado)}
  		  </div>

  		  <p style={{ margin: "0.5rem 0", color: "#666" }}>
  			<strong>Proveedor:</strong> {proveedor?.nombre || "Desconocido"}
  		  </p>

  		  <p style={{ margin: "0.5rem 0", color: "#666" }}>
  			<strong>Fecha:</strong> {formatearFechaLocal(orden.fecha)}
  		  </p>

  		  <p style={{ margin: "0.5rem 0", color: "#666" }}>
  			<strong>Total:</strong> ${orden.total.toLocaleString("es-AR")}
  		  </p>

  		  {orden.observaciones && (
  			<p
  			  style={{
  				margin: "0.5rem 0",
  				color: "#666",
  				fontSize: "0.9rem",
  				fontStyle: "italic",
  			  }}
  			>
  			  {orden.observaciones}
  			</p>
  		  )}

  		  <Link
  			to={`/ordenes/${orden._id}`}
  			className="btn"
  			style={{
  			  marginTop: "1rem",
  			  textDecoration: "none",
  			  textAlign: "center",
  			  display: "block",
  			}}
  		  >
  			Ver Detalle
  		  </Link>
  		</div>
  	  );
  	})}
    </div>
  </div>
  );
}

export default OrdenesCompra;