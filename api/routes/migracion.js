// routes/migracion.js

const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
const Deuda = require('../models/Deuda');
const Proveedor = require('../models/Proveedor');
const Factura = require('../models/Factura');
const Pago = require('../models/Pago');
const { Mes, Venta, GastoFijo } = require('../models/Verduleria');

// POST - Migrar todos los datos
router.post('/', async (req, res) => {
  try {
    const { clientes, deudas, proveedores, facturas, pagos, meses, ventas, gastos } = req.body;

    const resultado = {
      clientesMigrados: 0,
      deudasMigradas: 0,
      proveedoresMigrados: 0,
      facturasMigradas: 0,
      pagosMigrados: 0,
      mesesMigrados: 0,
      ventasMigradas: 0,
      gastosMigrados: 0,
      errores: [],
    };

    // Mapeo de IDs antiguos a nuevos
    const clientesMap = new Map();
    const proveedoresMap = new Map();

    // 1. MIGRAR CLIENTES
    if (clientes && clientes.length > 0) {
      for (const c of clientes) {
        try {
          const nuevoCliente = await Cliente.create({
            nombre: c.nombre,
          });
          clientesMap.set(c.id, nuevoCliente._id);
          resultado.clientesMigrados++;
        } catch (error) {
          resultado.errores.push(`Error en cliente ${c.nombre}: ${error.message}`);
        }
      }
    }

    // 2. MIGRAR DEUDAS
    if (deudas && deudas.length > 0) {
      for (const d of deudas) {
        try {
          const nuevoClienteId = clientesMap.get(d.clienteId);
          if (nuevoClienteId) {
            await Deuda.create({
              clienteId: nuevoClienteId,
              fecha: new Date(d.fecha),
              monto: d.monto,
            });
            resultado.deudasMigradas++;
          }
        } catch (error) {
          resultado.errores.push(`Error en deuda: ${error.message}`);
        }
      }
    }

    // 3. MIGRAR PROVEEDORES
    if (proveedores && proveedores.length > 0) {
      for (const p of proveedores) {
        try {
          const nuevoProveedor = await Proveedor.create({
            nombre: p.nombre,
          });
          proveedoresMap.set(p.id, nuevoProveedor._id);
          resultado.proveedoresMigrados++;
        } catch (error) {
          resultado.errores.push(`Error en proveedor ${p.nombre}: ${error.message}`);
        }
      }
    }

    // 4. MIGRAR FACTURAS
    if (facturas && facturas.length > 0) {
      for (const f of facturas) {
        try {
          const nuevoProveedorId = proveedoresMap.get(f.proveedorId);
          if (nuevoProveedorId) {
            await Factura.create({
              proveedorId: nuevoProveedorId,
              fecha: new Date(f.fecha),
              fechaVencimiento: f.fechaVencimiento ? new Date(f.fechaVencimiento) : null,
              numero: f.numero,
              monto: f.monto,
              rechazo: f.rechazo || 0,
            });
            resultado.facturasMigradas++;
          }
        } catch (error) {
          resultado.errores.push(`Error en factura ${f.numero}: ${error.message}`);
        }
      }
    }

    // 5. MIGRAR PAGOS
    if (pagos && pagos.length > 0) {
      for (const p of pagos) {
        try {
          const nuevoProveedorId = proveedoresMap.get(p.proveedorId);
          if (nuevoProveedorId) {
            await Pago.create({
              proveedorId: nuevoProveedorId,
              fecha: new Date(p.fecha),
              monto: p.monto,
            });
            resultado.pagosMigrados++;
          }
        } catch (error) {
          resultado.errores.push(`Error en pago: ${error.message}`);
        }
      }
    }

    // 6. MIGRAR MESES VERDULERÍA
    if (meses && meses.length > 0) {
      for (const m of meses) {
        try {
          await Mes.create({
            mesId: m.id,
            nombre: m.nombre,
          });
          resultado.mesesMigrados++;
        } catch (error) {
          resultado.errores.push(`Error en mes ${m.nombre}: ${error.message}`);
        }
      }
    }

    // 7. MIGRAR VENTAS VERDULERÍA
    if (ventas && ventas.length > 0) {
      for (const v of ventas) {
        try {
          await Venta.create({
            mesId: v.mesId,
            fecha: new Date(v.fecha),
            diaSemana: v.diaSemana,
            costoMercaderia: v.costoMercaderia,
            gastos: v.gastos,
            venta: v.venta,
            margen: v.margen,
          });
          resultado.ventasMigradas++;
        } catch (error) {
          resultado.errores.push(`Error en venta: ${error.message}`);
        }
      }
    }

    // 8. MIGRAR GASTOS FIJOS VERDULERÍA
    if (gastos && gastos.length > 0) {
      for (const g of gastos) {
        try {
          await GastoFijo.create({
            mesId: g.mesId,
            concepto: g.concepto,
            total: g.total || 0,
            porcentaje: g.porcentaje || 0,
            verduleria: g.verduleria || 0,
          });
          resultado.gastosMigrados++;
        } catch (error) {
          resultado.errores.push(`Error en gasto ${g.concepto}: ${error.message}`);
        }
      }
    }

    res.status(201).json({
      mensaje: '✅ Migración completada',
      resultado,
    });

  } catch (error) {
    res.status(500).json({ mensaje: `❌ Error en la migración: ${error.message}` });
  }
});

// DELETE - Borrar toda la base de datos (útil para probar la migración varias veces)
router.delete('/limpiar', async (req, res) => {
  try {
    await Cliente.deleteMany({});
    await Deuda.deleteMany({});
    await Proveedor.deleteMany({});
    await Factura.deleteMany({});
    await Pago.deleteMany({});
    await Mes.deleteMany({});
    await Venta.deleteMany({});
    await GastoFijo.deleteMany({});

    res.json({ mensaje: '🗑️ Base de datos limpiada completamente' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

module.exports = router;