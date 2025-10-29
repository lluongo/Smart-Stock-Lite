/**
 * Motor de Distribución Inter-local
 * Implementa reglas de negocio para redistribución óptima de mercadería entre locales
 */

/**
 * Analiza si una curva está completa
 * Una curva completa tiene todos los talles disponibles
 */
const analizarCurva = (stockPorTalle) => {
  const tallesDisponibles = Object.values(stockPorTalle).filter(qty => qty > 0).length;
  const totalTalles = Object.keys(stockPorTalle).length;
  const porcentajeCompleto = tallesDisponibles / totalTalles;

  return {
    completa: porcentajeCompleto === 1,
    tallesDisponibles,
    totalTalles,
    porcentaje: porcentajeCompleto,
    talleFaltantes: Object.keys(stockPorTalle).filter(talle => stockPorTalle[talle] === 0)
  };
};

/**
 * Detecta si un local tiene sobrestock
 * R2: Sobrestock = más de 3 curvas completas o exceso por encima de capacidad
 */
const detectarSobrestock = (stockLocal, capacidad, curvasCompletas) => {
  const tieneSobrestock = curvasCompletas > 3 || stockLocal > capacidad;
  return {
    tieneSobrestock,
    curvasCompletas,
    excesoCapacidad: Math.max(0, stockLocal - capacidad),
    nivel: tieneSobrestock ? (curvasCompletas > 3 ? 'curvas' : 'capacidad') : 'normal'
  };
};

/**
 * Calcula ranking de tiendas según performance
 */
const calcularRanking = (participacionData) => {
  // Asumiendo formato: [["Local", "% VTA"], ["Local1", "25"], ...]
  const ranking = participacionData
    .slice(1) // Saltar header
    .map(row => ({
      local: row[0],
      participacion: parseFloat(row[1]) || 0
    }))
    .sort((a, b) => b.participacion - a.participacion);

  return ranking;
};

/**
 * Parsea datos de stock en estructura manejable
 * Formato esperado: [["SKU", "Talle", "Color", "Local1", "Local2", ...], ...]
 */
const parsearStockData = (stockData) => {
  if (!stockData || stockData.length < 2) return null;

  const headers = stockData[0];
  const skuIndex = headers.findIndex(h => h.toLowerCase().includes('sku') || h.toLowerCase().includes('producto'));
  const talleIndex = headers.findIndex(h => h.toLowerCase().includes('talle') || h.toLowerCase().includes('size'));
  const colorIndex = headers.findIndex(h => h.toLowerCase().includes('color'));

  // Los locales son todas las columnas después de SKU, Talle, Color
  const localesStartIndex = Math.max(skuIndex, talleIndex, colorIndex) + 1;
  const locales = headers.slice(localesStartIndex);

  const productos = {};

  for (let i = 1; i < stockData.length; i++) {
    const row = stockData[i];
    if (!row || row.length === 0) continue;

    const sku = row[skuIndex] || `SKU-${i}`;
    const talle = row[talleIndex] || 'U';
    const color = row[colorIndex] || 'N/A';
    const key = `${sku}-${color}`;

    if (!productos[key]) {
      productos[key] = {
        sku,
        color,
        talles: {},
        locales: {}
      };
    }

    // Inicializar locales si no existe
    locales.forEach((local, idx) => {
      if (!productos[key].locales[local]) {
        productos[key].locales[local] = {};
      }
      const stockQty = parseInt(row[localesStartIndex + idx]) || 0;
      productos[key].locales[local][talle] = stockQty;

      // También guardamos en talles para análisis global
      if (!productos[key].talles[talle]) {
        productos[key].talles[talle] = 0;
      }
      productos[key].talles[talle] += stockQty;
    });
  }

  return {
    productos,
    locales
  };
};

/**
 * Analiza curvas por local y producto
 */
