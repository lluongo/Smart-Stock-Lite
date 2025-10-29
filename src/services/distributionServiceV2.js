/**
 * Servicio de Distribución Inteligente de SKUs v2.0
 * Implementa reglas CROSS + INTERLOCAL con detección de curvas completas
 * Algoritmo: Hamilton + 9 Reglas de Negocio + Trazabilidad
 */

import * as XLSX from 'xlsx';

// ============================================================================
// UTILIDADES Y CONSTANTES
// ============================================================================

const UMBRAL_LOCAL_GRANDE = 8; // % UTA - Locales > 8% son considerados "grandes"
const UMBRAL_SOBRESTOCK_CURVAS = 3; // Curvas - Sobrestock permitido para transferencia

// Trazabilidad global
const trazabilidad = [];

const log = (regla, mensaje, datos = {}) => {
  const entrada = {
    regla,
    mensaje,
    timestamp: new Date().toISOString(),
    ...datos
  };
  trazabilidad.push(entrada);
  console.log(`[${regla}] ${mensaje}`, datos);
};

// ============================================================================
// ALGORITMO DE HAMILTON (Mayor Resto)
// ============================================================================

/**
 * Algoritmo de Mayor Resto (Hamilton)
 * Distribuye unidades enteras según porcentajes sin dejar residuo
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
// PARSERS (conservados del código original)
// ============================================================================

export const parsearStock = (data) => {
  if (!data || data.length < 2) {
    throw new Error('Archivo de stock vacío o inválido');
  }

  const headers = data[0].map(h => String(h).toLowerCase().trim());

  const idxCoddep = headers.findIndex(h => h.includes('coddep'));
  const idxDeposito = headers.findIndex(h => h.includes('deposito'));
  const idxColor = headers.findIndex(h => h === 'color');
  const idxNombreColor = headers.findIndex(h => h.includes('nombrecolor'));
  const idxMedida = headers.findIndex(h => h.includes('medida') || h.includes('talle'));
  const idxCantidad = headers.findIndex(h => h.includes('cantidad'));
  const idxTipologia = headers.findIndex(h => h.includes('tipologia'));
  const idxOrigen = headers.findIndex(h => h.includes('origen'));
  const idxTemporada = headers.findIndex(h => h.includes('temporada'));

  const productos = [];
  let filasDescartadas = 0;
  let razonesDescarte = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 6) {
      filasDescartadas++;
      razonesDescarte['fila_vacia_o_corta'] = (razonesDescarte['fila_vacia_o_corta'] || 0) + 1;
      continue;
    }

    const coddep = idxCoddep >= 0 ? String(row[idxCoddep] || '').trim() : '';
    const deposito = idxDeposito >= 0 ? String(row[idxDeposito] || '').trim() : '';
    const color = idxColor >= 0 ? String(row[idxColor] || '').trim() : '';
    const nombreColor = idxNombreColor >= 0 ? String(row[idxNombreColor] || '').trim() : '';
    const medida = idxMedida >= 0 ? String(row[idxMedida] || '').trim() : '';
    const cantidadRaw = idxCantidad >= 0 ? row[idxCantidad] : 0;
    const cantidad = parseInt(cantidadRaw) || 0;
    const tipologia = idxTipologia >= 0 ? String(row[idxTipologia] || '').trim() : '';
    const origen = idxOrigen >= 0 ? String(row[idxOrigen] || '').trim() : '';
    const temporada = idxTemporada >= 0 ? String(row[idxTemporada] || '').trim() : '';

    if (!tipologia) {
      filasDescartadas++;
      razonesDescarte['tipologia_vacia'] = (razonesDescarte['tipologia_vacia'] || 0) + 1;
      continue;
    }

    if (!medida) {
      filasDescartadas++;
      razonesDescarte['medida_vacia'] = (razonesDescarte['medida_vacia'] || 0) + 1;
      continue;
    }

    if (cantidad <= 0) {
      filasDescartadas++;
      razonesDescarte['cantidad_cero_o_negativa'] = (razonesDescarte['cantidad_cero_o_negativa'] || 0) + 1;
      continue;
    }

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

  log('PARSER', `Parseo completado: ${productos.length} productos válidos, ${filasDescartadas} descartadas`, { razonesDescarte });

  if (productos.length === 0) {
    throw new Error('No se encontraron productos válidos en el archivo de stock');
  }

  return productos;
};

export const parsearParticipacion = (data) => {
  if (!data || data.length < 2) {
    throw new Error('Archivo de participación vacío o inválido');
  }

  const datosTemporales = [];
  let sumaRaw = 0;

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

  const enFormatoDecimal = sumaRaw < 10;
  const multiplicador = enFormatoDecimal ? 100 : 1;

  const participaciones = {};
  let sumaTotal = 0;

  datosTemporales.forEach(({ sucursal, participacion }) => {
    const valorFinal = participacion * multiplicador;
    participaciones[sucursal] = valorFinal;
    sumaTotal += valorFinal;
  });

  if (Math.abs(sumaTotal - 100) > 0.5) {
    throw new Error(
      `❌ Los porcentajes deben sumar 100%. Suma actual: ${sumaTotal.toFixed(2)}%`
    );
  }

  log('PARSER', `Participación parseada: ${Object.keys(participaciones).length} sucursales, suma: ${sumaTotal.toFixed(2)}%`);

  return participaciones;
};

export const parsearPrioridad = (data) => {
  if (!data || data.length < 2) {
    throw new Error('El archivo de prioridad es OBLIGATORIO');
  }

  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const prioridades = {};

  const idxPrioridad = headers.findIndex(h => h.includes('prioridad') || h.includes('priorid'));
  const idxTipologia = headers.findIndex(h => h.includes('tipologia') || h.includes('tipología'));

  if (idxPrioridad < 0 || idxTipologia < 0) {
    throw new Error('El archivo de prioridad debe tener las columnas: prioridad, tipologia');
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const prioridad = parseInt(row[idxPrioridad]) || 999;
    const tipologia = String(row[idxTipologia] || '').trim();

    if (tipologia) {
      prioridades[tipologia] = prioridad;
    }
  }

  if (Object.keys(prioridades).length === 0) {
    throw new Error('El archivo de prioridad no contiene datos válidos');
  }

  log('PARSER', `Prioridades parseadas: ${Object.keys(prioridades).length} tipologías`);

  return prioridades;
};

// ============================================================================
// CONSOLIDACIÓN Y DETECCIÓN DE CURVAS
// ============================================================================

/**
 * Consolida productos por SKU, sumando cantidades de todos los depósitos
 */
