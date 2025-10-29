/**
 * Validación ESTRICTA de formatos de archivos CSV
 * Asegura que cada tipo de archivo SOLO pueda subirse en su sección correspondiente
 */

/**
 * Detecta el tipo de archivo basándose en sus columnas
 */
const detectarTipoArchivo = (headers) => {
  const headersLower = headers.map(h => h.toLowerCase().trim());

  // Palabras clave para cada tipo
  const tieneSKU = headersLower.some(h => h.includes('sku') || h.includes('codigo'));
  const tieneTalle = headersLower.some(h => h.includes('talle') || h.includes('size'));
  const tieneColor = headersLower.some(h => h.includes('color'));
  const tieneLocal = headersLower.some(h => h.includes('local') || h.includes('tienda') || h.includes('sucursal'));
  const tieneVTA = headersLower.some(h => h.includes('vta') || h.includes('venta') || h.includes('%'));
  const tienePrioridad = headersLower.some(h => h.includes('prioridad') || h.includes('priority'));
  const tieneCapacidad = headersLower.some(h => h.includes('capacidad'));
  const tieneCategoria = headersLower.some(h => h.includes('categoria') || h.includes('category'));

  // Detectar tipo de archivo
  if (tieneSKU && tieneTalle && tieneColor && !tieneVTA && !tienePrioridad) {
    return 'stock';
  }

  if (tieneLocal && tieneVTA && !tieneSKU && !tieneTalle && !tieneColor && !tienePrioridad) {
    return 'participacion';
  }

  if (tieneSKU && tienePrioridad && !tieneTalle && !tieneColor && !tieneVTA) {
    return 'prioridad';
  }

  return null;
};

/**
 * Valida que el archivo de stock tenga el formato correcto Y SOLO sea stock
 * Formato esperado: SKU, Talle, Color, Local1, Local2, ...
 * NO DEBE contener: % VTA, Prioridad
 */
export const validarStock = (data) => {
  if (!data || data.length < 2) {
    return {
      valido: false,
      error: 'El archivo está vacío o no tiene suficientes filas'
    };
  }

  const headers = data[0];

  // Verificar que tenga al menos las columnas básicas
  if (headers.length < 4) {
    return {
      valido: false,
      error: 'El archivo debe tener al menos 4 columnas (SKU, Talle, Color, y al menos un Local)'
    };
  }

  const headersLower = headers.map(h => h.toLowerCase().trim());

  // VALIDACIÓN ESTRICTA: Detectar si NO es un archivo de stock
  const tieneVTA = headersLower.some(h => h.includes('vta') || h.includes('venta') || (h.includes('%') && !h.includes('desc')));
  const tienePrioridad = headersLower.some(h => h.includes('prioridad') || h.includes('priority'));

  if (tieneVTA && !tienePrioridad) {
    return {
      valido: false,
      error: '❌ Este archivo parece ser de PARTICIPACIÓN (contiene columna "% VTA"). Por favor súbelo en la sección de Participación, no en Stock.'
    };
  }

  if (tienePrioridad) {
    return {
      valido: false,
      error: '❌ Este archivo parece ser de PRIORIDAD (contiene columna "Prioridad"). Por favor súbelo en la sección de Prioridad, no en Stock.'
    };
  }

  // Verificar columnas requeridas para STOCK
  const tieneSKU = headersLower.some(h => h.includes('sku') || h.includes('producto') || h.includes('codigo'));
  const tieneTalle = headersLower.some(h => h.includes('talle') || h.includes('size') || h.includes('talla'));
  const tieneColor = headersLower.some(h => h.includes('color'));

  const columnasFaltantes = [];
  if (!tieneSKU) columnasFaltantes.push('SKU/Producto');
  if (!tieneTalle) columnasFaltantes.push('Talle');
  if (!tieneColor) columnasFaltantes.push('Color');

  if (columnasFaltantes.length > 0) {
    return {
      valido: false,
      error: `Columnas faltantes para archivo de STOCK: ${columnasFaltantes.join(', ')}. El formato debe ser: SKU, Talle, Color, Local1, Local2, ...`
    };
  }

  // Verificar que haya al menos un local (columna después de SKU, Talle, Color)
  const skuIndex = headersLower.findIndex(h => h.includes('sku') || h.includes('producto') || h.includes('codigo'));
  const talleIndex = headersLower.findIndex(h => h.includes('talle') || h.includes('size'));
  const colorIndex = headersLower.findIndex(h => h.includes('color'));

  const lastRequiredIndex = Math.max(skuIndex, talleIndex, colorIndex);
  const locales = headers.slice(lastRequiredIndex + 1);

  if (locales.length === 0) {
    return {
      valido: false,
      error: 'El archivo de Stock debe incluir al menos una columna de Local después de SKU, Talle y Color'
    };
  }

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
    mensaje: `✅ Archivo de Stock válido: ${filasConDatos} filas de productos, ${locales.length} locales detectados`,
    locales: locales,
    filas: filasConDatos
  };
};

