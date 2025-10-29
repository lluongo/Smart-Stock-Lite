/**
 * Servicio de Distribución Automática de Stock
 * Algoritmo de Hamilton + Reglas de Negocio R1-R8
 * Usa 3 archivos: Stock, Participación, Prioridad
 */

import * as XLSX from 'xlsx';

// ============================================================================
// CAPA 1: ALGORITMO DE HAMILTON (Asignación Matemática)
// ============================================================================

/**
 * Algoritmo de Mayor Resto (Hamilton)
 * Distribuye unidades enteras según porcentajes sin dejar residuo
 *
 * Criterios de desempate:
 * 1. Mayor residuo
 * 2. Mayor participación
 * 3. Orden alfabético por sucursal
 */
export const algoritmoHamilton = (cantidad, participaciones) => {
  const sucursales = Object.keys(participaciones);

  // Paso 1: Calcular cuotas exactas
  const cuotas = {};
  const partesEnteras = {};
  const residuos = {};

  sucursales.forEach(suc => {
    const cuotaExacta = cantidad * (participaciones[suc] / 100);
    cuotas[suc] = cuotaExacta;
    partesEnteras[suc] = Math.floor(cuotaExacta);
    residuos[suc] = cuotaExacta - Math.floor(cuotaExacta);
  });

  // Paso 2: Calcular unidades faltantes
  const sumaEnteros = Object.values(partesEnteras).reduce((sum, val) => sum + val, 0);
  const faltantes = cantidad - sumaEnteros;

  // Paso 3: Ordenar por criterios de desempate
  const sucursalesOrdenadas = sucursales.sort((a, b) => {
    // 1. Mayor residuo
    if (Math.abs(residuos[b] - residuos[a]) > 0.0001) {
      return residuos[b] - residuos[a];
    }
    // 2. Mayor participación
    if (Math.abs(participaciones[b] - participaciones[a]) > 0.0001) {
      return participaciones[b] - participaciones[a];
    }
    // 3. Orden alfabético
    return a.localeCompare(b);
  });

  // Paso 4: Asignar unidades faltantes
  const distribucion = { ...partesEnteras };
  for (let i = 0; i < faltantes; i++) {
    distribucion[sucursalesOrdenadas[i]] += 1;
  }

  return {
    distribucion,
    cuotas,
    residuos
  };
};

// ============================================================================
// PARSERS: Leer los 3 archivos
// ============================================================================

/**
 * Parsear archivo de STOCK
 * Columnas: Coddep, Deposito, Color, NombreColor, Medida, Cantidad, TIPOLOGIA, ORIGEN, TEMPORADA
 */
export const parsearStock = (data) => {
  if (!data || data.length < 2) {
    throw new Error('Archivo de stock vacío o inválido');
  }

  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const productos = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 6) continue;

    // Buscar índices de columnas
    const idxCoddep = headers.findIndex(h => h.includes('coddep'));
    const idxDeposito = headers.findIndex(h => h.includes('deposito'));
    const idxColor = headers.findIndex(h => h === 'color');
    const idxNombreColor = headers.findIndex(h => h.includes('nombrecolor'));
    const idxMedida = headers.findIndex(h => h.includes('medida') || h.includes('talle'));
    const idxCantidad = headers.findIndex(h => h.includes('cantidad'));
    const idxTipologia = headers.findIndex(h => h.includes('tipologia'));
    const idxOrigen = headers.findIndex(h => h.includes('origen'));
    const idxTemporada = headers.findIndex(h => h.includes('temporada'));

    const coddep = idxCoddep >= 0 ? String(row[idxCoddep] || '').trim() : '';
    const deposito = idxDeposito >= 0 ? String(row[idxDeposito] || '').trim() : '';
    const color = idxColor >= 0 ? String(row[idxColor] || '').trim() : '';
    const nombreColor = idxNombreColor >= 0 ? String(row[idxNombreColor] || '').trim() : '';
    const medida = idxMedida >= 0 ? String(row[idxMedida] || '').trim() : '';
    const cantidad = idxCantidad >= 0 ? parseInt(row[idxCantidad]) : 0;
    const tipologia = idxTipologia >= 0 ? String(row[idxTipologia] || '').trim() : '';
    const origen = idxOrigen >= 0 ? String(row[idxOrigen] || '').trim() : '';
    const temporada = idxTemporada >= 0 ? String(row[idxTemporada] || '').trim() : '';

    if (tipologia && medida && cantidad > 0) {
      // SKU = TIPOLOGIA + Color + Medida
      const sku = `${tipologia}_${color}_${medida}`;

      productos.push({
        coddep,
        deposito,
        color,
        nombreColor,
        medida,
        cantidad,
        tipologia,
        origen,
        temporada,
        sku
      });
    }
  }

  if (productos.length === 0) {
    throw new Error('No se encontraron productos válidos en el archivo de stock');
  }

  return productos;
};