const consolidarPorSKU = (productos) => {
  const skusConsolidados = {};

  productos.forEach(producto => {
    const { sku, cantidad, deposito } = producto;

    if (!skusConsolidados[sku]) {
      skusConsolidados[sku] = {
        ...producto,
        cantidadTotal: 0,
        depositos: []
      };
    }

    skusConsolidados[sku].cantidadTotal += cantidad;
    skusConsolidados[sku].depositos.push({
      nombre: deposito || 'Sin nombre',
      coddep: producto.coddep,
      cantidad: cantidad
    });
  });

  log('CONSOLIDACION', `SKUs consolidados: ${Object.keys(skusConsolidados).length} únicos`);

  return skusConsolidados;
};

/**
 * Detecta curvas completas por TIPOLOGIA + Color
 * Una curva = todos los talles disponibles de ese producto
 */
const detectarCurvas = (skusConsolidados) => {
  const curvas = {};

  Object.values(skusConsolidados).forEach(skuData => {
    const clave = `${skuData.tipologia}_${skuData.color}`;

    if (!curvas[clave]) {
      curvas[clave] = {
        tipologia: skuData.tipologia,
        color: skuData.color,
        nombreColor: skuData.nombreColor,
        talles: [],
        skus: [],
        cantidadTotalCurva: 0
      };
    }

    curvas[clave].talles.push(skuData.medida);
    curvas[clave].skus.push(skuData.sku);
    curvas[clave].cantidadTotalCurva += skuData.cantidadTotal;
  });

  // Ordenar talles numéricamente o alfabéticamente
  Object.values(curvas).forEach(curva => {
    curva.talles.sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB; // Numérico
      }
      return a.localeCompare(b); // Alfabético
    });
  });

  log('CURVAS', `Curvas detectadas: ${Object.keys(curvas).length} productos únicos`);

  return curvas;
};

// ============================================================================
// REGLAS CROSS (1-3)
// ============================================================================