const analizarCurvasPorLocal = (productosData) => {
  const analisis = {};

  Object.entries(productosData.productos).forEach(([key, producto]) => {
    analisis[key] = {
      sku: producto.sku,
      color: producto.color,
      locales: {}
    };

    Object.entries(producto.locales).forEach(([local, stockPorTalle]) => {
      const curvaAnalisis = analizarCurva(stockPorTalle);
      const totalStock = Object.values(stockPorTalle).reduce((sum, qty) => sum + qty, 0);

      analisis[key].locales[local] = {
        ...curvaAnalisis,
        totalStock,
        stockPorTalle
      };
    });
  });

  return analisis;
};

/**
 * R1: Los locales de mayor tamaño no trasladan mercadería salvo en condiciones de sobrestock
 * R3: El inventario sobrante se asigna según porcentaje de ventas del local
 */
const calcularDistribucionOptima = (stockData, participacionData, prioridadData) => {
  // 1. Parsear datos
  const productosData = parsearStockData(stockData);
  if (!productosData) {
    console.error('Error al parsear datos de stock');
    return [];
  }

  const ranking = calcularRanking(participacionData);
  const analisisCurvas = analizarCurvasPorLocal(productosData);

  // 2. Identificar locales grandes (top 20% por participación)
  const umbralLocalesGrandes = ranking.length > 0 ? ranking[0].participacion * 0.8 : 0;
  const localesGrandes = ranking.filter(r => r.participacion >= umbralLocalesGrandes).map(r => r.local);

  // 3. Calcular capacidades (usando prioridad data o valores por defecto)
  const capacidades = {};
  productosData.locales.forEach(local => {
    // Por defecto, usar participación como proxy de capacidad
    const localData = ranking.find(r => r.local === local);
    capacidades[local] = localData ? localData.participacion * 1000 : 500; // Escalar capacidad
  });

  const movimientos = [];

  // 4. Para cada producto, analizar distribución
  Object.entries(analisisCurvas).forEach(([productoKey, productoAnalisis]) => {
    const { sku, color, locales } = productoAnalisis;

    // Identificar locales con curvas rotas y completas
    const localesConCurvaRota = [];
    const localesConSobrestock = [];
    const localesConCurvaCompleta = [];

    Object.entries(locales).forEach(([local, analisis]) => {
      const { completa, totalStock, talleFaltantes } = analisis;

      // Calcular curvas completas aproximadas
      const tallesPorCurva = Object.keys(analisis.stockPorTalle).length;
      const curvasCompletas = tallesPorCurva > 0 ? Math.floor(totalStock / tallesPorCurva) : 0;

      const sobrestock = detectarSobrestock(totalStock, capacidades[local], curvasCompletas);

      if (!completa && talleFaltantes.length > 0) {
        localesConCurvaRota.push({
          local,
          talleFaltantes,
          stockActual: analisis.stockPorTalle,
          totalStock
        });
      }

      if (sobrestock.tieneSobrestock && !localesGrandes.includes(local)) {
        localesConSobrestock.push({
          local,
          sobrestock,
          stockActual: analisis.stockPorTalle,
          totalStock
        });
      }

      if (completa) {
        localesConCurvaCompleta.push({
          local,
          stockActual: analisis.stockPorTalle,
          totalStock,
          curvasCompletas
        });
      }
    });

    // 5. R4 y R5: Priorizar completar curvas
    localesConCurvaRota.forEach(localRoto => {
      localRoto.talleFaltantes.forEach(talleFaltante => {
        // Buscar en locales con sobrestock o curvas completas
        const donantes = [...localesConSobrestock, ...localesConCurvaCompleta]
          .filter(d => d.local !== localRoto.local && d.stockActual[talleFaltante] > 1)
          .sort((a, b) => {
            // Priorizar locales con sobrestock
            if (a.sobrestock && !b.sobrestock) return -1;
            if (!a.sobrestock && b.sobrestock) return 1;
            // Luego por cantidad disponible
            return b.stockActual[talleFaltante] - a.stockActual[talleFaltante];
          });

        if (donantes.length > 0) {
          const donante = donantes[0];
          const cantidadAMover = 1; // Mover 1 unidad para completar curva

          // R6: Validar que el movimiento no rompa la curva del donante
          const quedaria = donante.stockActual[talleFaltante] - cantidadAMover;
          const rompeCurva = quedaria === 0 && donante.totalStock > 0;

          if (!rompeCurva || donante.sobrestock) {
            movimientos.push({
              sku,
              talle: talleFaltante,
              color,
              origen: donante.local,
              destino: localRoto.local,
              cantidad: cantidadAMover,
              motivo: 'Completar curva',
              prioridad: 'alta',
              estado: 'Pendiente'
            });
          }
        }
      });
    });

    // 6. R2 y R3: Redistribuir sobrestock según % de ventas
    localesConSobrestock.forEach(localSobrestock => {
      Object.entries(localSobrestock.stockActual).forEach(([talle, cantidad]) => {
        if (cantidad <= 1) return; // No mover si queda poco stock

        const excesoUnidades = localSobrestock.sobrestock.excesoCapacidad;
        if (excesoUnidades <= 0) return;

        // Distribuir según ranking de ventas
        const destinatariosPotenciales = ranking
          .filter(r =>
            r.local !== localSobrestock.local &&
            !localesGrandes.includes(r.local) &&
            locales[r.local]?.totalStock < capacidades[r.local]
          )
          .slice(0, 3); // Top 3 locales

        if (destinatariosPotenciales.length > 0) {
          const totalParticipacion = destinatariosPotenciales.reduce((sum, d) => sum + d.participacion, 0);

          destinatariosPotenciales.forEach(destino => {
            const proporcion = destino.participacion / totalParticipacion;
            const cantidadAMover = Math.floor(Math.min(cantidad - 1, excesoUnidades * proporcion));

            if (cantidadAMover > 0) {
              movimientos.push({
                sku,
                talle,
                color,
                origen: localSobrestock.local,
                destino: destino.local,
                cantidad: cantidadAMover,
                motivo: 'Redistribuir sobrestock',
                prioridad: 'media',
                estado: 'Pendiente'
              });
            }
          });
        }
      });
    });
  });

  return movimientos;
};