/**
 * Parsear archivo de PARTICIPACIÓN
 * Columnas: sucursal, participacion
 */
export const parsearParticipacion = (data) => {
  if (!data || data.length < 2) {
    throw new Error('Archivo de participación vacío o inválido');
  }

  const datosTemporales = [];
  let sumaRaw = 0;

  // Paso 1: Leer todos los valores primero
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const sucursal = String(row[0] || '').trim();
    const participacion = parseFloat(row[1]);

    if (sucursal && !isNaN(participacion) && participacion > 0) {
      datosTemporales.push({ sucursal, participacion });
      sumaRaw += participacion;
    }
  }

  if (datosTemporales.length === 0) {
    throw new Error('No se encontraron datos válidos de participación');
  }

  // Paso 2: Determinar si los valores están en formato decimal (0-1) o porcentaje (0-100)
  const enFormatoDecimal = sumaRaw < 10; // Si la suma es menor a 10, asumimos formato decimal
  const multiplicador = enFormatoDecimal ? 100 : 1;

  // Paso 3: Convertir todos los valores y calcular suma final
  const participaciones = {};
  let sumaTotal = 0;

  datosTemporales.forEach(({ sucursal, participacion }) => {
    const valorFinal = participacion * multiplicador;
    participaciones[sucursal] = valorFinal;
    sumaTotal += valorFinal;
  });

  // Paso 4: Validación ESTRICTA - Rechazar si no suma 100% (tolerancia ±0.5%)
  if (Math.abs(sumaTotal - 100) > 0.5) {
    throw new Error(
      `❌ ARCHIVO RECHAZADO: Los porcentajes deben sumar 100%.\n\n` +
      `Suma actual: ${sumaTotal.toFixed(2)}%\n` +
      `Diferencia: ${(sumaTotal - 100).toFixed(2)}%\n\n` +
      `Por favor ajusta los valores de participación para que sumen exactamente 100%.`
    );
  }

  return participaciones;
};

/**
 * Parsear archivo de PRIORIDAD
 * Columnas: prioridad, producto
 */
export const parsearPrioridad = (data) => {
  if (!data || data.length < 2) {
    return {}; // Prioridad es opcional
  }

  const prioridades = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const prioridad = parseInt(row[0]) || 999;
    const producto = String(row[1] || '').trim();

    if (producto) {
      prioridades[producto] = prioridad;
    }
  }

  return prioridades;
};

// ============================================================================
// CAPA 2: REGLAS DE NEGOCIO R1-R8
// ============================================================================

const trazabilidad = [];

/**
 * R1: Mantener curva entera
 * Agrupar por TIPOLOGIA + Color → evitar talles aislados
 */