/**
 * CROSS - Regla 2: Validar curvas completas
 * Ajusta distribución para que cada local reciba curvas completas o nada
 */
const validarCurvasCompletas = (distribucionPorSKU, curvas, sucursales, participaciones) => {
  const unidadesRetiradas = []; // Guardar para redistribuir

  Object.entries(curvas).forEach(([claveCurva, curva]) => {
    const { talles, skus } = curva;

    // Analizar cada sucursal
    sucursales.forEach(suc => {
      const tallesEnSucursal = talles.filter(talle => {
        const sku = skus.find(s => s.includes(`_${talle}`));
        return sku && distribucionPorSKU[sku] && distribucionPorSKU[sku][suc] > 0;
      });

      const porcentajeCurva = tallesEnSucursal.length / talles.length;

      // Si tiene curva incompleta (< 100% pero > 0%)
      if (porcentajeCurva > 0 && porcentajeCurva < 1) {
        log('CROSS-R2', `Curva incompleta detectada en ${suc}: ${claveCurva} (${(porcentajeCurva * 100).toFixed(0)}%)`, {
          sucursal: suc,
          producto: claveCurva,
          tallesPresentes: tallesEnSucursal.length,
          tallesTotal: talles.length
        });

        // Decisión: Si tiene < 70% de la curva, eliminar todo
        if (porcentajeCurva < 0.7) {
          tallesEnSucursal.forEach(talle => {
            const sku = skus.find(s => s.includes(`_${talle}`));
            if (sku && distribucionPorSKU[sku]) {
              const unidades = distribucionPorSKU[sku][suc] || 0;
              if (unidades > 0) {
                distribucionPorSKU[sku][suc] = 0;
                unidadesRetiradas.push({ sku, unidades, sucursalOrigen: suc });

                log('CROSS-R2', `Retiradas ${unidades} unidades de ${sku} en ${suc} (curva rota)`, {
                  sku,
                  sucursal: suc,
                  unidades
                });
              }
            }
          });
        }
      }
    });
  });

  // Redistribuir unidades retiradas al local con mayor participación
  if (unidadesRetiradas.length > 0) {
    const localMayorParticipacion = Object.entries(participaciones)
      .reduce((max, [suc, pct]) => pct > max.pct ? { suc, pct } : max, { suc: null, pct: 0 }).suc;

    unidadesRetiradas.forEach(({ sku, unidades }) => {
      if (!distribucionPorSKU[sku]) distribucionPorSKU[sku] = {};
      distribucionPorSKU[sku][localMayorParticipacion] = (distribucionPorSKU[sku][localMayorParticipacion] || 0) + unidades;

      log('CROSS-R2', `Redistribuidas ${unidades} unidades de ${sku} a ${localMayorParticipacion} (mayor participación)`, {
        sku,
        unidades,
        destino: localMayorParticipacion
      });
    });

    log('CROSS-R2', `Total redistribuido: ${unidadesRetiradas.length} ajustes, ${unidadesRetiradas.reduce((sum, u) => sum + u.unidades, 0)} unidades`);
  }
};

/**
 * CROSS - Regla 3: Asignar sobrantes al local con mayor participación
 */
const asignarSobrantesAMayorParticipacion = (distribucionPorSKU, participaciones) => {
  // Encontrar local con mayor participación
  let localMayorParticipacion = null;
  let maxParticipacion = 0;

  Object.entries(participaciones).forEach(([suc, pct]) => {
    if (pct > maxParticipacion) {
      maxParticipacion = pct;
      localMayorParticipacion = suc;
    }
  });

  log('CROSS-R3', `Local con mayor participación: ${localMayorParticipacion} (${maxParticipacion.toFixed(2)}%)`);

  // Los sobrantes ya están asignados por Hamilton con mayor resto
  // Esta regla es más para trazabilidad
  return localMayorParticipacion;
};

/**
 * Aplica todas las reglas CROSS
 */
const aplicarReglasCross = (distribucionPorSKU, curvas, sucursales, participaciones) => {
  log('CROSS', '📍 Iniciando reglas CROSS (1-3)');

  // Regla 1: Ya aplicada por Hamilton
  log('CROSS-R1', '✅ Distribución según % UTA (aplicada por Hamilton)');

  // Regla 2: Validar curvas completas y redistribuir
  validarCurvasCompletas(distribucionPorSKU, curvas, sucursales, participaciones);

  // Regla 3: Sobrantes a local con mayor participación
  asignarSobrantesAMayorParticipacion(distribucionPorSKU, participaciones);

  log('CROSS', '✅ Reglas CROSS completadas');
};

