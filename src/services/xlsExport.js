/**
 * Utilidad para exportar datos a formato XLS
 * Usa la librería xlsx (SheetJS)
 */

import * as XLSX from 'xlsx';

/**
 * Exporta movimientos inter-locales a formato XLS
 * Según especificaciones del documento:
 * Campos: SKU, Talle, Color, Origen, Destino, Cantidad, Estado
 */
export const exportarMovimientosXLS = (movimientos, nombreArchivo = null) => {
  if (!movimientos || movimientos.length === 0) {
    console.error('No hay movimientos para exportar');
    return;
  }

  // Preparar datos para el formato Excel
  const datosFormateados = movimientos.map(m => ({
    SKU: m.sku,
    Talle: m.talle,
    Color: m.color,
    Origen: m.origen,
    Destino: m.destino,
    Cantidad: m.cantidad,
    Motivo: m.motivo,
    Prioridad: m.prioridad,
    Estado: m.estado
  }));

  // Crear workbook y worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosFormateados);

  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 15 }, // SKU
    { wch: 10 }, // Talle
    { wch: 15 }, // Color
    { wch: 20 }, // Origen
    { wch: 20 }, // Destino
    { wch: 10 }, // Cantidad
    { wch: 25 }, // Motivo
    { wch: 12 }, // Prioridad
    { wch: 12 }  // Estado
  ];
  ws['!cols'] = columnWidths;

  // Agregar worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Distribución Inter-local');

  // Crear hoja de resumen
  const totalMovimientos = movimientos.length;
  const totalUnidades = movimientos.reduce((sum, m) => sum + m.cantidad, 0);
  const porMotivo = movimientos.reduce((acc, m) => {
    acc[m.motivo] = (acc[m.motivo] || 0) + 1;
    return acc;
  }, {});

  const resumenData = [
    ['RESUMEN DE DISTRIBUCIÓN'],
    [''],
    ['Total de movimientos', totalMovimientos],
    ['Total de unidades', totalUnidades],
    [''],
    ['MOVIMIENTOS POR MOTIVO'],
    ...Object.entries(porMotivo).map(([motivo, cantidad]) => [motivo, cantidad]),
    [''],
    ['Generado el', new Date().toLocaleString('es-AR')]
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // Generar nombre de archivo
  const fecha = new Date().toISOString().split('T')[0];
  const nombre = nombreArchivo || `distribucion_interlocal_${fecha}.xlsx`;

  // Descargar archivo
  XLSX.writeFile(wb, nombre);
};

/**
 * Exporta análisis de curvas a formato XLS
 */
export const exportarAnalisisCurvasXLS = (analisisCurvas, nombreArchivo = null) => {
  if (!analisisCurvas || Object.keys(analisisCurvas).length === 0) {
    console.error('No hay análisis de curvas para exportar');
    return;
  }

  const datosFormateados = [];

  Object.entries(analisisCurvas).forEach(([productoKey, producto]) => {
    Object.entries(producto.locales).forEach(([local, analisis]) => {
      datosFormateados.push({
        SKU: producto.sku,
        Color: producto.color,
        Local: local,
        'Curva Completa': analisis.completa ? 'SÍ' : 'NO',
        'Talles Disponibles': analisis.tallesDisponibles,
        'Total Talles': analisis.totalTalles,
        'Porcentaje': `${(analisis.porcentaje * 100).toFixed(1)}%`,
        'Stock Total': analisis.totalStock,
        'Talles Faltantes': analisis.talleFaltantes?.join(', ') || 'Ninguno'
      });
    });
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosFormateados);

  ws['!cols'] = [
    { wch: 15 }, // SKU
    { wch: 15 }, // Color
    { wch: 20 }, // Local
    { wch: 15 }, // Curva Completa
    { wch: 18 }, // Talles Disponibles
    { wch: 15 }, // Total Talles
    { wch: 12 }, // Porcentaje
    { wch: 12 }, // Stock Total
    { wch: 30 }  // Talles Faltantes
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Análisis de Curvas');

  const fecha = new Date().toISOString().split('T')[0];
  const nombre = nombreArchivo || `analisis_curvas_${fecha}.xlsx`;

  XLSX.writeFile(wb, nombre);
};

/**
 * Exporta dashboard completo con múltiples hojas
 */
export const exportarDashboardCompletoXLS = (movimientos, analisisCurvas, estadisticas) => {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Movimientos
  if (movimientos && movimientos.length > 0) {
    const datosMovimientos = movimientos.map(m => ({
      SKU: m.sku,
      Talle: m.talle,
      Color: m.color,
      Origen: m.origen,
      Destino: m.destino,
      Cantidad: m.cantidad,
      Motivo: m.motivo,
      Prioridad: m.prioridad,
      Estado: m.estado
    }));

    const wsMovimientos = XLSX.utils.json_to_sheet(datosMovimientos);
    wsMovimientos['!cols'] = [
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 20 },
      { wch: 20 }, { wch: 10 }, { wch: 25 }, { wch: 12 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, wsMovimientos, 'Movimientos');
  }

  // Hoja 2: Análisis de Curvas
  if (analisisCurvas && Object.keys(analisisCurvas).length > 0) {
    const datosCurvas = [];
    Object.entries(analisisCurvas).forEach(([productoKey, producto]) => {
      Object.entries(producto.locales).forEach(([local, analisis]) => {
        datosCurvas.push({
          SKU: producto.sku,
          Color: producto.color,
          Local: local,
          'Curva Completa': analisis.completa ? 'SÍ' : 'NO',
          'Talles Disponibles': analisis.tallesDisponibles,
          'Total Talles': analisis.totalTalles,
          'Porcentaje': `${(analisis.porcentaje * 100).toFixed(1)}%`,
          'Stock Total': analisis.totalStock
        });
      });
    });

    const wsCurvas = XLSX.utils.json_to_sheet(datosCurvas);
    wsCurvas['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
      { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, wsCurvas, 'Análisis de Curvas');
  }

  // Hoja 3: Estadísticas
  if (estadisticas) {
    const datosEstadisticas = [
      ['ESTADÍSTICAS DE DISTRIBUCIÓN'],
      [''],
      ['Métrica', 'Valor'],
      ['Total de movimientos', estadisticas.totalMovimientos],
      ['Unidades totales', estadisticas.unidadesTotales],
      ['Total de productos', estadisticas.totalProductos],
      ['Curvas completas (antes)', estadisticas.curvasCompletasAntes],
      ['Curvas rotas (antes)', estadisticas.curvasRotasAntes],
      ['Eficiencia estimada', `${estadisticas.eficienciaEstimada}%`],
      [''],
      ['MOVIMIENTOS POR MOTIVO'],
      ...Object.entries(estadisticas.porMotivo || {}).map(([motivo, cantidad]) => [motivo, cantidad]),
      [''],
      ['MOVIMIENTOS POR PRIORIDAD'],
      ...Object.entries(estadisticas.porPrioridad || {}).map(([prioridad, cantidad]) => [prioridad, cantidad]),
      [''],
      ['Generado el', new Date().toLocaleString('es-AR')]
    ];

    const wsEstadisticas = XLSX.utils.aoa_to_sheet(datosEstadisticas);
    wsEstadisticas['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsEstadisticas, 'Estadísticas');
  }

  const fecha = new Date().toISOString().split('T')[0];
  const nombre = `dashboard_distribucion_${fecha}.xlsx`;

  XLSX.writeFile(wb, nombre);
};