/**
 * Genera estadísticas de la distribución
 */
const generarEstadisticas = (movimientos, analisisCurvas) => {
  const totalMovimientos = movimientos.length;
  const unidadesTotales = movimientos.reduce((sum, m) => sum + m.cantidad, 0);

  const porMotivo = movimientos.reduce((acc, m) => {
    acc[m.motivo] = (acc[m.motivo] || 0) + 1;
    return acc;
  }, {});

  const porPrioridad = movimientos.reduce((acc, m) => {
    acc[m.prioridad] = (acc[m.prioridad] || 0) + 1;
    return acc;
  }, {});

  // Calcular curvas antes y después
  const totalProductos = Object.keys(analisisCurvas).length;
  let curvasCompletasAntes = 0;
  let curvasRotasAntes = 0;

  Object.values(analisisCurvas).forEach(producto => {
    Object.values(producto.locales).forEach(local => {
      if (local.completa) curvasCompletasAntes++;
      else curvasRotasAntes++;
    });
  });

  return {
    totalMovimientos,
    unidadesTotales,
    porMotivo,
    porPrioridad,
    totalProductos,
    curvasCompletasAntes,
    curvasRotasAntes,
    eficienciaEstimada: curvasRotasAntes > 0 ? (movimientos.length / curvasRotasAntes * 100).toFixed(1) : 0
  };
};

/**
 * Exporta movimientos a formato para visualización
 */
const exportarParaVisualizacion = (movimientos) => {
  return movimientos.map(m => ({
    producto: `${m.sku} - ${m.color} - ${m.talle}`,
    origen: m.origen,
    destino: m.destino,
    cantidad: m.cantidad,
    motivo: m.motivo,
    prioridad: m.prioridad,
    estado: m.estado
  }));
};

export {
  calcularDistribucionOptima,
  generarEstadisticas,
  exportarParaVisualizacion,
  analizarCurva,
  detectarSobrestock,
  calcularRanking,
  analizarCurvasPorLocal,
  parsearStockData
};