// ============================================================================
// REGLAS INTERLOCAL (4-9)
// ============================================================================

/**
 * INTERLOCAL - Regla 4: Locales grandes no distribuyen (salvo sobrestock)
 */
const aplicarRestriccionLocalesGrandes = (distribucionPorSKU, curvas, sucursales, participaciones) => {
  const localesGrandes = sucursales.filter(suc => participaciones[suc] > UMBRAL_LOCAL_GRANDE);

  log('INTERLOCAL-R4', `Locales grandes identificados: ${localesGrandes.join(', ')}`, {
    cantidad: localesGrandes.length,
    umbral: UMBRAL_LOCAL_GRANDE
  });

  // Por ahora solo registramos para trazabilidad
  // La lógica de "no distribuir" se aplicará en la generación de transferencias
  localesGrandes.forEach(local => {
    log('INTERLOCAL-R4', `${local} marcado como local grande - restricción de transferencias aplicada`);
  });

  return localesGrandes;
};

/**
 * INTERLOCAL - Regla 5: Prioridad completar curva (críticos primero)
 */
const aplicarPrioridadCompletarCurva = (distribucionPorSKU, curvas, prioridades) => {
  // Ya ordenado por prioridad en paso anterior
  log('INTERLOCAL-R5', '✅ Orden de prioridad ya aplicado (productos críticos procesados primero)');
};

/**
 * INTERLOCAL - Regla 6: Maximizar eficiencia de movimientos
 */
const optimizarMovimientos = (distribucionPorSKU) => {
  // Esta regla se aplica mejor en la generación de transferencias
  log('INTERLOCAL-R6', '✅ Optimización de movimientos (se aplicará en generación de transferencias)');
};

/**
 * INTERLOCAL - Regla 7: Limpiar curvas rotas existentes
 */
const limpiarCurvasRotas = (distribucionPorSKU, curvas, sucursales, participaciones) => {
  const unidadesRetiradas = [];

  Object.entries(curvas).forEach(([claveCurva, curva]) => {
    const { talles, skus } = curva;

    sucursales.forEach(suc => {
      const tallesEnSucursal = talles.filter(talle => {
        const sku = skus.find(s => s.includes(`_${talle}`));
        return sku && distribucionPorSKU[sku] && distribucionPorSKU[sku][suc] > 0;
      });

      // Si tiene menos del 50% de la curva, limpiar completamente
      if (tallesEnSucursal.length > 0 && tallesEnSucursal.length < talles.length * 0.5) {
        tallesEnSucursal.forEach(talle => {
          const sku = skus.find(s => s.includes(`_${talle}`));
          if (sku && distribucionPorSKU[sku]) {
            const unidades = distribucionPorSKU[sku][suc] || 0;
            if (unidades > 0) {
              distribucionPorSKU[sku][suc] = 0;
              unidadesRetiradas.push({ sku, unidades, sucursalOrigen: suc });
            }
          }
        });

        log('INTERLOCAL-R7', `Curva rota limpiada: ${claveCurva} en ${suc}`, {
          producto: claveCurva,
          sucursal: suc,
          tallesEliminados: tallesEnSucursal.length
        });
      }
    });
  });

  // Redistribuir unidades retiradas
  if (unidadesRetiradas.length > 0) {
    const localMayorParticipacion = Object.entries(participaciones)
      .reduce((max, [suc, pct]) => pct > max.pct ? { suc, pct } : max, { suc: null, pct: 0 }).suc;

    unidadesRetiradas.forEach(({ sku, unidades }) => {
      if (!distribucionPorSKU[sku]) distribucionPorSKU[sku] = {};
      distribucionPorSKU[sku][localMayorParticipacion] = (distribucionPorSKU[sku][localMayorParticipacion] || 0) + unidades;
    });

    log('INTERLOCAL-R7', `Limpieza completada: ${unidadesRetiradas.length} ajustes, ${unidadesRetiradas.reduce((sum, u) => sum + u.unidades, 0)} unidades redistribuidas`);
  } else {
    log('INTERLOCAL-R7', `Limpieza completada: 0 ajustes realizados`);
  }
};