/**
 * Valida que el archivo de participación tenga el formato correcto Y SOLO sea participación
 * Formato esperado: Local, % VTA
 * NO DEBE contener: SKU, Talle, Color, Prioridad
 */
export const validarParticipacion = (data) => {
  if (!data || data.length < 2) {
    return {
      valido: false,
      error: 'El archivo está vacío o no tiene suficientes filas'
    };
  }

  const headers = data[0];

  // Verificar que tenga al menos 2 columnas
  if (headers.length < 2) {
    return {
      valido: false,
      error: 'El archivo debe tener al menos 2 columnas (Local, % VTA)'
    };
  }

  const headersLower = headers.map(h => h.toLowerCase().trim());

  // VALIDACIÓN ESTRICTA: Detectar si NO es un archivo de participación
  const tieneSKU = headersLower.some(h => h.includes('sku') || h.includes('producto') || h.includes('codigo'));
  const tieneTalle = headersLower.some(h => h.includes('talle') || h.includes('size'));
  const tieneColor = headersLower.some(h => h.includes('color'));
  const tienePrioridad = headersLower.some(h => h.includes('prioridad') || h.includes('priority'));

  if (tieneSKU && tieneTalle && tieneColor) {
    return {
      valido: false,
      error: '❌ Este archivo parece ser de STOCK (contiene columnas SKU, Talle, Color). Por favor súbelo en la sección de Stock, no en Participación.'
    };
  }

  if (tieneSKU && tienePrioridad) {
    return {
      valido: false,
      error: '❌ Este archivo parece ser de PRIORIDAD (contiene columnas SKU, Prioridad). Por favor súbelo en la sección de Prioridad, no en Participación.'
    };
  }

  // Verificar columnas requeridas para PARTICIPACIÓN
  const tieneLocal = headersLower.some(h =>
    h.includes('local') || h.includes('tienda') || h.includes('sucursal')
  );

  const tieneVenta = headersLower.some(h =>
    h.includes('vta') || h.includes('venta') || h.includes('participacion') ||
    (h.includes('%') && (h.includes('vta') || h.includes('venta') || h.includes('participacion')))
  );

  if (!tieneLocal) {
    return {
      valido: false,
      error: 'Falta columna "Local" en el archivo de PARTICIPACIÓN. El formato debe ser: Local, % VTA'
    };
  }

  if (!tieneVenta) {
    return {
      valido: false,
      error: 'Falta columna "% VTA" en el archivo de PARTICIPACIÓN. El formato debe ser: Local, % VTA'
    };
  }

  // VALIDACIÓN ADICIONAL: No debe tener más de 3 columnas (para evitar confusion con stock)
  if (headers.length > 3) {
    return {
      valido: false,
      error: 'El archivo de PARTICIPACIÓN debe tener solo 2-3 columnas (Local, % VTA). Este archivo tiene demasiadas columnas. ¿Es un archivo de Stock?'
    };
  }

  // Verificar que las filas tengan datos
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

  // Advertencia si la suma no es ~100%
  const mensaje = `✅ Archivo de Participación válido: ${filasConDatos} locales detectados`;
  const advertencia = Math.abs(sumaParticipacion - 100) > 5
    ? ` ⚠️ (Advertencia: La suma de participaciones es ${sumaParticipacion.toFixed(1)}%, debería ser cercana a 100%)`
    : '';

  return {
    valido: true,
    mensaje: mensaje + advertencia,
    locales: filasConDatos,
    sumaParticipacion
  };
};