const aplicarR1_MantenerCurva = (distribucionPorSKU, productos) => {
  const ajustes = [];

  // Agrupar por TIPOLOGIA + Color
  const curvas = {};
  productos.forEach(p => {
    const clave = `${p.tipologia}_${p.color}`;
    if (!curvas[clave]) {
      curvas[clave] = [];
    }
    curvas[clave].push(p);
  });

  // Analizar cada curva
  Object.entries(curvas).forEach(([clave, talles]) => {
    if (talles.length < 2) return; // No es curva si tiene solo 1 talle

    // Por cada sucursal, verificar si tiene curva completa
    const sucursales = Object.keys(distribucionPorSKU[talles[0].sku] || {});

    sucursales.forEach(suc => {
      const tallesEnSucursal = talles.filter(t => {
        const dist = distribucionPorSKU[t.sku] || {};
        return (dist[suc] || 0) > 0;
      });

      // Si tiene menos del 70% de los talles, es curva rota
      if (tallesEnSucursal.length > 0 && tallesEnSucursal.length < talles.length * 0.7) {
        // Registrar advertencia
        trazabilidad.push({
          regla: 'R1',
          sucursal: suc,
          producto: clave,
          motivo: 'Curva incompleta detectada',
          tallesEnSucursal: tallesEnSucursal.length,
          tallesTotal: talles.length,
          porcentaje: ((tallesEnSucursal.length / talles.length) * 100).toFixed(0) + '%'
        });
      }
    });
  });

  return ajustes;
};

/**
 * R2: Sobrantes según necesidad del local
 * Beneficiar quien completa curva
 */
const aplicarR2_SobrantesCompletarCurva = (distribucionPorSKU, productos) => {
  // Implementación futura: reasignar sobrantes a quien más cerca esté de completar curva
  return [];
};

/**
 * R3: Locales grandes NO sacan mercadería
 * (flag esFlagship si corresponde)
 */
const aplicarR3_LocalesGrandes = (distribucionPorSKU, sucursales) => {
  // Implementación futura: identificar flagship stores
  return [];
};

/**
 * R4: Minimizar movimientos inter-local
 * Pocas transferencias con muchas unidades
 */
const aplicarR4_MinimizarMovimientos = (distribucionPorSKU) => {
  // Ya aplicado en Hamilton (distribución directa)
  return [];
};

/**
 * R5: Limpieza de curvas rotas ya existentes
 */
const aplicarR5_LimpiezaCurvasRotas = (distribucionPorSKU, productos) => {
  // Implementación futura: consolidar talles aislados
  return [];
};

/**
 * R6: Interior se acomoda entre ellos
 * (region si está disponible, sino no aplicar)
 */
const aplicarR6_InteriorEntreEllos = (distribucionPorSKU) => {
  // Implementación futura: usar campo region si existe
  return [];
};

/**
 * R7: Categoría + prioridad
 * Usar para trazabilidad
 */
const aplicarR7_CategoriaPrioridad = (productos, prioridades) => {
  productos.forEach(p => {
    const prioridad = prioridades[p.tipologia] || 999;

    trazabilidad.push({
      regla: 'R7',
      sku: p.sku,
      tipologia: p.tipologia,
      prioridad: prioridad,
      temporada: p.temporada,
      motivo: 'Registro de categoría y prioridad'
    });
  });

  return [];
};

/**
 * R8: UTA se acumula
 * Registrar log (a futuro IA)
 */
const aplicarR8_UTAAcumulada = (distribucionPorSKU, participaciones) => {
  const totalUnidades = {};

  Object.entries(distribucionPorSKU).forEach(([sku, dist]) => {
    Object.entries(dist).forEach(([suc, unidades]) => {
      if (!totalUnidades[suc]) {
        totalUnidades[suc] = 0;
      }
      totalUnidades[suc] += unidades;
    });
  });

  Object.entries(totalUnidades).forEach(([suc, total]) => {
    trazabilidad.push({
      regla: 'R8',
      sucursal: suc,
      totalUnidades: total,
      participacion: participaciones[suc],
      motivo: 'Acumulación de UTA para análisis futuro'
    });
  });

  return [];
};