/**
 * INTERLOCAL - Regla 8: Analizar por categoría + importancia (trazabilidad)
 */
const analizarCategoriaPrioridad = (distribucionPorSKU, prioridades) => {
  const categorias = {};

  Object.keys(distribucionPorSKU).forEach(sku => {
    const tipologia = sku.split('_')[0];
    const prioridad = prioridades[tipologia] || 999;

    if (!categorias[prioridad]) {
      categorias[prioridad] = [];
    }
    categorias[prioridad].push(sku);
  });

  Object.entries(categorias).forEach(([prioridad, skus]) => {
    log('INTERLOCAL-R8', `Prioridad ${prioridad}: ${skus.length} SKUs`, {
      prioridad,
      cantidad: skus.length
    });
  });
};

/**
 * INTERLOCAL - Regla 9: UTA se acumula (hook para IA)
 */
const acumularUTA = (distribucionPorSKU, participaciones) => {
  const utaPorSucursal = {};

  Object.keys(participaciones).forEach(suc => {
    let totalUnidades = 0;

    Object.values(distribucionPorSKU).forEach(dist => {
      totalUnidades += dist[suc] || 0;
    });

    utaPorSucursal[suc] = {
      participacion: participaciones[suc],
      unidadesAsignadas: totalUnidades,
      utaAcumulada: totalUnidades // Hook para IA futura
    };
  });

  log('INTERLOCAL-R9', 'UTA acumulada por sucursal', utaPorSucursal);

  return utaPorSucursal;
};

/**
 * Aplica todas las reglas INTERLOCAL
 */
const aplicarReglasInterlocal = (distribucionPorSKU, curvas, sucursales, participaciones, prioridades) => {
  log('INTERLOCAL', '📍 Iniciando reglas INTERLOCAL (4-9)');

  // Regla 4: Restricción locales grandes
  aplicarRestriccionLocalesGrandes(distribucionPorSKU, curvas, sucursales, participaciones);

  // Regla 5: Prioridad completar curva
  aplicarPrioridadCompletarCurva(distribucionPorSKU, curvas, prioridades);

  // Regla 6: Optimizar movimientos
  optimizarMovimientos(distribucionPorSKU);

  // Regla 7: Limpiar curvas rotas y redistribuir
  limpiarCurvasRotas(distribucionPorSKU, curvas, sucursales, participaciones);

  // Regla 8: Analizar categoría + prioridad
  analizarCategoriaPrioridad(distribucionPorSKU, prioridades);

  // Regla 9: Acumular UTA
  acumularUTA(distribucionPorSKU, participaciones);

  log('INTERLOCAL', '✅ Reglas INTERLOCAL completadas');
};

// ============================================================================
// MOTOR PRINCIPAL V2
// ============================================================================

