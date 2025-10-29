/**
 * Validación de formatos de archivos CSV
 * Asegura que los archivos subidos tengan la estructura correcta
 */

/**
 * Valida que el archivo de stock tenga el formato correcto
 * Formato esperado: SKU, Talle, Color, Local1, Local2, ...
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

  // Verificar columnas requeridas (case-insensitive)
  const headersLower = headers.map(h => h.toLowerCase().trim());
  const requiredColumns = ['sku', 'talle', 'color'];

  const missingColumns = requiredColumns.filter(col =>
    !headersLower.some(h => h.includes(col) || h.includes('producto'))
  );

  if (missingColumns.length > 0) {
    return {
      valido: false,
      error: `Columnas faltantes en el archivo de stock: ${missingColumns.join(', ')}. El formato debe ser: SKU, Talle, Color, Local1, Local2, ...`
    };
  }

  // Verificar que haya al menos un local (columna después de SKU, Talle, Color)
  const skuIndex = headersLower.findIndex(h => h.includes('sku') || h.includes('producto'));
  const talleIndex = headersLower.findIndex(h => h.includes('talle') || h.includes('size'));
  const colorIndex = headersLower.findIndex(h => h.includes('color'));

  const lastRequiredIndex = Math.max(skuIndex, talleIndex, colorIndex);
  const hasLocales = headers.length > lastRequiredIndex + 1;

  if (!hasLocales) {
    return {
      valido: false,
      error: 'El archivo de stock debe incluir al menos una columna de Local después de SKU, Talle y Color'
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
    mensaje: `Archivo válido: ${filasConDatos} filas de productos detectadas`,
    locales: headers.slice(lastRequiredIndex + 1),
    filas: filasConDatos
  };
};

/**
 * Valida que el archivo de participación tenga el formato correcto
 * Formato esperado: Local, % VTA
 */
export const validarParticipacion = (data) => {
  if (!data || data.length < 2) {
    return {
      valido: false,
      error: 'El archivo está vacío o no tiene suficientes filas'
    };
  }

  const headers = data[0];

  // Verificar que tenga exactamente 2 columnas o al menos las requeridas
  if (headers.length < 2) {
    return {
      valido: false,
      error: 'El archivo debe tener al menos 2 columnas (Local, % VTA)'
    };
  }

  // Verificar columnas requeridas (case-insensitive)
  const headersLower = headers.map(h => h.toLowerCase().trim());

  const hasLocal = headersLower.some(h =>
    h.includes('local') || h.includes('tienda') || h.includes('sucursal')
  );

  const hasVenta = headersLower.some(h =>
    h.includes('vta') || h.includes('venta') || h.includes('participacion') || h.includes('%')
  );

  if (!hasLocal) {
    return {
      valido: false,
      error: 'Falta columna "Local" en el archivo de participación. El formato debe ser: Local, % VTA'
    };
  }

  if (!hasVenta) {
    return {
      valido: false,
      error: 'Falta columna "% VTA" en el archivo de participación. El formato debe ser: Local, % VTA'
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
  const mensaje = `Archivo válido: ${filasConDatos} locales detectados`;
  const advertencia = Math.abs(sumaParticipacion - 100) > 5
    ? ` (Advertencia: La suma de participaciones es ${sumaParticipacion.toFixed(1)}%, debería ser cercana a 100%)`
    : '';

  return {
    valido: true,
    mensaje: mensaje + advertencia,
    locales: filasConDatos,
    sumaParticipacion
  };
};

/**
 * Valida que el archivo de prioridad tenga el formato correcto
 * Formato esperado: SKU, Prioridad, Capacidad, Categoria
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
      error: 'El archivo debe tener al menos 2 columnas (SKU, Prioridad, Capacidad, Categoria)'
    };
  }

  // Verificar columnas requeridas (case-insensitive)
  const headersLower = headers.map(h => h.toLowerCase().trim());

  const hasSKU = headersLower.some(h =>
    h.includes('sku') || h.includes('producto') || h.includes('codigo')
  );

  const hasPrioridad = headersLower.some(h =>
    h.includes('prioridad') || h.includes('priority')
  );

  if (!hasSKU) {
    return {
      valido: false,
      error: 'Falta columna "SKU" en el archivo de prioridad. El formato debe ser: SKU, Prioridad, Capacidad, Categoria'
    };
  }

  if (!hasPrioridad) {
    return {
      valido: false,
      error: 'Falta columna "Prioridad" en el archivo de prioridad. El formato debe ser: SKU, Prioridad, Capacidad, Categoria'
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

  let mensaje = `Archivo válido: ${filasConDatos} productos detectados`;
  if (opcionalesFaltantes.length > 0) {
    mensaje += ` (Columnas opcionales faltantes: ${opcionalesFaltantes.join(', ')})`;
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