// ============================================================================
// MOTOR PRINCIPAL: Distribución Automática
// ============================================================================

/**
 * Generar distribución automática usando 3 archivos
 * @param {Array} stockData - Datos del archivo de stock
 * @param {Array} participacionData - Datos del archivo de participación
 * @param {Array} prioridadData - Datos del archivo de prioridad
 */
export const generarDistribucionAutomatica = (stockData, participacionData, prioridadData) => {
  // Limpiar trazabilidad anterior
  trazabilidad.length = 0;

  // Paso 1: Parsear archivos
  const productos = parsearStock(stockData);
  const participaciones = parsearParticipacion(participacionData);
  const prioridades = parsearPrioridad(prioridadData || []);

  const sucursales = Object.keys(participaciones);

  // Paso 2: CAPA 1 - Aplicar Hamilton a cada SKU
  const distribucionPorSKU = {};
  const distribucionDetallada = [];

  productos.forEach(producto => {
    const { sku, cantidad, tipologia, color, medida, nombreColor, origen, temporada } = producto;

    // Aplicar Hamilton
    const resultado = algoritmoHamilton(cantidad, participaciones);
    distribucionPorSKU[sku] = resultado.distribucion;

    // Registrar detalle
    Object.entries(resultado.distribucion).forEach(([sucursal, unidades]) => {
      if (unidades > 0) {
        distribucionDetallada.push({
          sku,
          tipologia,
          color,
          nombreColor,
          medida,
          sucursal,
          unidades,
          cuotaExacta: resultado.cuotas[sucursal].toFixed(2),
          residuo: resultado.residuos[sucursal].toFixed(4),
          origen,
          temporada,
          prioridad: prioridades[tipologia] || 999
        });
      }
    });
  });

  // Paso 3: CAPA 2 - Aplicar Reglas de Negocio (en orden)
  aplicarR1_MantenerCurva(distribucionPorSKU, productos);
  aplicarR2_SobrantesCompletarCurva(distribucionPorSKU, productos);
  aplicarR3_LocalesGrandes(distribucionPorSKU, sucursales);
  aplicarR4_MinimizarMovimientos(distribucionPorSKU);
  aplicarR5_LimpiezaCurvasRotas(distribucionPorSKU, productos);
  aplicarR6_InteriorEntreEllos(distribucionPorSKU);
  aplicarR7_CategoriaPrioridad(productos, prioridades);
  aplicarR8_UTAAcumulada(distribucionPorSKU, participaciones);

  // Paso 4: Generar resumen por sucursal
  const resumenSucursales = {};
  sucursales.forEach(suc => {
    resumenSucursales[suc] = {
      totalUnidades: 0,
      participacionEsperada: participaciones[suc],
      participacionReal: 0
    };
  });

  let totalUnidadesDistribuidas = 0;
  Object.values(distribucionPorSKU).forEach(dist => {
    Object.entries(dist).forEach(([suc, unidades]) => {
      resumenSucursales[suc].totalUnidades += unidades;
      totalUnidadesDistribuidas += unidades;
    });
  });

  // Calcular participación real
  Object.keys(resumenSucursales).forEach(suc => {
    resumenSucursales[suc].participacionReal =
      ((resumenSucursales[suc].totalUnidades / totalUnidadesDistribuidas) * 100).toFixed(2);
  });

  // Paso 5: Validación Check Sum
  const totalOriginal = productos.reduce((sum, p) => sum + p.cantidad, 0);
  const checkSum = {
    totalOriginal,
    totalDistribuido: totalUnidadesDistribuidas,
    diferencia: totalOriginal - totalUnidadesDistribuidas,
    esValido: totalOriginal === totalUnidadesDistribuidas
  };

  // Paso 6: Generar transferencias (para distribución inicial no hay transferencias inter-local)
  const transferencias = [];
  distribucionDetallada.forEach(item => {
    if (item.unidades > 0) {
      transferencias.push({
        sku: item.sku,
        talle: item.medida,
        color: item.nombreColor || item.color,
        origen: 'Depósito Central',
        destino: item.sucursal,
        unidades: item.unidades,
        motivo: 'Distribución inicial Hamilton',
        prioridad: item.prioridad,
        temporada: item.temporada
      });
    }
  });

  return {
    distribucionDetallada,
    resumenSucursales,
    transferencias,
    trazabilidad: [...trazabilidad],
    checkSum,
    productos,
    participaciones,
    sucursales
  };
};

