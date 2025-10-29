/**
 * Validación ULTRA ESTRICTA de formatos de archivos CSV
 * RECHAZA INMEDIATAMENTE cualquier archivo que no sea del tipo correcto
 */

/**
 * Valida que el archivo de stock tenga EXACTAMENTE el formato de stock
 * Formato esperado: SKU, Talle, Color, Local1, Local2, ...
 * RECHAZA si contiene CUALQUIER columna de otros tipos
 */
export const validarStock = (data) => {
  if (!data || data.length < 2) {
    return {
      valido: false,
      error: 'El archivo está vacío o no tiene suficientes filas'
    };
  }

  const headers = data[0];
  const headersLower = headers.map(h => String(h).toLowerCase().trim());

  // ========== VALIDACIÓN ULTRA ESTRICTA: RECHAZAR archivos de OTROS tipos ==========

  // Si tiene "% VTA" o similares (excepto descuento), ES DE PARTICIPACIÓN
  const tieneVTA = headersLower.some(h => {
    const esVTA = (h.includes('vta') || h.includes('venta') || h.includes('participacion'));
    const esDescuento = h.includes('desc') || h.includes('discount');
    return (esVTA || (h.includes('%') && !esDescuento));
  });

  if (tieneVTA) {
    return {
      valido: false,
      error: '🚫 ARCHIVO INCORRECTO: Este archivo contiene columnas de PARTICIPACIÓN (% VTA). Debes subirlo en la sección "Participación", NO aquí en "Stock".'
    };
  }

  // Si tiene "Prioridad", ES DE PRIORIDAD
  const tienePrioridad = headersLower.some(h =>
    h.includes('prioridad') || h.includes('priority')
  );

  if (tienePrioridad) {
    return {
      valido: false,
      error: '🚫 ARCHIVO INCORRECTO: Este archivo contiene columnas de PRIORIDAD. Debes subirlo en la sección "Prioridad", NO aquí en "Stock".'
    };
  }

  // ========== VALIDAR columnas REQUERIDAS para STOCK ==========

  const tieneSKU = headersLower.some(h =>
    h.includes('sku') || h.includes('producto') || h.includes('codigo')
  );

  const tieneTalle = headersLower.some(h =>
    h.includes('talle') || h.includes('size') || h.includes('talla')
  );

  const tieneColor = headersLower.some(h =>
    h.includes('color')
  );

  // Si NO tiene las 3 columnas básicas, NO es de Stock
  if (!tieneSKU || !tieneTalle || !tieneColor) {
    const faltantes = [];
    if (!tieneSKU) faltantes.push('SKU/Producto');
    if (!tieneTalle) faltantes.push('Talle');
    if (!tieneColor) faltantes.push('Color');

    return {
      valido: false,
      error: `El archivo de STOCK requiere las columnas: ${faltantes.join(', ')}. Formato: SKU, Talle, Color, Local1, Local2, ...`
    };
  }

  // Verificar que haya columnas de locales
  if (headers.length < 4) {
    return {
      valido: false,
      error: 'El archivo de Stock debe tener al menos 4 columnas (SKU, Talle, Color, y al menos un Local)'
    };
  }

  // Contar locales
  const skuIndex = headersLower.findIndex(h => h.includes('sku') || h.includes('producto') || h.includes('codigo'));
  const talleIndex = headersLower.findIndex(h => h.includes('talle') || h.includes('size'));
  const colorIndex = headersLower.findIndex(h => h.includes('color'));
  const lastRequiredIndex = Math.max(skuIndex, talleIndex, colorIndex);
  const locales = headers.slice(lastRequiredIndex + 1);

  // Verificar que las filas tengan datos
  let filasConDatos = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row.length > 0 && row[0]) {
      filasConDatos++;
    }
  }

  if (filasConDatos === 0) {
    return {
      valido: false,
      error: 'El archivo no contiene datos de productos'
    };
  }

  return {
    valido: true,
    mensaje: `✅ Archivo de Stock válido: ${filasConDatos} productos, ${locales.length} locales`,
    locales: locales,
    filas: filasConDatos
  };
};

