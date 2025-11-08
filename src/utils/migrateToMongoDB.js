// src/utils/migrateToMongoDB.js

const API_URL = 'https://wrong-devonna-dualibesoft-528f87f1.koyeb.app/api';

export const migrarLocalStorageAMongoDB = async () => {
  try {
    console.log('🚀 Iniciando migración...');

    // Recolectar todos los datos de localStorage
    const datos = {
      clientes: JSON.parse(localStorage.getItem('clientes') || '[]'),
      deudas: JSON.parse(localStorage.getItem('deudas') || '[]'),
      proveedores: JSON.parse(localStorage.getItem('proveedores') || '[]'),
      facturas: JSON.parse(localStorage.getItem('facturasProveedores') || '[]'),
      pagos: JSON.parse(localStorage.getItem('pagosProveedores') || '[]'),
      meses: JSON.parse(localStorage.getItem('verduleriaMeses') || '[]'),
      ventas: JSON.parse(localStorage.getItem('verduleriaVentas') || '[]'),
      gastos: JSON.parse(localStorage.getItem('verduleriaGastosFijos') || '[]'),
    };

    console.log('📦 Datos a migrar:', {
      clientes: datos.clientes.length,
      deudas: datos.deudas.length,
      proveedores: datos.proveedores.length,
      facturas: datos.facturas.length,
      pagos: datos.pagos.length,
      meses: datos.meses.length,
      ventas: datos.ventas.length,
      gastos: datos.gastos.length,
    });

    // Enviar datos al backend
    const response = await fetch(`${API_URL}/migracion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const resultado = await response.json();

    console.log('✅ Resultado de la migración:', resultado);

    const resumen = `
✅ MIGRACIÓN COMPLETADA

📊 Resultados:
• ${resultado.resultado.clientesMigrados} clientes migrados
• ${resultado.resultado.deudasMigradas} deudas migradas
• ${resultado.resultado.proveedoresMigrados} proveedores migrados
• ${resultado.resultado.facturasMigradas} facturas migradas
• ${resultado.resultado.pagosMigrados} pagos migrados
• ${resultado.resultado.mesesMigrados} meses migrados
• ${resultado.resultado.ventasMigradas} ventas migradas
• ${resultado.resultado.gastosMigrados} gastos fijos migrados

${resultado.resultado.errores.length > 0 ? `\n⚠️ Errores encontrados:\n${resultado.resultado.errores.join('\n')}` : ''}
    `;

    alert(resumen);
    return true;

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    alert(`❌ Error: ${error.message}\n\n¿Está el servidor backend corriendo en http://localhost:5000?`);
    return false;
  }
};