// ============================================================================
// EXPORTACIÓN A EXCEL (4 hojas)
// ============================================================================

/**
 * Exportar resultado completo a Excel con 4 hojas
 */
export const exportarDistribucionCompleta = (resultado) => {
  const wb = XLSX.utils.book_new();

  // HOJA 1: Distribución Final
  const hoja1Data = [
    ['SKU', 'TIPOLOGIA', 'Color', 'Medida', 'Sucursal', 'Unidades', 'Cuota Exacta', 'Residuo']
  ];

  resultado.distribucionDetallada.forEach(item => {
    hoja1Data.push([
      item.sku,
      item.tipologia,
      item.nombreColor || item.color,
      item.medida,
      item.sucursal,
      item.unidades,
      item.cuotaExacta,
      item.residuo
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(hoja1Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'Distribución Final');

  // HOJA 2: Transferencias
  const hoja2Data = [
    ['SKU', 'Talle', 'Color', 'Origen', 'Destino', 'Unidades', 'Motivo', 'Prioridad', 'Temporada']
  ];

  resultado.transferencias.forEach(t => {
    hoja2Data.push([
      t.sku,
      t.talle,
      t.color,
      t.origen,
      t.destino,
      t.unidades,
      t.motivo,
      t.prioridad,
      t.temporada
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(hoja2Data);
  XLSX.utils.book_append_sheet(wb, ws2, 'Transferencias');

  // HOJA 3: Resumen por Sucursal
  const hoja3Data = [
    ['Sucursal', 'Total Unidades', '% Esperado', '% Real', 'Desviación']
  ];

  Object.entries(resultado.resumenSucursales).forEach(([suc, datos]) => {
    const desviacion = (parseFloat(datos.participacionReal) - datos.participacionEsperada).toFixed(2);
    hoja3Data.push([
      suc,
      datos.totalUnidades,
      datos.participacionEsperada.toFixed(2) + '%',
      datos.participacionReal + '%',
      desviacion + '%'
    ]);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(hoja3Data);
  XLSX.utils.book_append_sheet(wb, ws3, 'Resumen Sucursales');

  // HOJA 4: Log de Trazabilidad
  const hoja4Data = [
    ['Regla', 'SKU', 'Sucursal', 'Producto', 'Motivo', 'Prioridad', 'Temporada', 'Detalles']
  ];

  resultado.trazabilidad.forEach(log => {
    hoja4Data.push([
      log.regla,
      log.sku || '',
      log.sucursal || '',
      log.producto || log.tipologia || '',
      log.motivo,
      log.prioridad || '',
      log.temporada || '',
      JSON.stringify(log).substring(0, 100)
    ]);
  });

  const ws4 = XLSX.utils.aoa_to_sheet(hoja4Data);
  XLSX.utils.book_append_sheet(wb, ws4, 'Log Trazabilidad');

  // Generar archivo
  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Distribucion_Automatica_${fecha}.xlsx`);
};

/**
 * Exportar solo distribución detallada a CSV
 */
export const exportarDistribucionCSV = (distribucionDetallada) => {
  const headers = ['sku', 'tipologia', 'color', 'medida', 'sucursal', 'unidades'];
  const rows = distribucionDetallada.map(item => [
    item.sku,
    item.tipologia,
    item.color,
    item.medida,
    item.sucursal,
    item.unidades
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