/**
 * Valida que el archivo de prioridad tenga el formato correcto Y SOLO sea prioridad
 * Formato esperado: SKU, Prioridad, Capacidad, Categoria
 * NO DEBE contener: Talle, Color, % VTA
 */
export const validarPrioridad = (data) => {
  if (!data || data.length < 2) {
    return {
      valido: false,
      error: 'El archivo está vacío o no tiene suficientes filas'
    };
  }

  const headers = data[0];

  // Verificar que tenga al menos las columnas básicas
  if (headers.length < 2) {
    return {
      valido: false,
      error: 'El archivo debe tener al menos 2 columnas (SKU, Prioridad, [Capacidad], [Categoria])'
    };
  }

  const headersLower = headers.map(h => h.toLowerCase().trim());

  // VALIDACIÓN ESTRICTA: Detectar si NO es un archivo de prioridad
  const tieneTalle = headersLower.some(h => h.includes('talle') || h.includes('size'));
  const tieneColor = headersLower.some(h => h.includes('color'));
  const tieneVTA = headersLower.some(h => h.includes('vta') || h.includes('venta'));

  if (tieneTalle && tieneColor) {
    return {
      valido: false,
      error: '❌ Este archivo parece ser de STOCK (contiene columnas Talle, Color). Por favor súbelo en la sección de Stock, no en Prioridad.'
    };
  }

  if (tieneVTA) {
    return {
      valido: false,
      error: '❌ Este archivo parece ser de PARTICIPACIÓN (contiene columna "% VTA"). Por favor súbelo en la sección de Participación, no en Prioridad.'
    };
  }

  // Verificar columnas requeridas para PRIORIDAD
  const tieneSKU = headersLower.some(h =>
    h.includes('sku') || h.includes('producto') || h.includes('codigo')
  );

  const tienePrioridad = headersLower.some(h =>
    h.includes('prioridad') || h.includes('priority')
  );

  if (!tieneSKU) {
    return {
      valido: false,
      error: 'Falta columna "SKU" en el archivo de PRIORIDAD. El formato debe ser: SKU, Prioridad, Capacidad, Categoria'
    };
  }

  if (!tienePrioridad) {
    return {
      valido: false,
      error: 'Falta columna "Prioridad" en el archivo de PRIORIDAD. El formato debe ser: SKU, Prioridad, Capacidad, Categoria'
    };
  }

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

  // Verificar columnas opcionales
  const hasCapacidad = headersLower.some(h => h.includes('capacidad'));
  const hasCategoria = headersLower.some(h => h.includes('categoria') || h.includes('category'));

  const opcionalesFaltantes = [];
  if (!hasCapacidad) opcionalesFaltantes.push('Capacidad');
  if (!hasCategoria) opcionalesFaltantes.push('Categoria');

  let mensaje = `✅ Archivo de Prioridad válido: ${filasConDatos} productos detectados`;
  if (opcionalesFaltantes.length > 0) {
    mensaje += ` ℹ️ (Columnas opcionales faltantes: ${opcionalesFaltantes.join(', ')})`;
  }

  return {
    valido: true,
    mensaje,
    productos: filasConDatos
  };
};

/**
 * Función principal de validación que delega al validador específico
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
