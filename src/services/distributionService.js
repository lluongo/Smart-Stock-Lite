/**
 * Servicio de Distribución Automática de Stock
 * Algoritmo de Mayor Resto (Hamilton) para distribución por porcentajes
 */

/**
 * Algoritmo de Mayor Resto (Hamilton)
 * Distribuye unidades enteras según porcentajes sin dejar residuo
 *
 * @param {number} total - Total de unidades a distribuir
 * @param {Object} porcentajes - Objeto con {tienda: porcentaje}
 * @returns {Object} - Objeto con {tienda: unidades_asignadas}
 */
export const algoritmoMayorResto = (total, porcentajes) => {
  const tiendas = Object.keys(porcentajes);

  // Paso 1: Calcular cuota exacta para cada tienda
  const cuotas = {};
  const partesEnteras = {};
  const residuos = {};

  tiendas.forEach(tienda => {
    const porcentaje = porcentajes[tienda];
    const cuotaExacta = total * (porcentaje / 100);
    cuotas[tienda] = cuotaExacta;
    partesEnteras[tienda] = Math.floor(cuotaExacta);
    residuos[tienda] = cuotaExacta - Math.floor(cuotaExacta);
  });

  // Paso 2: Calcular cuántas unidades faltan asignar
  const sumaEnteros = Object.values(partesEnteras).reduce((sum, val) => sum + val, 0);
  const unidadesFaltantes = total - sumaEnteros;

  // Paso 3: Ordenar tiendas por mayor residuo
  const tiendasOrdenadas = tiendas.sort((a, b) => residuos[b] - residuos[a]);

  // Paso 4: Asignar unidades faltantes a las tiendas con mayor residuo
  const distribucion = { ...partesEnteras };
  for (let i = 0; i < unidadesFaltantes; i++) {
    const tienda = tiendasOrdenadas[i];
    distribucion[tienda] += 1;
  }

  return {
    distribucion,
    cuotas,
    residuos,
    ajustes: unidadesFaltantes
  };
};

/**
 * Parsea archivo de distribución con estructura:
 * - Col A: talle
 * - Col B: color
 * - Col C: cantidad_total
 * - Fila 6: porcentajes por tienda (columnas D en adelante)
 *
 * @param {Array} data - Datos parseados del CSV/Excel
 * @returns {Object} - {productos, porcentajes, tiendas}
 */
export const parsearArchivoDistribucion = (data) => {
  if (!data || data.length < 7) {
    throw new Error('El archivo debe tener al menos 7 filas (encabezados + fila 6 de porcentajes + productos)');
  }

  // Fila 6 (índice 5 en array 0-indexed) contiene los porcentajes
  const filaPorcentajes = data[5];

  // Extraer nombres de tiendas (desde columna D en adelante, índice 3)
  const tiendas = [];
  const porcentajes = {};

  for (let i = 3; i < filaPorcentajes.length; i++) {
    const header = data[4] ? data[4][i] : null; // Fila 5 puede tener nombres de tiendas
    const porcentaje = parseFloat(filaPorcentajes[i]);

    if (!isNaN(porcentaje) && porcentaje > 0) {
      const nombreTienda = header || `Tienda_${String.fromCharCode(65 + i - 3)}`; // A, B, C...
      tiendas.push(nombreTienda);
      porcentajes[nombreTienda] = porcentaje;
    }
  }

  // Validar que los porcentajes sumen 100%
  const sumaPorcentajes = Object.values(porcentajes).reduce((sum, val) => sum + val, 0);
  if (Math.abs(sumaPorcentajes - 100) > 0.01) {
    throw new Error(`Los porcentajes deben sumar 100%. Suma actual: ${sumaPorcentajes.toFixed(2)}%`);
  }

  // Parsear productos (desde fila 7 en adelante, índice 6)
  const productos = [];

  for (let i = 6; i < data.length; i++) {
    const fila = data[i];

    if (!fila || fila.length < 3) continue;

    const talle = String(fila[0] || '').trim();
    const color = String(fila[1] || '').trim();
    const cantidadTotal = parseInt(fila[2]);

    if (talle && color && !isNaN(cantidadTotal) && cantidadTotal > 0) {
      productos.push({
        talle,
        color,
        cantidadTotal
      });
    }
  }

  if (productos.length === 0) {
    throw new Error('No se encontraron productos válidos en el archivo');
  }

  return {
    productos,
    porcentajes,
    tiendas
  };
};