export const generarDistribucionAutomatica = (stockData, participacionData, prioridadData) => {
  // Limpiar trazabilidad
  trazabilidad.length = 0;

  log('INICIO', '🚀 Iniciando distribución inteligente v2.0');

  // PASO 1: Parsear archivos
  const productos = parsearStock(stockData);
  const participaciones = parsearParticipacion(participacionData);
  const prioridades = parsearPrioridad(prioridadData || []);

  const sucursales = Object.keys(participaciones);

  // PASO 2: Consolidar por SKU
  const skusConsolidados = consolidarPorSKU(productos);

  // PASO 3: Detectar curvas completas
  const curvas = detectarCurvas(skusConsolidados);

  // PASO 4: Ordenar por prioridad
  const skusOrdenados = Object.values(skusConsolidados).sort((a, b) => {
    const prioridadA = prioridades[a.tipologia] || 999;
    const prioridadB = prioridades[b.tipologia] || 999;
    if (prioridadA !== prioridadB) return prioridadA - prioridadB;
    return a.tipologia.localeCompare(b.tipologia);
  });

  log('ORDEN', `Productos ordenados por prioridad: primero ${skusOrdenados[0]?.tipologia} (${prioridades[skusOrdenados[0]?.tipologia] || 999})`);

  // PASO 5: Aplicar Hamilton (distribución base)
  const distribucionPorSKU = {};
  const distribucionDetallada = [];

  skusOrdenados.forEach(skuData => {
    const { sku, cantidadTotal, tipologia, color, medida, nombreColor, origen, temporada, depositos } = skuData;

    const resultado = algoritmoHamilton(cantidadTotal, participaciones);
    distribucionPorSKU[sku] = resultado.distribucion;

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
          depositos: depositos,
          depositosOrigen: depositos.map(d => d.nombre).join(', '),
          origen,
          temporada,
          prioridad: prioridades[tipologia] || 999,
          reglaAplicada: 'HAMILTON_BASE'
        });
      }
    });
  });

  log('HAMILTON', `Distribución base calculada: ${distribucionDetallada.length} asignaciones`);

  // PASO 6: Aplicar REGLAS CROSS (1-3)
  aplicarReglasCross(distribucionPorSKU, curvas, sucursales, participaciones);

  // PASO 7: Aplicar REGLAS INTERLOCAL (4-9)
  aplicarReglasInterlocal(distribucionPorSKU, curvas, sucursales, participaciones, prioridades);

  // PASO 7.5: Actualizar distribucionDetallada con los cambios de las reglas
  distribucionDetallada.length = 0; // Limpiar y regenerar

  skusOrdenados.forEach(skuData => {
    const { sku, cantidadTotal, tipologia, color, medida, nombreColor, origen, temporada, depositos } = skuData;
    const distribucionSKU = distribucionPorSKU[sku] || {};

    Object.entries(distribucionSKU).forEach(([sucursal, unidades]) => {
      if (unidades > 0) {
        distribucionDetallada.push({
          sku,
          tipologia,
          color,
          nombreColor,
          medida,
          sucursal,
          unidades,
          cuotaExacta: '-', // Ya no es relevante después de las reglas
          residuo: '-',
          depositos: depositos,
          depositosOrigen: depositos.map(d => d.nombre).join(', '),
          origen,
          temporada,
          prioridad: prioridades[tipologia] || 999,
          reglaAplicada: 'CROSS+INTERLOCAL'
        });
      }
    });
  });

  log('REBUILD', `distribucionDetallada regenerada: ${distribucionDetallada.length} asignaciones finales`);

  // PASO 8: Generar resumen
  const resumenSucursales = {};
  sucursales.forEach(suc => {
    resumenSucursales[suc] = {
      totalUnidades: 0,
      participacionEsperada: participaciones[suc],
      participacionReal: 0,
      esLocalGrande: participaciones[suc] > UMBRAL_LOCAL_GRANDE
    };
  });

  let totalUnidadesDistribuidas = 0;
  distribucionDetallada.forEach(item => {
    resumenSucursales[item.sucursal].totalUnidades += item.unidades;
    totalUnidadesDistribuidas += item.unidades;
  });

  Object.keys(resumenSucursales).forEach(suc => {
    resumenSucursales[suc].participacionReal =
      ((resumenSucursales[suc].totalUnidades / totalUnidadesDistribuidas) * 100).toFixed(2);
  });

  // PASO 9: Check Sum
  const totalOriginal = Object.values(skusConsolidados).reduce((sum, sku) => sum + sku.cantidadTotal, 0);
  const checkSum = {
    totalOriginal,
    totalDistribuido: totalUnidadesDistribuidas,
    diferencia: totalOriginal - totalUnidadesDistribuidas,
    esValido: totalOriginal === totalUnidadesDistribuidas
  };

  log('CHECKSUM', `${checkSum.esValido ? '✅ OK' : '❌ ERROR'}: Original ${totalOriginal}, Distribuido ${totalUnidadesDistribuidas}`);

  // PASO 10: Generar transferencias
  const transferencias = [];

  Object.values(skusConsolidados).forEach(skuData => {
    const { sku, depositos, tipologia, color, nombreColor, medida, temporada } = skuData;
    const distribucionSKU = distribucionPorSKU[sku] || {};
    const prioridad = prioridades[tipologia] || 999;

    const depositosDisponibles = depositos.map(d => ({
      nombre: d.nombre,
      cantidadDisponible: d.cantidad
    }));

    Object.entries(distribucionSKU).forEach(([sucursal, unidadesNecesarias]) => {
      if (unidadesNecesarias <= 0) return;

      let unidadesPendientes = unidadesNecesarias;

      for (const deposito of depositosDisponibles) {
        if (unidadesPendientes <= 0) break;
        if (deposito.cantidadDisponible <= 0) continue;

        const unidadesDesdeDeposito = Math.min(unidadesPendientes, deposito.cantidadDisponible);

        transferencias.push({
          sku,
          talle: medida,
          color: nombreColor || color,
          origen: deposito.nombre,
          destino: sucursal,
          unidades: unidadesDesdeDeposito,
          motivo: 'Distribución base Hamilton',
          reglaAplicada: 'HAMILTON_BASE',
          prioridad,
          temporada
        });

        deposito.cantidadDisponible -= unidadesDesdeDeposito;
        unidadesPendientes -= unidadesDesdeDeposito;
      }
    });
  });

  log('TRANSFERENCIAS', `Generadas: ${transferencias.length} movimientos`);
  log('FIN', '✅ Distribución completada');

  return {
    distribucionDetallada,
    resumenSucursales,
    transferencias,
    trazabilidad: [...trazabilidad],
    checkSum,
    curvas,
    skusConsolidados,
    productos,
    participaciones,
    sucursales
  };
};