/**
 * Valida que el archivo de participación tenga EXACTAMENTE el formato de participación
 * Formato esperado: Local, % VTA
 * RECHAZA si contiene CUALQUIER columna de otros tipos
 */
export const validarParticipacion = (data) => {
  if (!data || data.length < 2) {
    return {
      valido: false,
      error: 'El archivo está vacío o no tiene suficientes filas'
    };
  }

  const headers = data[0];
  const headersLower = headers.map(h => String(h).toLowerCase().trim());

  // ========== VALIDACIÓN ULTRA ESTRICTA: RECHAZAR archivos de OTROS tipos ==========

  // Si tiene SKU, probablemente NO es de Participación
  const tieneSKU = headersLower.some(h =>
    h.includes('sku') || h.includes('producto') || h.includes('codigo')
  );

  // Si tiene Talle, definitivamente NO es de Participación
  const tieneTalle = headersLower.some(h =>
    h.includes('talle') || h.includes('size') || h.includes('talla')
  );

  // Si tiene Color, definitivamente NO es de Participación
  const tieneColor = headersLower.some(h =>
    h.includes('color')
  );

  // RECHAZO INMEDIATO: Si tiene SKU O Talle O Color, es de STOCK
  if (tieneSKU || tieneTalle || tieneColor) {
    return {
      valido: false,
      error: '🚫 ARCHIVO INCORRECTO: Este archivo contiene columnas de STOCK (SKU/Talle/Color). Debes subirlo en la sección "Stock", NO aquí en "Participación".'
    };
  }

  // Si tiene Prioridad, ES DE PRIORIDAD
  const tienePrioridad = headersLower.some(h =>
    h.includes('prioridad') || h.includes('priority')
  );

  if (tienePrioridad) {
    return {
      valido: false,
      error: '🚫 ARCHIVO INCORRECTO: Este archivo contiene columnas de PRIORIDAD. Debes subirlo en la sección "Prioridad", NO aquí en "Participación".'
    };
  }

  // RECHAZO ADICIONAL: Si tiene más de 3 columnas, probablemente es de Stock
  if (headers.length > 3) {
    return {
      valido: false,
      error: '🚫 ARCHIVO INCORRECTO: El archivo de Participación debe tener solo 2-3 columnas (Local, % VTA). Este archivo tiene demasiadas columnas. ¿Es un archivo de Stock?'
    };
  }

  // ========== VALIDAR columnas REQUERIDAS para PARTICIPACIÓN ==========

  const tieneLocal = headersLower.some(h =>
    h.includes('local') || h.includes('tienda') || h.includes('sucursal') || h.includes('store')
  );

  const tieneVenta = headersLower.some(h =>
    h.includes('vta') || h.includes('venta') || h.includes('participacion') || h.includes('%')
  );

  if (!tieneLocal) {
    return {
      valido: false,
      error: 'El archivo de PARTICIPACIÓN requiere la columna "Local". Formato: Local, % VTA'
    };
  }

  if (!tieneVenta) {
    return {
      valido: false,
      error: 'El archivo de PARTICIPACIÓN requiere la columna "% VTA". Formato: Local, % VTA'
    };
  }

  // Verificar datos
  let filasConDatos = 0;
  let sumaParticipacion = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row.length >= 2 && row[0]) {
      filasConDatos++;
      const participacion = parseFloat(row[1]);
      if (!isNaN(participacion)) {
        sumaParticipacion += participacion;
      }
    }
  }

  if (filasConDatos === 0) {
    return {
      valido: false,
      error: 'El archivo no contiene datos de locales'
    };
  }

  const mensaje = `✅ Archivo de Participación válido: ${filasConDatos} locales`;
  const advertencia = Math.abs(sumaParticipacion - 100) > 5
    ? ` ⚠️ (La suma es ${sumaParticipacion.toFixed(1)}%, debería ser ~100%)`
    : '';

  return {
    valido: true,
    mensaje: mensaje + advertencia,
    locales: filasConDatos,
    sumaParticipacion
  };
};

