import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  obtenerMeses,
  crearMes,
  eliminarMes,
  obtenerVentasMes,
  agregarVenta,
  editarVenta,
  eliminarVenta,
  obtenerGastosMes,
  agregarGasto,
  editarGasto,
  eliminarGasto,
} from "../services/apiPrincipal";
import toast from "react-hot-toast";
import { confirmarAccion } from "../utils/confirmUtils";

// --- Función para obtener fecha local ---
const obtenerFechaLocal = () => {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${año}-${mes}-${dia}`;
};

// --- Función para formatear fecha sin conversión de zona horaria ---
const formatearFechaLocal = (fechaString) => {
  if (!fechaString) return "";
  const [año, mes, dia] = fechaString.split("T")[0].split("-");
  return `${dia}/${mes}/${año}`;
};

// --- Función para obtener mes/año actual ---
const obtenerMesActual = () => {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  return `${año}-${mes}`;
};

// --- Función para obtener nombre del día de la semana ---
const obtenerDiaSemana = (fechaString) => {
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const [año, mes, dia] = fechaString.split("T")[0].split("-");
  const fecha = new Date(año, mes - 1, dia);
  return dias[fecha.getDay()];
};

// --- Función para formatear mes a texto ---
const formatearMesTexto = (mesString) => {
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const [año, mes] = mesString.split("-");
  return `${meses[parseInt(mes) - 1]} ${año}`;
};

// --- Lista de gastos fijos predefinidos ---
const GASTOS_FIJOS_PREDEFINIDOS = [
  "Luz",
  "Alquiler",
  "Empleado",
  "GNC",
  "Descartable",
  "Rentas",
  "Municipal",
  "Agua",
  "Internet",
  "Limpieza",
  "Varios",
  "Mecánico",
  "Seguro Auto",
  "Seguro Negocio",
];

function Verduleria() {
  const [meses, setMeses] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [gastosFijos, setGastosFijos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para formularios
  const [nombreNuevoMes, setNombreNuevoMes] = useState(obtenerMesActual());
  const [fechaNuevaVenta, setFechaNuevaVenta] = useState(obtenerFechaLocal());
  const [costoMerc, setCostoMerc] = useState("");
  const [gastosVenta, setGastosVenta] = useState("");
  const [montoVenta, setMontoVenta] = useState("");

  // Estados para modales
  const [modalVentaAbierto, setModalVentaAbierto] = useState(false);
  const [modalGastosAbierto, setModalGastosAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [gastosEditando, setGastosEditando] = useState([]);

  const mouseDownInsideModal = useRef(false);

  // Cargar meses al montar el componente
  useEffect(() => {
    cargarMeses();
  }, []);

  const cargarMeses = async () => {
    try {
      setLoading(true);
      const mesesData = await obtenerMeses();
      setMeses(mesesData);
    } catch (error) {
      console.error("Error cargando meses:", error);
      toast.error("Error al cargar los datos. ¿Está el backend funcionando?");
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosMes = async (mesId) => {
    try {
      const ventasData = await obtenerVentasMes(mesId);
      const gastosData = await obtenerGastosMes(mesId);
      setVentas(ventasData);
      setGastosFijos(gastosData);
    } catch (error) {
      console.error("Error cargando datos del mes:", error);
      toast.error("Error al cargar datos del mes");
    }
  };

  // --- Funciones de Lógica ---

  const handleCrearMes = async (e) => {
    e.preventDefault();
    if (!nombreNuevoMes) return;

    const mesExiste = meses.find((m) => m.mesId === nombreNuevoMes);
    if (mesExiste) {
      toast.error("Este mes ya existe");
      return;
    }

    try {
      const nuevoMes = await crearMes(
        nombreNuevoMes,
        formatearMesTexto(nombreNuevoMes)
      );
      setMeses([...meses, nuevoMes]);
      setMesSeleccionado(nuevoMes);

      // Crear gastos fijos por defecto para este mes
      for (const concepto of GASTOS_FIJOS_PREDEFINIDOS) {
        await agregarGasto(nuevoMes.mesId, {
          concepto: concepto,
          total: 0,
          porcentaje: 0,
          verduleria: 0,
        });
      }

      // Recargar gastos
      const gastosData = await obtenerGastosMes(nuevoMes.mesId);
      setGastosFijos(gastosData);
      toast.success(`Mes ${nuevoMes.nombre} creado`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear mes");
    }
  };

  const handleEliminarMes = async (mesId) => {
    const confirmar = await confirmarAccion({
      title: "¿Eliminar este mes?",
      message: "Se borrarán TODAS las ventas y gastos asociados.",
      confirmText: "Eliminar",
      confirmColor: "#dc3545",
    });
    if (!confirmar) return;

    try {
      await eliminarMes(mesId);
      setMeses(meses.filter((m) => m.mesId !== mesId));

      if (mesSeleccionado && mesSeleccionado.mesId === mesId) {
        setMesSeleccionado(null);
        setVentas([]);
        setGastosFijos([]);
      }
      toast.success("Mes eliminado");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar mes");
    }
  };

  const handleSeleccionarMes = async (mes) => {
    if (mesSeleccionado && mesSeleccionado.mesId === mes.mesId) {
      setMesSeleccionado(null);
      setVentas([]);
      setGastosFijos([]);
    } else {
      setMesSeleccionado(mes);
      await cargarDatosMes(mes.mesId);
    }
  };

  const handleAgregarVenta = async (e) => {
    e.preventDefault();

    // ✅ Permitir 0, solo validar que NO sean null/undefined/string vacía
    const costo = costoMerc === "" ? 0 : parseFloat(costoMerc);
    const gastos = gastosVenta === "" ? 0 : parseFloat(gastosVenta);
    const venta = montoVenta === "" ? 0 : parseFloat(montoVenta);

    if (!mesSeleccionado) {
      toast.error("Por favor, selecciona un mes primero");
      return;
    }

    // ✅ Validar que al menos haya ALGÚN valor (no todo en 0)
    if (costo === 0 && gastos === 0 && venta === 0) {
      toast.error("Debe haber al menos un valor distinto de cero");
      return;
    }

    const margen = venta - costo - gastos;

    try {
      const nuevaVenta = await agregarVenta(mesSeleccionado.mesId, {
        fecha: fechaNuevaVenta,
        diaSemana: obtenerDiaSemana(fechaNuevaVenta),
        costoMercaderia: costo,
        gastos: gastos,
        venta: venta,
        margen: margen,
      });

      setVentas([...ventas, nuevaVenta]);
      setCostoMerc("");
      setGastosVenta("");
      setMontoVenta("");
      setFechaNuevaVenta(obtenerFechaLocal());
      toast.success("Venta registrada");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al agregar venta");
    }
  };

  const handleEliminarVenta = async (ventaId) => {
    const confirmar = await confirmarAccion({
      title: "¿Eliminar esta venta?",
      confirmText: "Eliminar",
      confirmColor: "#dc3545",
    });
    if (!confirmar) return;

    try {
      await eliminarVenta(ventaId);
      setVentas(ventas.filter((v) => v._id !== ventaId));
      toast.success("Venta eliminada");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar venta");
    }
  };

  const handleAbrirModalVenta = (venta) => {
    setItemEditando({ ...venta });
    setModalVentaAbierto(true);
  };

  const handleAbrirModalGastos = () => {
    const gastosDelMes = gastosFijos.filter(
      (g) => g.mesId === mesSeleccionado.mesId
    );
    setGastosEditando([...gastosDelMes]);
    setModalGastosAbierto(true);
  };

  const handleCerrarModales = () => {
    setModalVentaAbierto(false);
    setModalGastosAbierto(false);
    setItemEditando(null);
    setGastosEditando([]);
    mouseDownInsideModal.current = false;
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

  const handleEdicionVentaChange = (e) => {
    const { name, value } = e.target;
    setItemEditando((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardarVentaEditada = async (e) => {
    e.preventDefault();
    const costo = parseFloat(itemEditando.costoMercaderia);
    const gastos = parseFloat(itemEditando.gastos);
    const venta = parseFloat(itemEditando.venta);

    if (isNaN(costo) || isNaN(gastos) || isNaN(venta)) {
      toast.error("Todos los campos deben tener valores numéricos válidos");
      return;
    }

    const margen = venta - costo - gastos;

    try {
      await editarVenta(itemEditando._id, {
        fecha: itemEditando.fecha,
        diaSemana: obtenerDiaSemana(itemEditando.fecha),
        costoMercaderia: costo,
        gastos,
        venta,
        margen,
      });

      const ventasActualizadas = ventas.map((v) =>
        v._id === itemEditando._id
          ? {
              ...itemEditando,
              costoMercaderia: costo,
              gastos,
              venta,
              margen,
              diaSemana: obtenerDiaSemana(itemEditando.fecha),
            }
          : v
      );

      setVentas(ventasActualizadas);
      handleCerrarModales();
      toast.success("✅ Venta editada correctamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al editar venta");
    }
  };

  const handleGastoFijoChange = (index, field, value) => {
    const nuevosGastos = [...gastosEditando];

    if (value === "" || value === null || value === undefined) {
      nuevosGastos[index][field] = "";
    } else {
      nuevosGastos[index][field] = parseFloat(value) || 0;
    }

    if (field === "total" || field === "porcentaje") {
      const total = parseFloat(nuevosGastos[index].total) || 0;
      const porcentaje = parseFloat(nuevosGastos[index].porcentaje) || 0;
      nuevosGastos[index].verduleria = (total * porcentaje) / 100;
    }

    if (field === "verduleria") {
      const total = parseFloat(nuevosGastos[index].total) || 0;
      const verduleria = parseFloat(nuevosGastos[index].verduleria) || 0;
      nuevosGastos[index].porcentaje =
        total > 0 ? ((verduleria / total) * 100).toFixed(2) : 0;
    }

    setGastosEditando(nuevosGastos);
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  const handleGuardarGastosFijos = async (e) => {
    e.preventDefault();

    // ✅ Cerrar el modal INMEDIATAMENTE
    handleCerrarModales();

    // ✅ Actualizar el estado local INMEDIATAMENTE (feedback visual instantáneo)
    const gastosActualizados = gastosFijos.map((g) => {
      const gastoEditado = gastosEditando.find((ge) => ge._id === g._id);
      return gastoEditado ? gastoEditado : g;
    });
    setGastosFijos(gastosActualizados);

    // 🌐 Guardar en el servidor en background
    try {
      // Usar Promise.all para hacerlo en paralelo (más rápido)
      await Promise.all(
        gastosEditando.map((gasto) =>
          editarGasto(gasto._id, {
            total: parseFloat(gasto.total) || 0,
            porcentaje: parseFloat(gasto.porcentaje) || 0,
            verduleria: parseFloat(gasto.verduleria) || 0,
          })
        )
      );

      // ✅ Mostrar confirmación cuando termine de sincronizar
      console.log("✅ Gastos sincronizados con el servidor");
      toast.success("Gastos guardados");
    } catch (error) {
      console.error("Error:", error);
      toast.error("⚠️ Error al sincronizar. Recarga la página.");
      // Recargar datos del servidor para estar seguros
      await cargarDatosMes(mesSeleccionado.mesId);
    }
  };

  // --- Cálculos y Estadísticas ---

  const ventasDelMes = mesSeleccionado
    ? ventas.filter((v) => v.mesId === mesSeleccionado.mesId)
    : [];
  const gastosDelMes = mesSeleccionado
    ? gastosFijos.filter((g) => g.mesId === mesSeleccionado.mesId)
    : [];

  const totalVentas = ventasDelMes.reduce((sum, v) => sum + v.venta, 0);
  const totalCostoMerc = ventasDelMes.reduce(
    (sum, v) => sum + v.costoMercaderia,
    0
  );
  const totalGastosVariables = ventasDelMes.reduce(
    (sum, v) => sum + v.gastos,
    0
  );
  const totalGastosFijos = gastosDelMes.reduce(
    (sum, g) => sum + (parseFloat(g.verduleria) || 0),
    0
  );
  const margenNeto =
    totalVentas - totalCostoMerc - totalGastosVariables - totalGastosFijos;

  // --- Exportar a Excel ---
  const handleExportarMes = () => {
    if (!mesSeleccionado) return;

    const formatearFecha = (fechaString) => {
      if (!fechaString) return "";
      const [año, mes, dia] = fechaString.split("T")[0].split("-");
      return parseInt(dia);
    };

    const ventasData = ventasDelMes
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .map((v) => ({
        Día: v.diaSemana,
        Fecha: formatearFecha(v.fecha),
        "CTO. MERC": v.costoMercaderia,
        Gastos: v.gastos,
        Venta: v.venta,
        Margen: v.margen,
      }));

    const gastosData = gastosDelMes.map((g) => ({
      Gastos: g.concepto,
      "Total ($)": parseFloat(g.total) || 0,
      "Verdulería ($)": parseFloat(g.verduleria) || 0,
      "%": parseFloat(g.porcentaje) || 0,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    XLSX.utils.sheet_add_aoa(ws, [[mesSeleccionado.nombre.toUpperCase()]], {
      origin: "C1",
    });
    XLSX.utils.sheet_add_json(ws, ventasData, {
      origin: "B2",
      skipHeader: false,
    });
    XLSX.utils.sheet_add_json(ws, gastosData, {
      origin: "K1",
      skipHeader: false,
    });

    ws["C1"].s = {
      font: { bold: true, sz: 16, color: { rgb: "1F4E78" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "D9E1F2" } },
    };

    if (!ws["!merges"]) ws["!merges"] = [];
    ws["!merges"].push({ s: { r: 0, c: 2 }, e: { r: 0, c: 5 } });

    const headersVentas = ["B2", "C2", "D2", "E2", "F2", "G2"];
    headersVentas.forEach((cell) => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center", vertical: "center" },
          fill: { fgColor: { rgb: "4472C4" } },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    });

    const headersGastos = ["K1", "L1", "M1", "N1"];
    headersGastos.forEach((cell) => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center", vertical: "center" },
          fill: { fgColor: { rgb: "70AD47" } },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    });

    const currencyFormat = '"$"#,##0.00';
    const endVentaRow = ventasData.length + 2;
    const endGastoRow = gastosData.length + 1;

    for (let i = 3; i <= endVentaRow; i++) {
      if (ws["D" + i]) {
        ws["D" + i].z = currencyFormat;
        ws["D" + i].s = {
          font: { color: { rgb: "C00000" }, bold: true },
          numFmt: currencyFormat,
        };
      }
      if (ws["E" + i]) {
        ws["E" + i].z = currencyFormat;
        ws["E" + i].s = {
          font: { color: { rgb: "C00000" }, bold: true },
          numFmt: currencyFormat,
        };
      }
      if (ws["F" + i]) ws["F" + i].z = currencyFormat;
      if (ws["G" + i]) ws["G" + i].z = currencyFormat;
    }

    for (let i = 2; i <= endGastoRow; i++) {
      if (ws["L" + i]) ws["L" + i].z = currencyFormat;
      if (ws["M" + i]) ws["M" + i].z = currencyFormat;
    }

    ws["!cols"] = [
      { wch: 3 },
      { wch: 8 },
      { wch: 8 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 3 },
      { wch: 3 },
      { wch: 3 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, mesSeleccionado.nombre);
    XLSX.writeFile(wb, `Verduleria_${mesSeleccionado.nombre}.xlsx`);
  };

  // --- Importar desde Excel ---
  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const wb = XLSX.read(data, { type: "buffer" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          blankrows: false,
        });

        // Buscar el nombre del mes en las primeras celdas
        let nombreMes = "";
        for (let col = 0; col < 6; col++) {
          if (aoa[0] && aoa[0][col]) {
            const valor = String(aoa[0][col]).trim().toUpperCase();
            if (
              valor.match(
                /NOVIEMBRE|OCTUBRE|ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|DICIEMBRE/i
              )
            ) {
              nombreMes = valor;
              break;
            }
          }
        }

        if (!nombreMes) {
          toast.error("No se pudo detectar el nombre del mes en el Excel.");
          return;
        }

        let mesId = obtenerMesActual();
        const mesExistente = meses.find(
          (m) => m.nombre.toUpperCase() === nombreMes
        );

        if (mesExistente) {
          mesId = mesExistente.mesId;
        } else {
          const mesMatch = nombreMes.match(
            /(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\s+(\d{4})/i
          );
          if (mesMatch) {
            const mesesNombres = [
              "enero",
              "febrero",
              "marzo",
              "abril",
              "mayo",
              "junio",
              "julio",
              "agosto",
              "septiembre",
              "octubre",
              "noviembre",
              "diciembre",
            ];
            const mesNum = String(
              mesesNombres.indexOf(mesMatch[1].toLowerCase()) + 1
            ).padStart(2, "0");
            const año = mesMatch[2];
            mesId = `${año}-${mesNum}`;
          }
        }

        const nuevasVentas = [];
        const nuevosGastosFijos = [];

        // Leer ventas desde fila 3 (índice 2), columnas B-G
        for (let i = 2; i < aoa.length; i++) {
          const row = aoa[i];
          if (!row[1]) break;

          const diaSemana = row[1];
          const dia = row[2];
          const costoMerc = parseFloat(row[3]) || 0;
          const gastos = parseFloat(row[4]) || 0;
          const venta = parseFloat(row[5]) || 0;
          const margen = parseFloat(row[6]) || venta - costoMerc - gastos;

          if (dia && (costoMerc > 0 || gastos > 0 || venta > 0)) {
            const [año, mes] = mesId.split("-");
            const fecha = `${año}-${mes}-${String(dia).padStart(2, "0")}`;

            nuevasVentas.push({
              fecha: fecha,
              diaSemana: diaSemana,
              costoMercaderia: costoMerc,
              gastos: gastos,
              venta: venta,
              margen: margen,
            });
          }
        }

        // Leer gastos fijos desde fila 2 (índice 1), columnas K-N
        for (let i = 1; i < aoa.length; i++) {
          const row = aoa[i];
          if (!row[10]) continue;

          const concepto = String(row[10]).trim();
          const total = parseFloat(row[11]) || 0;
          const verduleria = parseFloat(row[12]) || 0;
          const porcentaje = parseFloat(row[13]) || 0;

          if (concepto && concepto !== "Gastos" && concepto !== "") {
            nuevosGastosFijos.push({
              concepto: concepto,
              total: total,
              verduleria: verduleria,
              porcentaje: porcentaje,
            });
          }
        }

        const confirmar = await confirmarAccion({
          title: "Importar datos",
          message: `Se encontraron ${nuevasVentas.length} ventas y ${nuevosGastosFijos.length} gastos fijos. ¿Deseas importarlos?`,
          confirmText: "Importar",
          confirmColor: "#28a745",
        });

        if (confirmar) {
          let mesAUsar = mesExistente;

          if (!mesExistente) {
            const nuevoMes = await crearMes(mesId, nombreMes);
            setMeses((prev) => [...prev, nuevoMes]);
            mesAUsar = nuevoMes;
            setMesSeleccionado(nuevoMes);
          }

          for (const venta of nuevasVentas) {
            await agregarVenta(mesAUsar.mesId, venta);
          }

          for (const gasto of nuevosGastosFijos) {
            await agregarGasto(mesAUsar.mesId, gasto);
          }

          if (mesSeleccionado && mesSeleccionado.mesId === mesAUsar.mesId) {
            await cargarDatosMes(mesAUsar.mesId);
          }

          toast.success("¡Datos importados con éxito!");
        }
      } catch (error) {
        console.error("Error al leer el archivo de Excel:", error);
        toast.error(
          "Hubo un error al leer el archivo. Asegúrate de que tenga el formato correcto."
        );
      }
    };

    event.target.value = null;
    reader.readAsArrayBuffer(file);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>🥬 Verdulería</h1>

      {!mesSeleccionado && (
        <>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              marginBottom: "2rem",
              flexWrap: "wrap",
            }}
          >
            <input
              type="month"
              value={nombreNuevoMes}
              onChange={(e) => setNombreNuevoMes(e.target.value)}
              style={{
                padding: "0.75rem",
                fontSize: "1rem",
                borderRadius: "8px",
                border: "2px solid #ddd",
              }}
            />
            <button onClick={handleCrearMes} className="btn">
              Crear Mes
            </button>
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
          </div>

          <h2>Meses</h2>
          <div className="lista-container">
            {meses.length === 0 && (
              <p>No hay meses. Crea uno o importa un Excel.</p>
            )}
            {meses.map((mes) => (
              <div
                key={mes.mesId}
                className="card"
                style={{ cursor: "pointer", position: "relative" }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEliminarMes(mes.mesId);
                  }}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "15px",
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
                <div onClick={() => handleSeleccionarMes(mes)}>
                  <h3>{mes.nombre}</h3>
                  <p>Click para ver detalles</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {mesSeleccionado && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            <h2>{mesSeleccionado.nombre}</h2>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                className="btn"
                onClick={handleExportarMes}
                style={{ backgroundColor: "#198754" }}
              >
                Exportar Excel
              </button>
              <button
                className="btn"
                onClick={() => setMesSeleccionado(null)}
                style={{ backgroundColor: "#6c757d" }}
              >
                ← Volver
              </button>
            </div>
          </div>

          {/* Resumen compacto */}
          <div
            style={{
              background:
                margenNeto >= 0
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              marginBottom: "2rem",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: "0 0 1rem 0" }}>Resultado del Mes</h3>
            <div style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
              ${margenNeto.toLocaleString("es-AR")}
            </div>
            <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9 }}>
              Ventas: ${totalVentas.toLocaleString("es-AR")} | Gastos: $
              {(
                totalCostoMerc +
                totalGastosVariables +
                totalGastosFijos
              ).toLocaleString("es-AR")}
            </p>
          </div>

          {/* Formulario simple */}
          <div
            style={{
              background: "#fff",
              padding: "1.5rem",
              borderRadius: "12px",
              marginBottom: "2rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Registrar Venta del Día</h3>
            <form
              onSubmit={handleAgregarVenta}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "1rem",
              }}
            >
              <input
                type="date"
                value={fechaNuevaVenta}
                onChange={(e) => setFechaNuevaVenta(e.target.value)}
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={costoMerc}
                onChange={(e) => setCostoMerc(e.target.value)}
                placeholder="Costo Merc. (opcional)"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={gastosVenta}
                onChange={(e) => setGastosVenta(e.target.value)}
                placeholder="Gastos (opcional)"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={montoVenta}
                onChange={(e) => setMontoVenta(e.target.value)}
                placeholder="Venta (opcional)"
              />
              <button
                type="submit"
                className="btn"
                style={{ gridColumn: "span 1" }}
              >
                Agregar
              </button>
            </form>
          </div>

          {/* TABLA DE VENTAS */}
          <div style={{ marginBottom: "2rem" }}>
            <h3>📅 Ventas Registradas ({ventasDelMes.length})</h3>
            <table className="tabla-detalles">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Costo</th>
                  <th>Gastos</th>
                  <th>Venta</th>
                  <th>Margen</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventasDelMes.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: "2rem",
                        color: "#999",
                      }}
                    >
                      No hay ventas registradas. Agrega la primera venta arriba.
                    </td>
                  </tr>
                )}
                {ventasDelMes
                  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                  .map((venta) => (
                    <tr key={venta._id}>
                      <td>{formatearFechaLocal(venta.fecha)}</td>
                      <td>${venta.costoMercaderia.toLocaleString("es-AR")}</td>
                      <td>${venta.gastos.toLocaleString("es-AR")}</td>
                      <td>${venta.venta.toLocaleString("es-AR")}</td>
                      <td
                        style={{
                          color: venta.margen >= 0 ? "#28a745" : "#dc3545",
                          fontWeight: "600",
                        }}
                      >
                        ${venta.margen.toLocaleString("es-AR")}
                      </td>
                      <td className="tabla-acciones">
                        <button
                          onClick={() => handleAbrirModalVenta(venta)}
                          className="btn-editar"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminarVenta(venta._id)}
                          className="btn-eliminar"
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* TABLA DE GASTOS FIJOS VISIBLE */}
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
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ margin: 0 }}>💰 Gastos Fijos del Mes</h3>
              <button
                className="btn"
                onClick={handleAbrirModalGastos}
                style={{ backgroundColor: "#ffc107", color: "#000" }}
              >
                ⚙️ Editar Gastos
              </button>
            </div>

            <p style={{ color: "#666", marginBottom: "1rem" }}>
              Total asignado a Verdulería:{" "}
              <strong style={{ color: "#dc3545", fontSize: "1.3rem" }}>
                ${totalGastosFijos.toLocaleString("es-AR")}
              </strong>
            </p>

            <table className="tabla-detalles">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Total Gasto</th>
                  <th>% Verdulería</th>
                  <th>Monto Asignado</th>
                </tr>
              </thead>
              <tbody>
                {gastosDelMes
                  .filter((g) => (parseFloat(g.verduleria) || 0) > 0)
                  .map((gasto) => (
                    <tr key={gasto._id}>
                      <td style={{ fontWeight: "600" }}>{gasto.concepto}</td>
                      <td>
                        $
                        {(parseFloat(gasto.total) || 0).toLocaleString("es-AR")}
                      </td>
                      <td>{(parseFloat(gasto.porcentaje) || 0).toFixed(0)}%</td>
                      <td style={{ color: "#dc3545", fontWeight: "600" }}>
                        $
                        {(parseFloat(gasto.verduleria) || 0).toLocaleString(
                          "es-AR"
                        )}
                      </td>
                    </tr>
                  ))}
                {gastosDelMes.filter((g) => (parseFloat(g.verduleria) || 0) > 0)
                  .length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      style={{
                        textAlign: "center",
                        padding: "2rem",
                        color: "#999",
                      }}
                    >
                      No hay gastos fijos configurados. Haz clic en "Editar
                      Gastos" para agregar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Edición de Venta */}
      {modalVentaAbierto && itemEditando && (
        <div
          className="modal-overlay"
          onMouseDown={handleOverlayMouseDown}
          onClick={handleOverlayClick}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Editar Venta</h2>
            <form
              onSubmit={handleGuardarVentaEditada}
              className="form-container"
              style={{ flexDirection: "column" }}
            >
              <label>Fecha</label>
              <input
                type="date"
                name="fecha"
                value={itemEditando.fecha?.split("T")[0] || ""}
                onChange={handleEdicionVentaChange}
              />
              <label>Costo Mercadería</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="costoMercaderia"
                value={itemEditando.costoMercaderia}
                onChange={handleEdicionVentaChange}
              />
              <label>Gastos</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="gastos"
                value={itemEditando.gastos}
                onChange={handleEdicionVentaChange}
              />
              <label>Venta</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="venta"
                value={itemEditando.venta}
                onChange={handleEdicionVentaChange}
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
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Gastos Fijos */}
      {modalGastosAbierto && (
        <div
          className="modal-overlay"
          onMouseDown={handleOverlayMouseDown}
          onClick={handleOverlayClick}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "900px",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h2>Gastos Fijos - {mesSeleccionado.nombre}</h2>
            <p
              style={{
                color: "#666",
                fontSize: "0.9rem",
                marginBottom: "1rem",
              }}
            >
              💡 Ingresa el <strong>Total</strong> del gasto y el{" "}
              <strong>%</strong> para Verdulería.
            </p>

            <form
              onSubmit={handleGuardarGastosFijos}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflow: "hidden",
              }}
            >
              <div style={{ flex: 1, overflow: "auto", marginBottom: "1rem" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      backgroundColor: "#f8f9fa",
                      zIndex: 1,
                    }}
                  >
                    <tr>
                      <th
                        style={{
                          padding: "0.75rem",
                          textAlign: "left",
                          borderBottom: "2px solid #dee2e6",
                          fontWeight: "600",
                        }}
                      >
                        Concepto
                      </th>
                      <th
                        style={{
                          padding: "0.75rem",
                          textAlign: "left",
                          borderBottom: "2px solid #dee2e6",
                          fontWeight: "600",
                        }}
                      >
                        Total ($)
                      </th>
                      <th
                        style={{
                          padding: "0.75rem",
                          textAlign: "left",
                          borderBottom: "2px solid #dee2e6",
                          fontWeight: "600",
                        }}
                      >
                        % Verdulería
                      </th>
                      <th
                        style={{
                          padding: "0.75rem",
                          textAlign: "left",
                          borderBottom: "2px solid #dee2e6",
                          fontWeight: "600",
                        }}
                      >
                        Asignado ($)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gastosEditando.map((gasto, index) => (
                      <tr
                        key={gasto._id}
                        style={{ borderBottom: "1px solid #dee2e6" }}
                      >
                        <td style={{ padding: "0.75rem", fontWeight: "600" }}>
                          {gasto.concepto}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={gasto.total}
                            onChange={(e) =>
                              handleGastoFijoChange(
                                index,
                                "total",
                                e.target.value
                              )
                            }
                            onFocus={handleFocus}
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: "1px solid #dee2e6",
                              borderRadius: "4px",
                              fontSize: "0.95rem",
                            }}
                            placeholder="0"
                          />
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={gasto.porcentaje}
                            onChange={(e) =>
                              handleGastoFijoChange(
                                index,
                                "porcentaje",
                                e.target.value
                              )
                            }
                            onFocus={handleFocus}
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: "1px solid #dee2e6",
                              borderRadius: "4px",
                              fontSize: "0.95rem",
                            }}
                            placeholder="0"
                          />
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            fontWeight: "700",
                            color: "#007aff",
                          }}
                        >
                          $
                          {(parseFloat(gasto.verduleria) || 0).toLocaleString(
                            "es-AR",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                className="modal-actions"
                style={{
                  borderTop: "2px solid #dee2e6",
                  paddingTop: "1rem",
                  marginTop: "auto",
                }}
              >
                <button
                  type="button"
                  className="btn"
                  onClick={handleCerrarModales}
                  style={{ backgroundColor: "#6c757d" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ backgroundColor: "#28a745" }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Verduleria;