/**
 * Genera la distribución completa para todos los productos
 *
 * @param {Array} productos - Array de {talle, color, cantidadTotal}
 * @param {Object} porcentajes - {tienda: porcentaje}
 * @returns {Object} - {distribucionDetallada, resumenTiendas, validacion, justificacion}
 */
export const generarDistribucionAutomatica = (productos, porcentajes) => {
  const distribucionDetallada = [];
  const resumenTiendas = {};
  const ajustesPorProducto = [];
  let totalUnidadesDistribuidas = 0;
  let totalUnidadesOriginales = 0;

  // Inicializar resumen de tiendas
  Object.keys(porcentajes).forEach(tienda => {
    resumenTiendas[tienda] = {
      unidadesAsignadas: 0,
      porcentajeEsperado: porcentajes[tienda],
      porcentajeReal: 0
    };
  });

  // Procesar cada producto
  productos.forEach(producto => {
    const { talle, color, cantidadTotal } = producto;
    totalUnidadesOriginales += cantidadTotal;

    // Aplicar algoritmo de Mayor Resto
    const resultado = algoritmoMayorResto(cantidadTotal, porcentajes);

    // Agregar a distribución detallada
    Object.entries(resultado.distribucion).forEach(([tienda, unidades]) => {
      if (unidades > 0) {
        distribucionDetallada.push({
          talle,
          color,
          tienda,
          unidadesAsignadas: unidades,
          cuotaExacta: resultado.cuotas[tienda].toFixed(2),
          residuo: resultado.residuos[tienda].toFixed(4)
        });

        // Acumular en resumen de tiendas
        resumenTiendas[tienda].unidadesAsignadas += unidades;
        totalUnidadesDistribuidas += unidades;
      }
    });

    // Registrar ajustes si hubo
    if (resultado.ajustes > 0) {
      ajustesPorProducto.push({
        talle,
        color,
        cantidadTotal,
        ajustes: resultado.ajustes
      });
    }
  });

  // Calcular porcentajes reales
  Object.keys(resumenTiendas).forEach(tienda => {
    resumenTiendas[tienda].porcentajeReal =
      ((resumenTiendas[tienda].unidadesAsignadas / totalUnidadesDistribuidas) * 100).toFixed(2);
  });

  // Validación
  const validacion = {
    esValido: totalUnidadesDistribuidas === totalUnidadesOriginales,
    totalOriginal: totalUnidadesOriginales,
    totalDistribuido: totalUnidadesDistribuidas,
    diferencia: totalUnidadesOriginales - totalUnidadesDistribuidas,
    mensaje: totalUnidadesDistribuidas === totalUnidadesOriginales
      ? '✅ Validación correcta: Todo el stock fue distribuido'
      : `❌ ERROR: Diferencia de ${Math.abs(totalUnidadesOriginales - totalUnidadesDistribuidas)} unidades`
  };

  // Justificación
  const justificacion = {
    porcentajesUsados: porcentajes,
    totalProductos: productos.length,
    totalAjustes: ajustesPorProducto.length,
    explicacion: ajustesPorProducto.length > 0
      ? `Se realizaron ajustes por redondeo en ${ajustesPorProducto.length} producto(s) usando el algoritmo de Mayor Resto (Hamilton).`
      : 'No se requirieron ajustes por redondeo. Todas las distribuciones fueron exactas.',
    detalleAjustes: ajustesPorProducto
  };

  return {
    distribucionDetallada,
    resumenTiendas,
    validacion,
    justificacion
  };
};

/**
 * Exporta la distribución a formato CSV
 */
export const exportarDistribucionCSV = (distribucionDetallada) => {
  const headers = ['talle', 'color', 'tienda', 'unidades_asignadas'];
  const rows = distribucionDetallada.map(item => [
    item.talle,
    item.color,
    item.tienda,
    item.unidadesAsignadas
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `distribucion_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
