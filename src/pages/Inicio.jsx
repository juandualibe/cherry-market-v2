import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  obtenerProveedores,
  obtenerFacturasProveedor,
  obtenerPagosProveedor,
} from "../services/apiPrincipal";
import * as XLSX from "xlsx";
import { formatearFechaLocal } from "../utils/dateUtils";

const calcularSaldoPendiente = (
  proveedorId,
  todasLasFacturas,
  todosLosPagos
) => {
  const totalFacturas = todasLasFacturas
    .filter((f) => f.proveedorId === proveedorId)
    .reduce((total, f) => total + f.monto, 0);

  const totalRechazos = todasLasFacturas
    .filter((f) => f.proveedorId === proveedorId)
    .reduce((total, f) => total + (f.rechazo || 0), 0);

  const totalPagos = todosLosPagos
    .filter((p) => p.proveedorId === proveedorId)
    .reduce((total, p) => total + p.monto, 0);

  return totalFacturas - totalRechazos - totalPagos;
};

const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

const tresDiasDespues = new Date(hoy);
tresDiasDespues.setDate(hoy.getDate() + 3);

const sieteDiasDespues = new Date(hoy);
sieteDiasDespues.setDate(hoy.getDate() + 7);

function Inicio() {
  const [alertasVencidas, setAlertasVencidas] = useState([]);
  const [alertasProximasVencer, setAlertasProximasVencer] = useState([]);
  const [alertasPorVencer, setAlertasPorVencer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backupExpandido, setBackupExpandido] = useState(false);
  const [generandoBackup, setGenerandoBackup] = useState(false);

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      const proveedores = await obtenerProveedores();

      // Cargar todas las facturas y pagos
      const todasLasFacturas = [];
      const todosLosPagos = [];

      for (const proveedor of proveedores) {
        const facturas = await obtenerFacturasProveedor(proveedor._id);
        const pagos = await obtenerPagosProveedor(proveedor._id);
        todasLasFacturas.push(...facturas);
        todosLosPagos.push(...pagos);
      }

      const alertasVencidasTemp = [];
      const alertasProximasVencerTemp = [];
      const alertasPorVencerTemp = [];

      for (const proveedor of proveedores) {
        const saldo = calcularSaldoPendiente(
          proveedor._id,
          todasLasFacturas,
          todosLosPagos
        );

        if (saldo <= 0) {
          continue;
        }

        const facturasProveedor = todasLasFacturas.filter(
          (f) => f.proveedorId === proveedor._id
        );

        let tieneVencidas = false;
        let tieneProximasVencer = false;
        let tienePorVencer = false;

        for (const factura of facturasProveedor) {
          if (factura.fechaVencimiento) {
            const [año, mes, dia] = factura.fechaVencimiento
              .split("T")[0]
              .split("-");
            const fechaVenc = new Date(año, mes - 1, dia);

            if (fechaVenc < hoy) {
              tieneVencidas = true;
            } else if (fechaVenc >= hoy && fechaVenc <= tresDiasDespues) {
              tieneProximasVencer = true;
            } else if (
              fechaVenc > tresDiasDespues &&
              fechaVenc <= sieteDiasDespues
            ) {
              tienePorVencer = true;
            }
          }
        }

        const infoAlerta = {
          id: proveedor._id,
          nombre: proveedor.nombre,
          saldo: saldo,
        };

        if (tieneVencidas) {
          alertasVencidasTemp.push(infoAlerta);
        } else if (tieneProximasVencer) {
          alertasProximasVencerTemp.push(infoAlerta);
        } else if (tienePorVencer) {
          alertasPorVencerTemp.push(infoAlerta);
        }
      }

      setAlertasVencidas(alertasVencidasTemp);
      setAlertasProximasVencer(alertasProximasVencerTemp);
      setAlertasPorVencer(alertasPorVencerTemp);
    } catch (error) {
      console.error("Error cargando alertas:", error);
      alert("Error al cargar las alertas. ¿Está el backend funcionando?");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarBackup = async () => {
    try {
      setGenerandoBackup(true);

      // Importar todas las funciones necesarias
      const {
        obtenerClientes,
        obtenerDeudasCliente,
        obtenerMeses,
        obtenerVentasMes,
        obtenerGastosMes,
      } = await import("../services/apiPrincipal");

      // Cargar todos los datos
      const clientes = await obtenerClientes();
      const proveedores = await obtenerProveedores();
      const meses = await obtenerMeses();

      const todasLasDeudas = [];
      for (const cliente of clientes) {
        const deudas = await obtenerDeudasCliente(cliente._id);
        todasLasDeudas.push(...deudas);
      }

      const todasLasFacturas = [];
      const todosLosPagos = [];
      for (const proveedor of proveedores) {
        const facturas = await obtenerFacturasProveedor(proveedor._id);
        const pagos = await obtenerPagosProveedor(proveedor._id);
        todasLasFacturas.push(...facturas);
        todosLosPagos.push(...pagos);
      }

      const todasLasVentas = [];
      const todosLosGastos = [];
      for (const mes of meses) {
        const ventas = await obtenerVentasMes(mes.mesId);
        const gastos = await obtenerGastosMes(mes.mesId);
        todasLasVentas.push(...ventas);
        todosLosGastos.push(...gastos);
      }

      // Función helper para formatear moneda en Excel
      const aplicarFormatoMoneda = (ws, numRows, ...columnas) => {
        const currencyFormat = '"$"#,##0.00';
        for (let i = 2; i <= numRows + 1; i++) {
          columnas.forEach((col) => {
            if (ws[col + i]) {
              ws[col + i].z = currencyFormat;
            }
          });
        }
      };

      // Crear Excel
      const wb = XLSX.utils.book_new();

      // ==================== HOJA 1: RESUMEN CLIENTES ====================
      const clientesConDeudas = clientes.map((cliente) => {
        const deudasCliente = todasLasDeudas.filter(
          (d) => d.clienteId === cliente._id
        );
        const totalDeuda = deudasCliente.reduce((sum, d) => sum + d.monto, 0);
        const cantidadDeudas = deudasCliente.length;
        const ultimaDeuda =
          deudasCliente.length > 0
            ? deudasCliente.sort(
                (a, b) => new Date(b.fecha) - new Date(a.fecha)
              )[0]
            : null;

        return {
          CLIENTE: cliente.nombre,
          TOTAL_ADEUDADO: totalDeuda,
          CANTIDAD_DEUDAS: cantidadDeudas,
          ULTIMA_DEUDA_FECHA: ultimaDeuda
            ? formatearFechaLocal(ultimaDeuda.fecha)
            : "-",
          ULTIMA_DEUDA_MONTO: ultimaDeuda ? ultimaDeuda.monto : 0,
        };
      });

      if (clientesConDeudas.length > 0) {
        const wsClientes = XLSX.utils.json_to_sheet(clientesConDeudas);
        aplicarFormatoMoneda(wsClientes, clientesConDeudas.length, "B", "E");
        XLSX.utils.book_append_sheet(wb, wsClientes, "Resumen Clientes");
      }

      // ==================== HOJA 2: DETALLE DEUDAS ====================
      const detalleDeudas = todasLasDeudas
        .map((deuda) => {
          const cliente = clientes.find((c) => c._id === deuda.clienteId);
          return {
            CLIENTE: cliente ? cliente.nombre : "Desconocido",
            FECHA: formatearFechaLocal(deuda.fecha),
            MONTO: deuda.monto,
          };
        })
        .sort((a, b) => a.CLIENTE.localeCompare(b.CLIENTE));

      if (detalleDeudas.length > 0) {
        const wsDeudas = XLSX.utils.json_to_sheet(detalleDeudas);
        aplicarFormatoMoneda(wsDeudas, detalleDeudas.length, "C");
        XLSX.utils.book_append_sheet(wb, wsDeudas, "Detalle Deudas");
      }

      // ==================== HOJA 3: RESUMEN PROVEEDORES ====================
      const proveedoresConFacturas = proveedores.map((proveedor) => {
        const facturasProveedor = todasLasFacturas.filter(
          (f) => f.proveedorId === proveedor._id
        );
        const pagosProveedor = todosLosPagos.filter(
          (p) => p.proveedorId === proveedor._id
        );

        const totalFacturas = facturasProveedor.reduce(
          (sum, f) => sum + f.monto,
          0
        );
        const totalRechazos = facturasProveedor.reduce(
          (sum, f) => sum + (f.rechazo || 0),
          0
        );
        const totalPagado = pagosProveedor.reduce((sum, p) => sum + p.monto, 0);
        const saldoPendiente = totalFacturas - totalRechazos - totalPagado;

        return {
          PROVEEDOR: proveedor.nombre,
          TOTAL_FACTURAS: facturasProveedor.length,
          MONTO_FACTURAS: totalFacturas,
          TOTAL_RECHAZOS: totalRechazos,
          TOTAL_PAGADO: totalPagado,
          SALDO_PENDIENTE: saldoPendiente,
          CANTIDAD_PAGOS: pagosProveedor.length,
        };
      });

      if (proveedoresConFacturas.length > 0) {
        const wsProveedores = XLSX.utils.json_to_sheet(proveedoresConFacturas);
        aplicarFormatoMoneda(
          wsProveedores,
          proveedoresConFacturas.length,
          "C",
          "D",
          "E",
          "F"
        );
        XLSX.utils.book_append_sheet(wb, wsProveedores, "Resumen Proveedores");
      }

      // ==================== HOJA 4: DETALLE FACTURAS ====================
      const detalleFacturas = todasLasFacturas
        .map((factura) => {
          const proveedor = proveedores.find(
            (p) => p._id === factura.proveedorId
          );
          const pagosFactura = todosLosPagos.filter(
            (p) => p.proveedorId === factura.proveedorId
          );
          const totalPagado = pagosFactura.reduce((sum, p) => sum + p.monto, 0);
          const saldo = factura.monto - (factura.rechazo || 0) - totalPagado;

          return {
            PROVEEDOR: proveedor ? proveedor.nombre : "Desconocido",
            FECHA_FACTURA: formatearFechaLocal(factura.fecha),
            VENCIMIENTO: formatearFechaLocal(factura.fechaVencimiento),
            NUMERO: factura.numero,
            MONTO: factura.monto,
            RECHAZO: factura.rechazo || 0,
            SALDO: saldo,
          };
        })
        .sort((a, b) => {
          const fechaA = a.VENCIMIENTO.split("/").reverse().join("-");
          const fechaB = b.VENCIMIENTO.split("/").reverse().join("-");
          return new Date(fechaB) - new Date(fechaA);
        });

      if (detalleFacturas.length > 0) {
        const wsFacturas = XLSX.utils.json_to_sheet(detalleFacturas);
        aplicarFormatoMoneda(wsFacturas, detalleFacturas.length, "E", "F", "G");
        XLSX.utils.book_append_sheet(wb, wsFacturas, "Detalle Facturas");
      }

      // ==================== HOJA 5: DETALLE PAGOS ====================
      const detallePagos = todosLosPagos
        .map((pago) => {
          const proveedor = proveedores.find(
            (prov) => prov._id === pago.proveedorId
          );

          return {
            PROVEEDOR: proveedor ? proveedor.nombre : "Desconocido",
            FECHA_PAGO: formatearFechaLocal(pago.fecha),
            MONTO_PAGADO: pago.monto,
          };
        })
        .sort((a, b) => {
          const fechaA = a.FECHA_PAGO.split("/").reverse().join("-");
          const fechaB = b.FECHA_PAGO.split("/").reverse().join("-");
          return new Date(fechaB) - new Date(fechaA);
        });

      if (detallePagos.length > 0) {
        const wsPagos = XLSX.utils.json_to_sheet(detallePagos);
        aplicarFormatoMoneda(wsPagos, detallePagos.length, "C");
        XLSX.utils.book_append_sheet(wb, wsPagos, "Detalle Pagos");
      }

      // ==================== HOJA 6: RESUMEN VERDULERÍA ====================
      const resumenVerduleria = meses.map((mes) => {
        const ventasMes = todasLasVentas.filter((v) => v.mesId === mes.mesId);
        const gastosMes = todosLosGastos.filter((g) => g.mesId === mes.mesId);

        const totalVentas = ventasMes.reduce((sum, v) => sum + v.venta, 0);
        const totalCostoMerc = ventasMes.reduce(
          (sum, v) => sum + v.costoMercaderia,
          0
        );
        const totalGastosVariables = ventasMes.reduce(
          (sum, v) => sum + v.gastos,
          0
        );
        const totalGastosFijos = gastosMes.reduce(
          (sum, g) => sum + (parseFloat(g.verduleria) || 0),
          0
        );
        const margenNeto =
          totalVentas -
          totalCostoMerc -
          totalGastosVariables -
          totalGastosFijos;

        return {
          MES: mes.nombre,
          TOTAL_VENTAS: totalVentas,
          COSTO_MERCADERIA: totalCostoMerc,
          GASTOS_VARIABLES: totalGastosVariables,
          GASTOS_FIJOS: totalGastosFijos,
          MARGEN_NETO: margenNeto,
          DIAS_TRABAJADOS: ventasMes.length,
        };
      });

      if (resumenVerduleria.length > 0) {
        const wsResumenVerd = XLSX.utils.json_to_sheet(resumenVerduleria);
        aplicarFormatoMoneda(
          wsResumenVerd,
          resumenVerduleria.length,
          "B",
          "C",
          "D",
          "E",
          "F"
        );
        XLSX.utils.book_append_sheet(wb, wsResumenVerd, "Resumen Verdulería");
      }

      // ==================== HOJA 7: VENTAS DIARIAS ====================
      const ventasDetalle = todasLasVentas
        .map((venta) => {
          const mes = meses.find((m) => m.mesId === venta.mesId);
          return {
            MES: mes ? mes.nombre : "Desconocido",
            FECHA: formatearFechaLocal(venta.fecha),
            DIA: venta.diaSemana,
            COSTO_MERCADERIA: venta.costoMercaderia,
            GASTOS: venta.gastos,
            VENTA: venta.venta,
            MARGEN: venta.margen,
          };
        })
        .sort((a, b) => {
          const fechaA = a.FECHA.split("/").reverse().join("-");
          const fechaB = b.FECHA.split("/").reverse().join("-");
          return new Date(fechaB) - new Date(fechaA);
        });

      if (ventasDetalle.length > 0) {
        const wsVentas = XLSX.utils.json_to_sheet(ventasDetalle);
        aplicarFormatoMoneda(
          wsVentas,
          ventasDetalle.length,
          "D",
          "E",
          "F",
          "G"
        );
        XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas Diarias");
      }

      // ==================== HOJA 8: GASTOS FIJOS ====================
      const gastosDetalle = todosLosGastos
        .filter((g) => (parseFloat(g.verduleria) || 0) > 0)
        .map((gasto) => {
          const mes = meses.find((m) => m.mesId === gasto.mesId);
          return {
            MES: mes ? mes.nombre : "Desconocido",
            CONCEPTO: gasto.concepto,
            GASTO_TOTAL: parseFloat(gasto.total) || 0,
            PORCENTAJE: parseFloat(gasto.porcentaje) || 0,
            ASIGNADO_VERDULERIA: parseFloat(gasto.verduleria) || 0,
          };
        });

      if (gastosDetalle.length > 0) {
        const wsGastos = XLSX.utils.json_to_sheet(gastosDetalle);
        aplicarFormatoMoneda(wsGastos, gastosDetalle.length, "C", "E");
        XLSX.utils.book_append_sheet(wb, wsGastos, "Gastos Fijos");
      }

      // Generar archivo
      const ahora = new Date();
      const fecha = `${ahora.getFullYear()}-${String(
        ahora.getMonth() + 1
      ).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
      const hora = `${String(ahora.getHours()).padStart(2, "0")}-${String(
        ahora.getMinutes()
      ).padStart(2, "0")}`;
      const nombreArchivo = `Backup_Cherry_${fecha}_${hora}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);

      alert("✅ Backup generado exitosamente");
      setBackupExpandido(false);
    } catch (error) {
      console.error("Error generando backup:", error);
      alert("Error al generar el backup");
    } finally {
      setGenerandoBackup(false);
    }
  };

  return (
    <div>
      <h1>🍒 Dashboard de Cherry</h1>
      <p>Resumen rápido de las cuentas a pagar a proveedores.</p>

      {/* SECCIÓN DE BACKUP COLAPSABLE */}
      <div
        style={{
          marginBottom: "2rem",
          border: "2px solid #e0e0e0",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <button
          onClick={() => setBackupExpandido(!backupExpandido)}
          style={{
            width: "100%",
            padding: "1rem 1.5rem",
            background: backupExpandido
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "#f8f9fa",
            color: backupExpandido ? "white" : "#333",
            border: "none",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "1.1rem",
            fontWeight: "600",
            transition: "all 0.3s ease",
          }}
        >
          <span>💾 Generar Backup Completo</span>
          <span
            style={{
              fontSize: "1.5rem",
              transition: "transform 0.3s ease",
              transform: backupExpandido ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▼
          </span>
        </button>

        {backupExpandido && (
          <div
            style={{
              padding: "1.5rem",
              background: "white",
              borderTop: "2px solid #e0e0e0",
            }}
          >
            <p style={{ color: "#666", marginBottom: "1rem" }}>
              📊 Descarga un archivo Excel con todos tus datos actuales de
              MongoDB:
            </p>
            <ul
              style={{
                color: "#666",
                marginBottom: "1.5rem",
                paddingLeft: "1.5rem",
              }}
            >
              <li>Clientes y deudas</li>
              <li>Proveedores, facturas y pagos</li>
              <li>Verdulería (ventas y gastos)</li>
            </ul>
            <button
              onClick={handleGenerarBackup}
              disabled={generandoBackup}
              className="btn"
              style={{
                backgroundColor: "#28a745",
                fontSize: "1rem",
                padding: "0.75rem 1.5rem",
                fontWeight: "600",
                cursor: generandoBackup ? "not-allowed" : "pointer",
                opacity: generandoBackup ? 0.7 : 1,
              }}
            >
              {generandoBackup
                ? "⏳ Generando backup..."
                : "📥 Descargar Backup"}
            </button>
          </div>
        )}
      </div>

      {/* ALERTAS DE VENCIMIENTOS */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
        <div style={{ flex: 1, minWidth: "300px" }}>
          <h2 style={{ color: "#dc3545" }}>🔴 Facturas Vencidas</h2>
          <div className="lista-container">
            {loading && <p>Calculando...</p>}
            {!loading && alertasVencidas.length === 0 && (
              <p>¡Buenas noticias! No hay facturas vencidas.</p>
            )}
            {alertasVencidas.map((alerta) => (
              <div
                key={alerta.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "200px",
                  padding: "1.5rem",
                  borderLeft: "4px solid #dc3545",
                }}
              >
                <div>
                  <h3 style={{ marginBottom: "1rem" }}>{alerta.nombre}</h3>
                  <p
                    style={{
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      color: "#666",
                    }}
                  >
                    Saldo pendiente:
                  </p>
                  <div
                    className="total"
                    style={{
                      fontSize: "1.8rem",
                      marginBottom: "1.5rem",
                      wordBreak: "break-word",
                    }}
                  >
                    ${alerta.saldo.toLocaleString("es-AR")}
                  </div>
                </div>
                <Link
                  to="/proveedores"
                  className="btn"
                  style={{
                    marginTop: "auto",
                    textDecoration: "none",
                    textAlign: "center",
                    display: "block",
                    backgroundColor: "#dc3545",
                  }}
                >
                  Ir a Proveedores
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: "300px" }}>
          <h2 style={{ color: "#ff8c00" }}>🟠 Próximas a Vencer (0-3 días)</h2>
          <div className="lista-container">
            {loading && <p>Calculando...</p>}
            {!loading && alertasProximasVencer.length === 0 && (
              <p>No hay vencimientos urgentes.</p>
            )}
            {alertasProximasVencer.map((alerta) => (
              <div
                key={alerta.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "200px",
                  padding: "1.5rem",
                  borderLeft: "4px solid #ff8c00",
                }}
              >
                <div>
                  <h3 style={{ marginBottom: "1rem" }}>{alerta.nombre}</h3>
                  <p
                    style={{
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      color: "#666",
                    }}
                  >
                    Saldo pendiente:
                  </p>
                  <div
                    className="total"
                    style={{
                      fontSize: "1.8rem",
                      marginBottom: "1.5rem",
                      wordBreak: "break-word",
                    }}
                  >
                    ${alerta.saldo.toLocaleString("es-AR")}
                  </div>
                </div>
                <Link
                  to="/proveedores"
                  className="btn"
                  style={{
                    marginTop: "auto",
                    textDecoration: "none",
                    textAlign: "center",
                    display: "block",
                    backgroundColor: "#ff8c00",
                  }}
                >
                  Ir a Proveedores
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: "300px" }}>
          <h2 style={{ color: "#ffc107" }}>🟡 Por Vencer (4-7 días)</h2>
          <div className="lista-container">
            {loading && <p>Calculando...</p>}
            {!loading && alertasPorVencer.length === 0 && (
              <p>No hay vencimientos en esta ventana.</p>
            )}
            {alertasPorVencer.map((alerta) => (
              <div
                key={alerta.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "200px",
                  padding: "1.5rem",
                  borderLeft: "4px solid #ffc107",
                }}
              >
                <div>
                  <h3 style={{ marginBottom: "1rem" }}>{alerta.nombre}</h3>
                  <p
                    style={{
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      color: "#666",
                    }}
                  >
                    Saldo pendiente:
                  </p>
                  <div
                    className="total"
                    style={{
                      fontSize: "1.8rem",
                      marginBottom: "1.5rem",
                      wordBreak: "break-word",
                    }}
                  >
                    ${alerta.saldo.toLocaleString("es-AR")}
                  </div>
                </div>
                <Link
                  to="/proveedores"
                  className="btn"
                  style={{
                    marginTop: "auto",
                    textDecoration: "none",
                    textAlign: "center",
                    display: "block",
                  }}
                >
                  Ir a Proveedores
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inicio;
