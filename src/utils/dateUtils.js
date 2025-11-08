// src/utils/dateUtils.js

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD (zona horaria local)
 * @returns {string} Fecha en formato "2025-01-05"
 */
export const obtenerFechaLocal = () => {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
};

/**
 * Formatea una fecha ISO a formato DD/MM/YYYY
 * @param {string} fechaString - Fecha en formato ISO (ej: "2025-01-05T00:00:00Z")
 * @returns {string} Fecha en formato "05/01/2025"
 */
export const formatearFechaLocal = (fechaString) => {
  if (!fechaString) return '';
  const [año, mes, dia] = fechaString.split('T')[0].split('-');
  return `${dia}/${mes}/${año}`;
};

/**
 * Suma días a una fecha
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD
 * @param {number} dias - Cantidad de días a sumar
 * @returns {string} Nueva fecha en formato YYYY-MM-DD
 */
export const sumarDias = (fechaString, dias) => {
  try {
    const [año, mes, dia] = fechaString.split('-');
    const fecha = new Date(año, mes - 1, dia);
    fecha.setDate(fecha.getDate() + dias);
    const nuevoAño = fecha.getFullYear();
    const nuevoMes = String(fecha.getMonth() + 1).padStart(2, '0');
    const nuevoDia = String(fecha.getDate()).padStart(2, '0');
    return `${nuevoAño}-${nuevoMes}-${nuevoDia}`;
  } catch (e) {
    return ''; 
  }
};

/**
 * Obtiene el nombre del día de la semana
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD o ISO
 * @returns {string} Día de la semana abreviado (ej: "Lun")
 */
export const obtenerDiaSemana = (fechaString) => {
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const [año, mes, dia] = fechaString.split('T')[0].split('-');
  const fecha = new Date(año, mes - 1, dia);
  return dias[fecha.getDay()];
};

/**
 * Obtiene el mes/año actual en formato YYYY-MM
 * @returns {string} Mes actual en formato "2025-01"
 */
export const obtenerMesActual = () => {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  return `${año}-${mes}`;
};

/**
 * Formatea un mes en formato YYYY-MM a texto legible
 * @param {string} mesString - Mes en formato "2025-01"
 * @returns {string} Mes formateado (ej: "Enero 2025")
 */
export const formatearMesTexto = (mesString) => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const [año, mes] = mesString.split('-');
  return `${meses[parseInt(mes) - 1]} ${año}`;
};