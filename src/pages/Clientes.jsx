import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  obtenerClientes,
  crearCliente,
  eliminarCliente,
  obtenerDeudasCliente,
  agregarDeuda,
  eliminarDeuda,
  editarDeuda,
} from "../services/apiPrincipal";
import { obtenerFechaLocal, formatearFechaLocal } from "../utils/dateUtils";
import toast from "react-hot-toast";
import { confirmarAccion } from '../utils/confirmUtils';

function Clientes() {
  // Estados de la app
  const [clientes, setClientes] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para formulario simplificado
  const [nombreCliente, setNombreCliente] = useState("");
  const [montoDeuda, setMontoDeuda] = useState("");
  const [fechaDeuda, setFechaDeuda] = useState(obtenerFechaLocal());

  const [modalDeudaAbierto, setModalDeudaAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);

  const mouseDownInsideModal = useRef(false);

  // Cargar clientes al montar el componente
  useEffect(() => {
    cargarClientesYDeudas();
  }, []);

  const cargarClientesYDeudas = async () => {
    try {
      setLoading(true);
      const clientesData = await obtenerClientes();
      setClientes(clientesData);

      // Cargar todas las deudas de todos los clientes
      const todasLasDeudas = [];
      for (const cliente of clientesData) {
        const deudasCliente = await obtenerDeudasCliente(cliente._id);
        todasLasDeudas.push(...deudasCliente);
      }
      setDeudas(todasLasDeudas);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar los datos. Verifica la conexión.");
    } finally {
      setLoading(false);
    }
  };

  // NUEVO: Agregar cliente + deuda de una vez
  const handleAgregarClienteYDeuda = async (e) => {
    e.preventDefault();
    if (!nombreCliente.trim()) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }

    const monto = parseFloat(montoDeuda);
    if (!monto || monto <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    try {
      // Buscar si el cliente ya existe (case-insensitive)
      let cliente = clientes.find(
        (c) =>
          c.nombre.toLowerCase().trim() === nombreCliente.toLowerCase().trim()
      );

      // Si no existe, crear el cliente
      if (!cliente) {
        cliente = await crearCliente(nombreCliente.trim());
        setClientes([...clientes, cliente]);
      }

      // Agregar la deuda
      const nuevaDeuda = await agregarDeuda(cliente._id, fechaDeuda, monto);
      setDeudas([...deudas, nuevaDeuda]);

      // Limpiar formulario
      setNombreCliente("");
      setMontoDeuda("");
      setFechaDeuda(obtenerFechaLocal());

      toast.success(
        `${cliente.nombre}: Deuda de $${monto.toLocaleString(
          "es-AR"
        )} registrada`
      );
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al agregar cliente/deuda");
    }
  };

  const calcularTotalDeuda = (clienteId) => {
    return deudas
      .filter((deuda) => deuda.clienteId === clienteId)
      .reduce((total, deuda) => total + deuda.monto, 0);
  };

  const deudasDelClienteSeleccionado = deudas.filter(
    (deuda) =>
      clienteSeleccionado && deuda.clienteId === clienteSeleccionado._id
  );

  const handleEliminarCliente = async (clienteId) => {
    const confirmar = await confirmarAccion({
      title: "¿Eliminar cliente?",
      message: "Se borrarán TODAS sus deudas asociadas.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      confirmColor: "#dc3545",
    });

    if (!confirmar) return;
    try {
      await eliminarCliente(clienteId);

      const nuevosClientes = clientes.filter((c) => c._id !== clienteId);
      setClientes(nuevosClientes);

      const nuevasDeudas = deudas.filter((d) => d.clienteId !== clienteId);
      setDeudas(nuevasDeudas);

      if (clienteSeleccionado && clienteSeleccionado._id === clienteId) {
        setClienteSeleccionado(null);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar cliente");
    }
  };

  const handleEliminarDeuda = async (deudaId) => {
    const confirmar = await confirmarAccion({
      title: "¿Eliminar esta deuda?",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      confirmColor: "#dc3545",
    });

    if (!confirmar) return;

    try {
      await eliminarDeuda(deudaId);
      const nuevasDeudas = deudas.filter((d) => d._id !== deudaId);
      setDeudas(nuevasDeudas);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar deuda");
    }
  };

  const handleVerDetalle = (cliente) => {
    if (clienteSeleccionado && clienteSeleccionado._id === cliente._id) {
      setClienteSeleccionado(null);
    } else {
      setClienteSeleccionado(cliente);
    }
  };

  const handleCerrarModales = () => {
    setModalDeudaAbierto(false);
    setItemEditando(null);
    mouseDownInsideModal.current = false;
  };

  const handleAbrirModalDeuda = (deuda) => {
    setItemEditando({ ...deuda });
    setModalDeudaAbierto(true);
  };

  const handleEdicionChange = (e) => {
    const { name, value } = e.target;
    setItemEditando((prev) => ({ ...prev, [name]: value }));
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      mouseDownInsideModal.current = false;
    } else {
      mouseDownInsideModal.current = true;
    }
  };

  const handleOverlayClick = (e) => {
    if (
      e.target.classList.contains("modal-overlay") &&
      !mouseDownInsideModal.current
    ) {
      handleCerrarModales();
    }
    mouseDownInsideModal.current = false;
  };

  const handleGuardarDeudaEditada = async (e) => {
    e.preventDefault();
    const monto = parseFloat(itemEditando.monto);
    if (!monto || monto <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    try {
      await editarDeuda(itemEditando._id, itemEditando.fecha, monto);

      const deudasActualizadas = deudas.map((d) =>
        d._id === itemEditando._id ? { ...itemEditando, monto } : d
      );

      setDeudas(deudasActualizadas);
      handleCerrarModales();
      toast.success("Deuda editada correctamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al editar deuda");
    }
  };

  const handleExportarDeudas = () => {
    const formatearFecha = (fechaString) => {
      if (!fechaString) return "";
      // Parsear como fecha local sin conversión de zona horaria
      const [año, mes, dia] = fechaString.split("T")[0].split("-");
      return `${dia}/${mes}/${año}`;
    };

    const dataParaExportar = deudas.map((deuda) => {
      const cliente = clientes.find((c) => c._id === deuda.clienteId);
      return {
        CLIENTE: cliente ? cliente.nombre : "Cliente Desconocido",
        FECHA: formatearFecha(deuda.fecha),
        MONTO: deuda.monto,
      };
    });
    dataParaExportar.sort((a, b) => a.CLIENTE.localeCompare(b.CLIENTE));

    const ws = XLSX.utils.json_to_sheet(dataParaExportar, {
      header: ["CLIENTE", "FECHA", "MONTO"],
    });

    const currencyFormat = '"$"#,##0.00';
    const endRow = dataParaExportar.length + 1;
    for (let i = 2; i <= endRow; i++) {
      if (ws["C" + i]) ws["C" + i].z = currencyFormat;
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Deudas de Clientes");
    XLSX.writeFile(wb, "Reporte_Deudas_Clientes.xlsx");
  };

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const parsearFecha = (fechaString) => {
      if (fechaString instanceof Date) {
        // Si viene como objeto Date de Excel
        const año = fechaString.getFullYear();
        const mes = String(fechaString.getMonth() + 1).padStart(2, "0");
        const dia = String(fechaString.getDate()).padStart(2, "0");
        return `${año}-${mes}-${dia}`;
      }
      if (typeof fechaString === "string") {
        const partes = fechaString.split("/");
        if (partes.length === 3) {
          const dia = partes[0].padStart(2, "0");
          const mes = partes[1].padStart(2, "0");
          const anio = partes[2];
          return `${anio}-${mes}-${dia}`;
        }
      }
      if (typeof fechaString === "number") {
        // Serial date de Excel
        const date = XLSX.SSF.parse_date_code(fechaString);
        const dia = String(date.d).padStart(2, "0");
        const mes = String(date.m).padStart(2, "0");
        const anio = date.y;
        return `${anio}-${mes}-${dia}`;
      }
      return null;
    };

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const wb = XLSX.read(data, { type: "buffer", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          blankrows: false,
        });

        const nuevasDeudas = [];
        const clientesMap = new Map();

        clientes.forEach((c) => {
          clientesMap.set(c.nombre.toLowerCase().trim(), c._id);
        });

        for (let i = 1; i < aoa.length; i++) {
          const row = aoa[i];

          const nombreCliente = row[0];
          const fechaDeuda = row[1];
          const montoDeuda = row[2];

          if (
            nombreCliente &&
            fechaDeuda &&
            (typeof montoDeuda === "number" ||
              (typeof montoDeuda === "string" &&
                !isNaN(parseFloat(montoDeuda))))
          ) {
            const nombreNormalizado = String(nombreCliente)
              .toLowerCase()
              .trim();
            let clienteId = clientesMap.get(nombreNormalizado);

            if (!clienteId) {
              const nuevoCliente = await crearCliente(
                String(nombreCliente).trim()
              );
              clienteId = nuevoCliente._id;
              clientesMap.set(nombreNormalizado, clienteId);
              setClientes((clientesActuales) => [
                ...clientesActuales,
                nuevoCliente,
              ]);
            }

            const fechaParseada = parsearFecha(fechaDeuda);
            if (fechaParseada) {
              nuevasDeudas.push({
                clienteId: clienteId,
                fecha: fechaParseada,
                monto: parseFloat(montoDeuda),
              });
            }
          }
        }

        const confirmar = await confirmarAccion({
          title: "Importar deudas",
          message: `Se encontraron ${nuevasDeudas.length} deudas. ¿Deseas importarlas?`,
          confirmText: "Importar",
          cancelText: "Cancelar",
          confirmColor: "#28a745",
        });

        if (confirmar) {
          for (const deuda of nuevasDeudas) {
            const deudaCreada = await agregarDeuda(
              deuda.clienteId,
              deuda.fecha,
              deuda.monto
            );
            setDeudas((deudasActuales) => [...deudasActuales, deudaCreada]);
          }
          toast.success(
            `${nuevasDeudas.length} deudas importadas correctamente`
          );
        }
      } catch (error) {
        console.error("Error al leer el archivo de Excel:", error);
        toast.error(
          "Error al leer el archivo. Verifica el formato (CLIENTE, FECHA, MONTO)"
        );
      }
    };

    event.target.value = null;
    reader.readAsArrayBuffer(file);
  };

  const handleAgregarNuevaDeuda = () => {
    setNombreCliente(clienteSeleccionado.nombre);
    setFechaDeuda(obtenerFechaLocal());
    setMontoDeuda("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      document
        .querySelector('input[type="number"][placeholder="Monto de la deuda"]')
        ?.focus();
    }, 500);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <p>Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>👥 Gestión de Clientes</h1>

      {/* FORMULARIO SIMPLIFICADO */}
      <div
        style={{
          background: "#fff",
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Registrar Deuda</h3>
        <form
          onSubmit={handleAgregarClienteYDeuda}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          <input
            type="text"
            value={nombreCliente}
            onChange={(e) => setNombreCliente(e.target.value)}
            placeholder="Nombre del cliente"
            required
          />
          <input
            type="date"
            value={fechaDeuda}
            onChange={(e) => setFechaDeuda(e.target.value)}
            required
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={montoDeuda}
            onChange={(e) => setMontoDeuda(e.target.value)}
            placeholder="Monto de la deuda"
            required
          />
          <button type="submit" className="btn">
            Agregar Cliente
          </button>
        </form>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#666",
            marginTop: "0.5rem",
            marginBottom: 0,
          }}
        >
          💡 Si el cliente ya existe, se le sumará la deuda. Si no existe, se
          creará automáticamente.
        </p>
      </div>

      {/* BOTONES DE IMPORTAR/EXPORTAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <h2>Clientes con Deudas ({clientes.length})</h2>

        <div style={{ display: "flex", gap: "1rem" }}>
          <label
            className="btn"
            style={{ backgroundColor: "#0dcaf0", cursor: "pointer" }}
          >
            Importar Excel
            <input
              type="file"
              hidden
              accept=".xlsx, .xls"
              onChange={handleFileImport}
            />
          </label>

          {deudas.length > 0 && (
            <button
              className="btn"
              onClick={handleExportarDeudas}
              style={{ backgroundColor: "#198754" }}
            >
              Exportar Excel
            </button>
          )}
        </div>
      </div>

      {/* TABLA DE CLIENTES */}
      {clientes.length === 0 && (
        <p style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
          No hay clientes con deudas. Registra la primera deuda arriba.
        </p>
      )}

      <table
        className="tabla-detalles"
        style={{
          width: "100%",
          display: clientes.length > 0 ? "table" : "none",
        }}
      >
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Deuda Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map((cliente) => {
              const total = calcularTotalDeuda(cliente._id);
              const isSelected =
                clienteSeleccionado && clienteSeleccionado._id === cliente._id;

              return (
                <tr
                  key={cliente._id}
                  style={{
                    backgroundColor: isSelected ? "#e6f7ff" : "transparent",
                  }}
                >
                  <td style={{ fontWeight: "600" }}>{cliente.nombre}</td>
                  <td>
                    <div
                      className="total"
                      style={{
                        fontSize: "1.2rem",
                        padding: "0.5rem",
                        display: "inline-block",
                      }}
                    >
                      ${total.toLocaleString("es-AR")}
                    </div>
                  </td>
                  <td className="tabla-acciones">
                    <button
                      className="btn"
                      onClick={() => handleVerDetalle(cliente)}
                      style={{
                        backgroundColor: isSelected ? "#096dd9" : "#007aff",
                        padding: "0.4rem 0.8rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      {isSelected ? "Ocultar" : "Ver Detalle"}
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleEliminarCliente(cliente._id)}
                      style={{
                        backgroundColor: "#dc3545",
                        padding: "0.4rem 0.8rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {/* DETALLE DEL CLIENTE */}
      {clienteSeleccionado && (
        <div
          style={{
            marginTop: "3rem",
            padding: "1.5rem",
            background: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h2>Historial de Deudas: {clienteSeleccionado.nombre}</h2>
            <button
              className="btn"
              onClick={handleAgregarNuevaDeuda}
              style={{ backgroundColor: "#28a745" }}
            >
              + Agregar Nueva Deuda
            </button>
          </div>

          {deudasDelClienteSeleccionado.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "2rem",
                background: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <p style={{ marginBottom: "1rem" }}>
                Este cliente no tiene deudas registradas.
              </p>
              <button
                className="btn"
                onClick={handleAgregarNuevaDeuda}
                style={{ backgroundColor: "#28a745" }}
              >
                Registrar Primera Deuda
              </button>
            </div>
          ) : (
            <>
              <table className="tabla-detalles">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {deudasDelClienteSeleccionado
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .map((deuda) => (
                      <tr key={deuda._id}>
                        <td>{formatearFechaLocal(deuda.fecha)}</td>
                        <td>${deuda.monto.toLocaleString("es-AR")}</td>
                        <td className="tabla-acciones">
                          <button
                            onClick={() => handleAbrirModalDeuda(deuda)}
                            className="btn-editar"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminarDeuda(deuda._id)}
                            className="btn-eliminar"
                          >
                            X
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <h3 style={{ marginTop: "1.5rem" }}>
                Total Adeudado:
                <span
                  className="total"
                  style={{ fontSize: "1.5rem", marginLeft: "1rem" }}
                >
                  $
                  {calcularTotalDeuda(clienteSeleccionado._id).toLocaleString(
                    "es-AR"
                  )}
                </span>
              </h3>
            </>
          )}
        </div>
      )}

      {/* MODAL DE EDICIÓN */}
      {modalDeudaAbierto && itemEditando && (
        <div
          className="modal-overlay"
          onMouseDown={handleOverlayMouseDown}
          onClick={handleOverlayClick}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Editar Deuda</h2>
            <form
              onSubmit={handleGuardarDeudaEditada}
              className="form-container"
              style={{ flexDirection: "column" }}
            >
              <label>Fecha</label>
              <input
                type="date"
                name="fecha"
                value={itemEditando.fecha?.split("T")[0] || ""}
                onChange={handleEdicionChange}
              />

              <label>Monto</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="monto"
                value={itemEditando.monto}
                onChange={handleEdicionChange}
                placeholder="Monto de la deuda"
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={handleCerrarModales}
                  style={{ backgroundColor: "#6c757d" }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