/**
 * Valida que el archivo de prioridad tenga EXACTAMENTE el formato de prioridad
 * Formato esperado: SKU, Prioridad, Capacidad, Categoria
 * RECHAZA si contiene CUALQUIER columna de otros tipos
 */
export const validarPrioridad = (data) => {
  if (!data || data.length < 2) {
    return {
      valido: false,
      error: 'El archivo está vacío o no tiene suficientes filas'
    };
  }

  const headers = data[0];
  const headersLower = headers.map(h => String(h).toLowerCase().trim());

  // ========== VALIDACIÓN ULTRA ESTRICTA: RECHAZAR archivos de OTROS tipos ==========

  // Si tiene Talle O Color, ES DE STOCK
  const tieneTalle = headersLower.some(h =>
    h.includes('talle') || h.includes('size') || h.includes('talla')
  );

  const tieneColor = headersLower.some(h =>
    h.includes('color')
  );

  if (tieneTalle || tieneColor) {
    return {
      valido: false,
      error: '🚫 ARCHIVO INCORRECTO: Este archivo contiene columnas de STOCK (Talle/Color). Debes subirlo en la sección "Stock", NO aquí en "Prioridad".'
    };
  }

  // Si tiene "% VTA" o similares, ES DE PARTICIPACIÓN
  const tieneVTA = headersLower.some(h =>
    h.includes('vta') || h.includes('venta') || (h.includes('%') && (h.includes('vta') || h.includes('venta')))
  );

  if (tieneVTA) {
    return {
      valido: false,
      error: '🚫 ARCHIVO INCORRECTO: Este archivo contiene columnas de PARTICIPACIÓN (% VTA). Debes subirlo en la sección "Participación", NO aquí en "Prioridad".'
    };
  }

  // ========== VALIDAR columnas REQUERIDAS para PRIORIDAD ==========

  const tieneSKU = headersLower.some(h =>
    h.includes('sku') || h.includes('producto') || h.includes('codigo')
  );

  const tienePrioridad = headersLower.some(h =>
    h.includes('prioridad') || h.includes('priority')
  );

  if (!tieneSKU) {
    return {
      valido: false,
      error: 'El archivo de PRIORIDAD requiere la columna "SKU". Formato: SKU, Prioridad, Capacidad, Categoria'
    };
  }

  if (!tienePrioridad) {
    return {
      valido: false,
      error: 'El archivo de PRIORIDAD requiere la columna "Prioridad". Formato: SKU, Prioridad, Capacidad, Categoria'
    };
  }

  // Verificar datos
  let filasConDatos = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row.length > 0 && row[0]) {
      filasConDatos++;
    }
  }

  if (filasConDatos === 0) {
    return {
      valido: false,
      error: 'El archivo no contiene datos de productos'
    };
  }

  // Verificar columnas opcionales
  const hasCapacidad = headersLower.some(h => h.includes('capacidad'));
  const hasCategoria = headersLower.some(h => h.includes('categoria') || h.includes('category'));

  const opcionalesFaltantes = [];
  if (!hasCapacidad) opcionalesFaltantes.push('Capacidad');
  if (!hasCategoria) opcionalesFaltantes.push('Categoria');

  let mensaje = `✅ Archivo de Prioridad válido: ${filasConDatos} productos`;
  if (opcionalesFaltantes.length > 0) {
    mensaje += ` ℹ️ (Opcionales faltantes: ${opcionalesFaltantes.join(', ')})`;
  }

  return {
    valido: true,
    mensaje,
    productos: filasConDatos
  };
};

/**
 * Función principal de validación
 */
export const validarArchivo = (type, data) => {
  switch (type) {
    case 'stock':
      return validarStock(data);
    case 'participacion':
      return validarParticipacion(data);
    case 'prioridad':
      return validarPrioridad(data);
    default:
      return {
        valido: false,
        error: 'Tipo de archivo desconocido'
      };
  }
};