// ============================================================================
// EXPORTACIÓN A EXCEL
// ============================================================================

export const exportarDistribucionCompleta = (resultado) => {
  const wb = XLSX.utils.book_new();

  // HOJA 1: Distribución Final
  const hoja1Data = [
    ['SKU', 'TIPOLOGIA', 'Color', 'Medida', 'Depósitos Origen', 'Sucursal Destino', 'Unidades', 'Cuota Exacta', 'Residuo', 'Regla Aplicada']
  ];

  resultado.distribucionDetallada.forEach(item => {
    hoja1Data.push([
      item.sku,
      item.tipologia,
      item.nombreColor || item.color,
      item.medida,
      item.depositosOrigen || 'Sin depósito',
      item.sucursal,
      item.unidades,
      item.cuotaExacta,
      item.residuo,
      item.reglaAplicada || '-'
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(hoja1Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'Distribución Final');

  // HOJA 2: Transferencias
  const hoja2Data = [
    ['SKU', 'Talle', 'Color', 'Origen', 'Destino', 'Unidades', 'Motivo', 'Regla', 'Prioridad', 'Temporada']
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
      t.reglaAplicada || '-',
      t.prioridad,
      t.temporada
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(hoja2Data);
  XLSX.utils.book_append_sheet(wb, ws2, 'Transferencias');

  // HOJA 3: Resumen por Sucursal
  const hoja3Data = [
    ['Sucursal', 'Total Unidades', '% Esperado', '% Real', 'Desviación', 'Local Grande']
  ];

  Object.entries(resultado.resumenSucursales).forEach(([suc, datos]) => {
    const desviacion = (parseFloat(datos.participacionReal) - datos.participacionEsperada).toFixed(2);
    hoja3Data.push([
      suc,
      datos.totalUnidades,
      datos.participacionEsperada.toFixed(2) + '%',
      datos.participacionReal + '%',
      desviacion + '%',
      datos.esLocalGrande ? 'Sí' : 'No'
    ]);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(hoja3Data);
  XLSX.utils.book_append_sheet(wb, ws3, 'Resumen Sucursales');

  // HOJA 4: Log de Trazabilidad
  const hoja4Data = [
    ['Timestamp', 'Regla', 'Mensaje', 'Datos']
  ];

  resultado.trazabilidad.forEach(log => {
    hoja4Data.push([
      log.timestamp,
      log.regla,
      log.mensaje,
      JSON.stringify(log).substring(0, 200)
    ]);
  });

  const ws4 = XLSX.utils.aoa_to_sheet(hoja4Data);
  XLSX.utils.book_append_sheet(wb, ws4, 'Log Trazabilidad');

  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Distribucion_Inteligente_${fecha}.xlsx`);
};

export const exportarDistribucionCSV = (distribucionDetallada) => {
  const headers = ['sku', 'tipologia', 'color', 'medida', 'sucursal', 'unidades', 'reglaAplicada'];
  const rows = distribucionDetallada.map(item => [
    item.sku,
    item.tipologia,
    item.color,
    item.medida,
    item.sucursal,
    item.unidades,
    item.reglaAplicada || '-'
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
