import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  obtenerProveedores,
  crearProveedor,
  eliminarProveedor,
  obtenerFacturasProveedor,
  agregarFactura,
  editarFactura,
  eliminarFactura,
  obtenerPagosProveedor,
  agregarPago,
  editarPago,
  eliminarPago
} from '../services/apiPrincipal';
import { obtenerFechaLocal, formatearFechaLocal, sumarDias } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import { confirmarAccion } from '../utils/confirmUtils.jsx';


function Proveedores() {
  // Estados de siempre
  const [proveedores, setProveedores] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para formularios de "Añadir"
  const [nombreNuevoProveedor, setNombreNuevoProveedor] = useState('');
  const [fechaNuevaFactura, setFechaNuevaFactura] = useState(obtenerFechaLocal());
  const [numeroNuevaFactura, setNumeroNuevaFactura] = useState('');
  const [montoNuevaFactura, setMontoNuevaFactura] = useState('');
  const [montoRechazo, setMontoRechazo] = useState('');
  const [montoNuevoPago, setMontoNuevoPago] = useState('');
  const [fechaNuevoPago, setFechaNuevoPago] = useState(obtenerFechaLocal());
  const [fechaVencimientoNuevaFactura, setFechaVencimientoNuevaFactura] = useState(() => sumarDias(obtenerFechaLocal(), 7));

  // Estados para los modales de edición
  const [modalFacturaAbierto, setModalFacturaAbierto] = useState(false);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);

  // Estados para los modales de CREACIÓN
  const [modalFacturaNuevaAbierto, setModalFacturaNuevaAbierto] = useState(false);
  const [modalPagoNuevoAbierto, setModalPagoNuevoAbierto] = useState(false);

  const mouseDownInsideModal = useRef(false);

  // Cargar proveedores al montar el componente
  useEffect(() => {
    cargarProveedoresYDatos();
  }, []);

  const cargarProveedoresYDatos = async () => {
    try {
      setLoading(true);
      const proveedoresData = await obtenerProveedores();
      setProveedores(proveedoresData);

      const todasLasFacturas = [];
      const todosLosPagos = [];
      for (const proveedor of proveedoresData) {
        const facturasProveedor = await obtenerFacturasProveedor(proveedor._id);
        const pagosProveedor = await obtenerPagosProveedor(proveedor._id);
        todasLasFacturas.push(...facturasProveedor);
        todosLosPagos.push(...pagosProveedor);
      }
      setFacturas(todasLasFacturas);
      setPagos(todosLosPagos);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar los datos. Verifica la conexión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFechaVencimientoNuevaFactura(sumarDias(fechaNuevaFactura, 7));
  }, [fechaNuevaFactura]);

  // --- Funciones de Lógica ---
  
  const handleAgregarProveedor = async (e) => {
    e.preventDefault();
    if (!nombreNuevoProveedor.trim()) return;

    try {
      const nuevoProveedor = await crearProveedor(nombreNuevoProveedor.trim());
      setProveedores([...proveedores, nuevoProveedor]);
      setNombreNuevoProveedor("");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear proveedor");
    }
  };

  const handleCardClick = (proveedor) => {
    if (proveedorSeleccionado && proveedorSeleccionado._id === proveedor._id) {
      setProveedorSeleccionado(null);
    } else {
      setProveedorSeleccionado(proveedor);
    }
  };

  const handleEliminarProveedor = async (proveedorId) => {
    const confirmar = await confirmarAccion({
      title: "¿Eliminar proveedor?",
      message: "Se borrarán TODAS sus facturas y pagos asociados.",
      confirmText: "Eliminar",
      confirmColor: "#dc3545",
    });
    if (!confirmar) return;

    try {
      await eliminarProveedor(proveedorId);
      setProveedores(proveedores.filter((p) => p._id !== proveedorId));
      setFacturas(facturas.filter((f) => f.proveedorId !== proveedorId));
      setPagos(pagos.filter((p) => p.proveedorId !== proveedorId));
      if (proveedorSeleccionado && proveedorSeleccionado._id === proveedorId) {
        setProveedorSeleccionado(null);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar proveedor");
    }
  };

  const handleAgregarFactura = async (e) => {
    e.preventDefault();
    const monto = parseFloat(montoNuevaFactura);
    const rechazo = parseFloat(montoRechazo) || 0;
    const numero = numeroNuevaFactura.trim();
    if (
      !monto ||
      monto <= 0 ||
      !numero ||
      !fechaVencimientoNuevaFactura ||
      !proveedorSeleccionado
    ) {
      toast.error("Completa todos los campos requeridos");
      return;
    }
    
    try {
      const nuevaFactura = await agregarFactura(proveedorSeleccionado._id, {
        fecha: fechaNuevaFactura,
        fechaVencimiento: fechaVencimientoNuevaFactura,
        numero: numero,
        monto: monto,
        rechazo: rechazo,
      });
      setFacturas([...facturas, nuevaFactura]);
      setNumeroNuevaFactura("");
      setMontoNuevaFactura("");
      setMontoRechazo("");
      const hoy = obtenerFechaLocal();
      setFechaNuevaFactura(hoy);
      setFechaVencimientoNuevaFactura(sumarDias(hoy, 7));
      
      handleCerrarModales();
      toast.success("Factura agregada");

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al agregar factura");
    }
  };

  const handleAgregarPago = async (e) => {
    e.preventDefault();
    const monto = parseFloat(montoNuevoPago);
    if (!monto || monto <= 0 || !proveedorSeleccionado) return;

    try {
      const nuevoPago = await agregarPago(proveedorSeleccionado._id, {
        monto: monto,
        fecha: fechaNuevoPago,
      });
      setPagos([...pagos, nuevoPago]);
      setMontoNuevoPago("");
      setFechaNuevoPago(obtenerFechaLocal());
      
      handleCerrarModales();
      toast.success(`Pago de $${monto.toLocaleString("es-AR")} registrado`);

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al agregar pago");
    }
  };

  const handleEliminarFactura = async (facturaId) => {
    const confirmar = await confirmarAccion({
      title: "¿Eliminar factura?",
      message: "Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      confirmColor: "#dc3545",
    });
    if (!confirmar) return;
    
    try {
      await eliminarFactura(facturaId);
      setFacturas(facturas.filter((f) => f._id !== facturaId));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar factura");
    }
  };
  
  const handleEliminarPago = async (pagoId) => {
    const confirmar = await confirmarAccion({
      title: "¿Eliminar pago?",
      confirmText: "Eliminar",
      confirmColor: "#dc3545",
    });
    if (!confirmar) return;

    try {
      await eliminarPago(pagoId);
      setPagos(pagos.filter((p) => p._id !== pagoId));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar pago");
    }
  };

  const handleCerrarModales = () => {
    setModalFacturaAbierto(false);
    setModalPagoAbierto(false);
    setItemEditando(null);
    mouseDownInsideModal.current = false;
    
    setModalFacturaNuevaAbierto(false);
    setModalPagoNuevoAbierto(false);
  };

  const handleAbrirModalFactura = (factura) => {
    setItemEditando({...factura});
    setModalFacturaAbierto(true);
  };

  const handleAbrirModalPago = (pago) => {
    setItemEditando({...pago});
    setModalPagoAbierto(true);
  };

  const handleEdicionChange = (e) => {
    const { name, value } = e.target;
    setItemEditando(prev => ({ ...prev, [name]: value }));
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      mouseDownInsideModal.current = false;
    } else {
      mouseDownInsideModal.current = true;
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay') && !mouseDownInsideModal.current) {
      handleCerrarModales();
    }
    mouseDownInsideModal.current = false;
  };

  const handleGuardarFacturaEditada = async (e) => {
    e.preventDefault();
    const monto = parseFloat(itemEditando.monto);
    const rechazo = parseFloat(itemEditando.rechazo) || 0;
    
    if (!monto || monto <= 0 || !itemEditando.numero) {
      toast.error("El N° de factura y el monto son obligatorios");
      return;
    }
    
    try {
      await editarFactura(itemEditando._id, {
        fecha: itemEditando.fecha,
        fechaVencimiento: itemEditando.fechaVencimiento || null,
        numero: itemEditando.numero,
        monto,
        rechazo,
      });

      const facturasActualizadas = facturas.map((f) =>
        f._id === itemEditando._id
          ? {
              ...itemEditando,
              monto,
              rechazo,
              fechaVencimiento: itemEditando.fechaVencimiento || null,
            }
          : f
      );

      setFacturas(facturasActualizadas);
      handleCerrarModales();
      toast.success("Factura editada correctamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al editar factura");
    }
  };

  const handleGuardarPagoEditado = async (e) => {
    e.preventDefault();
    const monto = parseFloat(itemEditando.monto);
    if (!monto || monto <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }
    
    try {
      await editarPago(itemEditando._id, {
        fecha: itemEditando.fecha,
        monto,
      });

      const pagosActualizados = pagos.map((p) =>
        p._id === itemEditando._id ? { ...itemEditando, monto } : p
      );
      setPagos(pagosActualizados);
      handleCerrarModales();
      toast.success("Pago editado correctamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al editar pago");
    }
  };
  
  const calcularSaldoPendiente = (proveedorId) => {
    const totalFacturas = facturas.filter(f => f.proveedorId === proveedorId).reduce((total, f) => total + f.monto, 0);
    const totalRechazos = facturas.filter(f => f.proveedorId === proveedorId).reduce((total, f) => total + (f.rechazo || 0), 0);
    const totalPagos = pagos.filter(p => p.proveedorId === proveedorId).reduce((total, p) => total + p.monto, 0);
    return totalFacturas - totalRechazos - totalPagos;
  };

  const handleExportarProveedor = () => {
    if (!proveedorSeleccionado) return;
    const proveedorNombre = proveedorSeleccionado.nombre;
    
    const formatearFecha = (fechaString) => {
      if (!fechaString) return '';
      const [año, mes, dia] = fechaString.split('T')[0].split('-');
      return `${dia}/${mes}/${año}`;
    };
    
    const facturasData = facturas.filter(f => f.proveedorId === proveedorSeleccionado._id).map(f => {
      return { 
        FECHA: formatearFecha(f.fecha), 
        VENCIMIENTO: formatearFecha(f.fechaVencimiento), 
        'N°': f.numero, 
        MONTO: f.monto, 
        RECHAZO: f.rechazo || 0 
      };
    });
    
    const pagosData = pagos.filter(p => p.proveedorId === proveedorSeleccionado._id).map(p => {
      return { 
        FECHA: formatearFecha(p.fecha), 
        MONTO: p.monto 
      };
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(facturasData, { header: ["FECHA", "VENCIMIENTO", "N°", "MONTO", "RECHAZO"] });
    XLSX.utils.sheet_add_json(ws, pagosData, { header: ["FECHA", "MONTO"], skipHeader: false, origin: "I1" });
    
    const currencyFormat = '"$"#,##0.00';
    const endFacturaRow = facturasData.length + 1;
    const endPagoRow = pagosData.length + 1;
    
    for (let i = 2; i <= endFacturaRow; i++) {
      if (ws['D' + i]) ws['D' + i].z = currencyFormat;
      if (ws['E' + i]) ws['E' + i].z = currencyFormat;
    }
    for (let i = 2; i <= endPagoRow; i++) {
      if (ws['J' + i]) ws['J' + i].z = currencyFormat;
    }
    
    XLSX.utils.book_append_sheet(wb, ws, proveedorNombre);
    XLSX.writeFile(wb, `Reporte_${proveedorNombre}.xlsx`);
  };

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file || !proveedorSeleccionado) return;

    const parsearFecha = (fechaString) => {
      if (fechaString instanceof Date) {
        const año = fechaString.getFullYear();
        const mes = String(fechaString.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaString.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
      }
      if (typeof fechaString === 'string') {
        const partes = fechaString.split('/'); 
        if (partes.length === 3) {
          const dia = partes[0].padStart(2, '0');
          const mes = partes[1].padStart(2, '0');
          const anio = partes[2];
          return `${anio}-${mes}-${dia}`;
        }
      }
      if (typeof fechaString === 'number') {
        const date = XLSX.SSF.parse_date_code(fechaString);
        const dia = String(date.d).padStart(2, '0');
        const mes = String(date.m).padStart(2, '0');
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

        const nuevasFacturas = [];
        const nuevosPagos = [];

        for (let i = 1; i < aoa.length; i++) {
          const row = aoa[i];

          const fechaFactura = row[0];
          const fechaVencimiento = row[1];
          const numeroFactura = row[2];
          const montoFactura = row[3];
          const rechazoFactura = row[4];

          if (
            fechaFactura &&
            (typeof montoFactura === "number" ||
              (typeof montoFactura === "string" &&
                !isNaN(parseFloat(montoFactura))))
          ) {
            const fechaParseada = parsearFecha(fechaFactura);
            if (fechaParseada) {
              nuevasFacturas.push({
                fecha: fechaParseada,
                fechaVencimiento: parsearFecha(fechaVencimiento),
                numero: String(numeroFactura),
                monto: parseFloat(montoFactura),
                rechazo: parseFloat(rechazoFactura) || 0,
              });
            }
          }

          const fechaPago = row[8];
          const montoPago = row[9];
          if (
            fechaPago &&
            (typeof montoPago === "number" ||
              (typeof montoPago === "string" && !isNaN(parseFloat(montoPago))))
          ) {
            const fechaParseada = parsearFecha(fechaPago);
            if (fechaParseada) {
              nuevosPagos.push({
                fecha: fechaParseada,
                monto: parseFloat(montoPago),
              });
            }
          }
        }

        const confirmar = await confirmarAccion({
          title: "Importar datos",
          message: `Se encontraron ${nuevasFacturas.length} facturas y ${nuevosPagos.length} pagos. ¿Importar a ${proveedorSeleccionado.nombre}?`,
          confirmText: "Importar",
          confirmColor: "#28a745",
        });

        if (confirmar) {
          for (const factura of nuevasFacturas) {
            const facturaCreada = await agregarFactura(
              proveedorSeleccionado._id,
              factura
            );
            setFacturas((facturasActuales) => [
              ...facturasActuales,
              facturaCreada,
            ]);
          }
          for (const pago of nuevosPagos) {
            const pagoCreado = await agregarPago(
              proveedorSeleccionado._id,
              pago
            );
            setPagos((pagosActuales) => [...pagosActuales, pagoCreado]);
          }
          toast.success(
            `${nuevasFacturas.length} facturas y ${nuevosPagos.length} pagos importados`
          );
        }
      } catch (error) {
        console.error("Error al leer el archivo de Excel:", error);
        toast.error("Error al leer el archivo. Verifica el formato A1/I1");
      }
    };
    
    event.target.value = null; 
    reader.readAsArrayBuffer(file);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Cargando proveedores...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Gestión de Proveedores</h1>

      <form onSubmit={handleAgregarProveedor} className="form-container">
        <input type="text" value={nombreNuevoProveedor} onChange={(e) => setNombreNuevoProveedor(e.target.value)} placeholder="Nombre del nuevo proveedor" />
        <button type="submit" className="btn">Agregar Proveedor</button>
      </form>

      <h2>Lista de Proveedores</h2>
      <div className="lista-container">
        {proveedores.map(proveedor => {
          const saldo = calcularSaldoPendiente(proveedor._id);
          const claseSaldo = saldo > 0 ? 'total' : 'total positivo';
          return (
            <div key={proveedor._id} className="card" style={{cursor: 'pointer', position: 'relative'}}>
              <button onClick={(e) => { e.stopPropagation(); handleEliminarProveedor(proveedor._id); }} style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}>
                X
              </button>
              <div onClick={() => handleCardClick(proveedor)}>
                <h3>{proveedor.nombre}</h3>
                <p>Saldo pendiente:</p>
                <div className={claseSaldo}>
                  ${saldo.toLocaleString('es-AR')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {proveedorSeleccionado && (
        <div style={{marginTop: '3rem'}}>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
            <h2>Detalle de: {proveedorSeleccionado.nombre}</h2>
            <div style={{display: 'flex', gap: '1rem'}}>
              <label className="btn" style={{backgroundColor: '#0dcaf0', cursor: 'pointer'}}>
                Importar desde Excel
                <input 
                  type="file" 
                  hidden 
                  accept=".xlsx, .xls"
                  onChange={handleFileImport}
                />
              </label>
              <button className="btn" onClick={handleExportarProveedor} style={{backgroundColor: '#198754'}}>
                Exportar a Excel
              </button>
            </div>
          </div>

          <h3> Saldo Pendiente Total: 
            <span className={calcularSaldoPendiente(proveedorSeleccionado._id) > 0 ? 'total' : 'total positivo'} style={{fontSize: '1.5rem', marginLeft: '1rem'}}>
              ${calcularSaldoPendiente(proveedorSeleccionado._id).toLocaleString('es-AR')}
            </span>
          </h3>
          <hr style={{margin: '2rem 0'}} />

          <div className="proveedores-tablas-grid">
            
            {/* === COLUMNA 1: FACTURAS === */}
            <div style={{minWidth: '300px', marginBottom: '2.5rem'}}>
              
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <h3 style={{margin: 0}}>Facturas (Deudas)</h3>
                <button 
                  className="btn" 
                  onClick={() => setModalFacturaNuevaAbierto(true)}
                >
                  + Nueva Factura
                </button>
              </div>
              
              <table className="tabla-detalles">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Vencimiento</th>
                    <th>N° Factura</th>
                    <th>Monto</th>
                    <th>Rechazo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas
                    .filter(f => f.proveedorId === proveedorSeleccionado._id)
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .map(factura => (
                      <tr key={factura._id}>
                        <td>{formatearFechaLocal(factura.fecha)}</td>
                        <td style={{color: 'red', fontWeight: '600'}}>
                          {factura.fechaVencimiento ? formatearFechaLocal(factura.fechaVencimiento) : 'N/A'}
                        </td>
                        <td>{factura.numero}</td>
                        <td>${factura.monto.toLocaleString('es-AR')}</td>
                        <td style={{color: 'red'}}>
                          {(factura.rechazo && factura.rechazo > 0) ? `-$${factura.rechazo.toLocaleString('es-AR')}` : '$0.00'}
                        </td>
                        <td className="tabla-acciones">
                          <button 
                            onClick={() => handleAbrirModalFactura(factura)} 
                            className="btn-editar"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleEliminarFactura(factura._id)} 
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

            {/* === COLUMNA 2: PAGOS === */}
            <div style={{minWidth: '300px'}}>

              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <h3 style={{margin: 0}}>Pagos</h3>
                <button 
                  className="btn" 
                  style={{backgroundColor: '#5cb85c'}} 
                  onClick={() => setModalPagoNuevoAbierto(true)}
                >
                  + Nuevo Pago
                </button>
              </div>
              
              <table className="tabla-detalles">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto Pago</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos
                    .filter(p => p.proveedorId === proveedorSeleccionado._id)
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .map(pago => (
                      <tr key={pago._id}>
                        <td>{formatearFechaLocal(pago.fecha)}</td>
                        <td>${pago.monto.toLocaleString('es-AR')}</td>
                        <td className="tabla-acciones">
                          <button 
                            onClick={() => handleAbrirModalPago(pago)} 
                            className="btn-editar"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleEliminarPago(pago._id)} 
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
          </div>
          
          <button className="btn" onClick={() => setProveedorSeleccionado(null)} style={{backgroundColor: '#6c757d', marginTop: '2rem'}}>
            Volver a la lista
          </button>
        </div>
      )}

      {/* --- MODAL PARA NUEVA FACTURA --- */}
      {modalFacturaNuevaAbierto && (
        <div 
          className="modal-overlay" 
          onMouseDown={handleOverlayMouseDown}
          onClick={handleOverlayClick}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Cargar Nueva Factura</h2>
            <form onSubmit={handleAgregarFactura} className="form-container" style={{flexDirection: 'column'}}>
              <label>Fecha de Factura</label>
              <input type="date" value={fechaNuevaFactura} onChange={(e) => setFechaNuevaFactura(e.target.value)} />
              
              <label>Fecha de Vencimiento</label>
              <input type="date" value={fechaVencimientoNuevaFactura} onChange={(e) => setFechaVencimientoNuevaFactura(e.target.value)} />

              <label>N° Factura</label>
              <input type="text" value={numeroNuevaFactura} onChange={(e) => setNumeroNuevaFactura(e.target.value)} placeholder="N° de Factura" />
              <label>Monto</label>
              <input type="number" step="0.01" min="0" value={montoNuevaFactura} onChange={(e) => setMontoNuevaFactura(e.target.value)} placeholder="Monto de la factura" />
              <label>Rechazo (opcional)</label>
              <input type="number" step="0.01" min="0" value={montoRechazo} onChange={(e) => setMontoRechazo(e.target.value)} placeholder="Monto Rechazo (si aplica)" />
              
              <div className="modal-actions">
                <button type="button" className="btn" onClick={handleCerrarModales} style={{backgroundColor: '#6c757d'}}>Cancelar</button>
                <button type="submit" className="btn">Agregar Factura</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL PARA NUEVO PAGO --- */}
      {modalPagoNuevoAbierto && (
        <div 
          className="modal-overlay" 
          onMouseDown={handleOverlayMouseDown}
          onClick={handleOverlayClick}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Cargar Nuevo Pago</h2>
            <form onSubmit={handleAgregarPago} className="form-container" style={{flexDirection: 'column'}}>
              <label>Fecha de Pago</label>
              <input type="date" value={fechaNuevoPago} onChange={(e) => setFechaNuevoPago(e.target.value)} />
              <label>Monto</label>
              <input type="number" step="0.01" min="0" value={montoNuevoPago} onChange={(e) => setMontoNuevoPago(e.target.value)} placeholder="Monto del pago" />
              <div className="modal-actions">
                <button type="button" className="btn" onClick={handleCerrarModales} style={{backgroundColor: '#6c757d'}}>Cancelar</button>
                <button type="submit" className="btn" style={{backgroundColor: '#5cb85c'}}>Agregar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* --- MODAL PARA EDITAR FACTURA --- */}
      {modalFacturaAbierto && itemEditando && (
        <div 
          className="modal-overlay" 
          onMouseDown={handleOverlayMouseDown}
          onClick={handleOverlayClick}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Editar Factura</h2>
            <form onSubmit={handleGuardarFacturaEditada} className="form-container" style={{flexDirection: 'column'}}>
              <label>Fecha</label>
              <input type="date" name="fecha" value={itemEditando.fecha?.split('T')[0] || ''} onChange={handleEdicionChange} />
              
              <label>Fecha Vencimiento (opcional)</label>
              <input type="date" name="fechaVencimiento" value={itemEditando.fechaVencimiento?.split('T')[0] || ''} onChange={handleEdicionChange} />

              <label>N° Factura</label>
              <input type="text" name="numero" value={itemEditando.numero} onChange={handleEdicionChange} placeholder="N° de Factura" />
              <label>Monto</label>
              <input type="number" step="0.01" min="0" name="monto" value={itemEditando.monto} onChange={handleEdicionChange} placeholder="Monto de la factura" />
              <label>Rechazo</label>
              <input type="number" step="0.01" min="0" name="rechazo" value={itemEditando.rechazo || 0} onChange={handleEdicionChange} placeholder="Monto Rechazo (si aplica)" />
              <div className="modal-actions">
                <button type="button" className="btn" onClick={handleCerrarModales} style={{backgroundColor: '#6c757d'}}>Cancelar</button>
                <button type="submit" className="btn">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL PARA EDITAR PAGO --- */}
      {modalPagoAbierto && itemEditando && (
        <div 
          className="modal-overlay" 
          onMouseDown={handleOverlayMouseDown}
          onClick={handleOverlayClick}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Editar Pago</h2>
            <form onSubmit={handleGuardarPagoEditado} className="form-container" style={{flexDirection: 'column'}}>
              <label>Fecha</label>
              <input type="date" name="fecha" value={itemEditando.fecha?.split('T')[0] || ''} onChange={handleEdicionChange} />
              <label>Monto</label>
              <input type="number" step="0.01" min="0" name="monto" value={itemEditando.monto} onChange={handleEdicionChange} placeholder="Monto del pago" />
              <div className="modal-actions">
                <button type="button" className="btn" onClick={handleCerrarModales} style={{backgroundColor: '#6c757d'}}>Cancelar</button>
                <button type="submit" className="btn" style={{backgroundColor: '#5cb85c'}}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Proveedores;