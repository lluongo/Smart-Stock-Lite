/**
 * Validación ULTRA ESTRICTA de formatos de archivos CSV
 * Validaciones específicas para las columnas del cliente
 */

/**
 * Valida archivo de STOCK
 * Columnas requeridas: Coddep, Deposito, Color, NombreColor, Medida, Cantidad, TIPOLOGIA, ORIGEN, TEMPORADA
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

  // ========== VALIDACIÓN: RECHAZAR si es de OTRO tipo ==========

  // Si tiene "sucursal" o "participacion", ES DE PARTICIPACIÓN
  const tieneSucursal = headersLower.some(h => h.includes('sucursal'));
  const tieneParticipacion = headersLower.some(h => h.includes('participacion') && !h.includes('coddep'));

  if (tieneSucursal && tieneParticipacion) {
    return {
      valido: false,
      error: '🚫 ARCHIVO INCORRECTO: Este archivo es de PARTICIPACIÓN (contiene "sucursal" y "participacion"). Súbelo en la sección "Participación", NO en "Stock".'
    };
  }

  // Si tiene "prioridad" Y "tipologia" (sin otras columnas de stock), ES DE PRIORIDAD
  const tienePrioridad = headersLower.some(h => h.includes('prioridad'));
  const tieneTipologiaSola = headersLower.some(h => h.includes('tipologia') || h.includes('tipología'));

  if (tienePrioridad && tieneTipologiaSola && headers.length <= 3) {
    return {
      valido: false,
      error: '🚫 ARCHIVO INCORRECTO: Este archivo es de PRIORIDAD (contiene "prioridad" y "tipologia"). Súbelo en la sección "Prioridad", NO en "Stock".'
    };
  }

  // ========== VALIDAR columnas REQUERIDAS para STOCK ==========

  const columnasRequeridas = {
    coddep: headersLower.some(h => h.includes('coddep') || h.includes('cod dep')),
    deposito: headersLower.some(h => h.includes('deposito') || h.includes('depósito')),
    color: headersLower.some(h => h === 'color' || h === 'cod_color'),
    nombreColor: headersLower.some(h => h.includes('nombrecolor') || h.includes('nombre color') || h.includes('nom_color')),
    medida: headersLower.some(h => h.includes('medida') || h.includes('talle') || h.includes('size')),
    cantidad: headersLower.some(h => h.includes('cantidad') || h.includes('stock') || h.includes('qty')),
    tipologia: headersLower.some(h => h.includes('tipologia') || h.includes('tipología') || h.includes('tipo')),
    origen: headersLower.some(h => h.includes('origen')),
    temporada: headersLower.some(h => h.includes('temporada'))
  };

  const columnasFaltantes = [];

  if (!columnasRequeridas.coddep) columnasFaltantes.push('Coddep');
  if (!columnasRequeridas.deposito) columnasFaltantes.push('Deposito');
  if (!columnasRequeridas.color) columnasFaltantes.push('Color');
  if (!columnasRequeridas.nombreColor) columnasFaltantes.push('NombreColor');
  if (!columnasRequeridas.medida) columnasFaltantes.push('Medida');
  if (!columnasRequeridas.cantidad) columnasFaltantes.push('Cantidad');
  if (!columnasRequeridas.tipologia) columnasFaltantes.push('TIPOLOGIA');
  if (!columnasRequeridas.origen) columnasFaltantes.push('ORIGEN');
  if (!columnasRequeridas.temporada) columnasFaltantes.push('TEMPORADA');

  if (columnasFaltantes.length > 0) {
    return {
      valido: false,
      error: `El archivo de STOCK requiere las columnas: ${columnasFaltantes.join(', ')}.\n\nFormato esperado: Coddep, Deposito, Color, NombreColor, Medida, Cantidad, TIPOLOGIA, ORIGEN, TEMPORADA`
    };
  }

  // Verificar que tenga datos
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
    mensaje: `✅ Archivo de Stock válido: ${filasConDatos} productos detectados`,
    filas: filasConDatos
  };
};

/**
 * Valida archivo de PARTICIPACIÓN
 * Columnas requeridas: sucursal, participacion
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

  // ========== VALIDACIÓN: RECHAZAR si es de OTRO tipo ==========

  // Si tiene columnas de STOCK, rechazar
  const tieneCoddep = headersLower.some(h => h.includes('coddep'));
  const tieneDeposito = headersLower.some(h => h.includes('deposito') || h.includes('depósito'));
  const tieneMedida = headersLower.some(h => h.includes('medida') || h.includes('talle'));
  const tieneTipologia = headersLower.some(h => h.includes('tipologia') || h.includes('tipología'));

  if (tieneCoddep || tieneDeposito || tieneMedida || tieneTipologia) {
    return {
      valido: false,
      error: '🚫 ARCHIVO INCORRECTO: Este archivo es de STOCK (contiene columnas como Coddep, Deposito, Medida, etc.). Súbelo en la sección "Stock", NO en "Participación".'
    };
  }

  // Si tiene "prioridad" Y "tipologia", ES DE PRIORIDAD
  const tienePrioridad = headersLower.some(h => h.includes('prioridad'));

  if (tienePrioridad && tieneTipologia) {
    return {
      valido: false,
      error: '🚫 ARCHIVO INCORRECTO: Este archivo es de PRIORIDAD (contiene "prioridad" y "tipologia"). Súbelo en la sección "Prioridad", NO en "Participación".'
    };
  }

  // VALIDACIÓN ADICIONAL: Debe tener SOLO 2 columnas
  if (headers.length > 3) {
    return {
      valido: false,
      error: '🚫 ARCHIVO INCORRECTO: El archivo de Participación debe tener solo 2 columnas (sucursal, participacion). Este archivo tiene demasiadas columnas. ¿Es un archivo de Stock?'
    };
  }

  // ========== VALIDAR columnas REQUERIDAS para PARTICIPACIÓN ==========

  const tieneSucursal = headersLower.some(h =>
    h === 'sucursal' || h.includes('sucursal')
  );

  const tieneParticipacion = headersLower.some(h =>
    h === 'participacion' || h === 'participación' || h.includes('participac')
  );

  if (!tieneSucursal) {
    return {
      valido: false,
      error: 'El archivo de PARTICIPACIÓN requiere la columna "sucursal".\n\nFormato esperado: sucursal, participacion'
    };
  }

  if (!tieneParticipacion) {
    return {
      valido: false,
      error: 'El archivo de PARTICIPACIÓN requiere la columna "participacion".\n\nFormato esperado: sucursal, participacion'
    };
  }

  // Verificar datos y sumar participación
  let filasConDatos = 0;
  let sumaParticipacion = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row.length >= 2 && row[0]) {
      filasConDatos++;
      let participacion = parseFloat(row[1]);
      if (!isNaN(participacion)) {
        // Convertir a porcentaje si viene en decimal (0.25 → 25)
        if (participacion < 1 && participacion > 0) {
          participacion = participacion * 100;
        }
        sumaParticipacion += participacion;
      }
    }
  }

  if (filasConDatos === 0) {
    return {
      valido: false,
      error: 'El archivo no contiene datos de sucursales'
    };
  }

  // VALIDACIÓN ESTRICTA: Rechazar si no suma 100% (tolerancia ±0.5%)
  if (Math.abs(sumaParticipacion - 100) > 0.5) {
    return {
      valido: false,
      error: `❌ ARCHIVO RECHAZADO: Los porcentajes deben sumar 100%.\n\nSuma actual: ${sumaParticipacion.toFixed(2)}%\nDiferencia: ${(sumaParticipacion - 100).toFixed(2)}%\n\n` +
             `Por favor ajusta los valores de participación para que sumen exactamente 100%.`
    };
  }

  return {
    valido: true,
    mensaje: `✅ Archivo de Participación válido: ${filasConDatos} registros - Suma: ${sumaParticipacion.toFixed(2)}%`,
    filas: filasConDatos,
    sumaParticipacion
  };
};

/**
 * Valida archivo de PRIORIDAD
 * Columnas requeridas: prioridad, tipologia
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

  // ========== VALIDACIÓN: RECHAZAR si es de OTRO tipo ==========

  // Si tiene columnas de STOCK (con más columnas), rechazar
  const tieneCoddep = headersLower.some(h => h.includes('coddep'));
  const tieneDeposito = headersLower.some(h => h.includes('deposito') || h.includes('depósito'));
  const tieneMedida = headersLower.some(h => h.includes('medida') || h.includes('talle'));
  const tieneColor = headersLower.some(h => h === 'color');

  if (tieneCoddep || tieneDeposito || tieneMedida || tieneColor) {
    return {
      valido: false,
      error: '🚫 ARCHIVO INCORRECTO: Este archivo es de STOCK (contiene columnas como Coddep, Deposito, Medida, Color, etc.). Súbelo en la sección "Stock", NO en "Prioridad".'
    };
  }

  // Si tiene "sucursal" o "participacion", ES DE PARTICIPACIÓN
  const tieneSucursal = headersLower.some(h => h.includes('sucursal'));
  const tieneParticipacion = headersLower.some(h => h === 'participacion' || h === 'participación');

  if (tieneSucursal && tieneParticipacion) {
    return {
      valido: false,
      error: '🚫 ARCHIVO INCORRECTO: Este archivo es de PARTICIPACIÓN (contiene "sucursal" y "participacion"). Súbelo en la sección "Participación", NO en "Prioridad".'
    };
  }

  // ========== VALIDAR columnas REQUERIDAS para PRIORIDAD ==========

  const tienePrioridad = headersLower.some(h =>
    h === 'prioridad' || h.includes('priorid')
  );

  const tieneTipologia = headersLower.some(h =>
    h === 'tipologia' || h === 'tipología' || h.includes('tipolog')
  );

  if (!tienePrioridad) {
    return {
      valido: false,
      error: 'El archivo de PRIORIDAD requiere la columna "prioridad".\n\nFormato esperado: prioridad, tipologia'
    };
  }

  if (!tieneTipologia) {
    return {
      valido: false,
      error: 'El archivo de PRIORIDAD requiere la columna "tipologia".\n\nFormato esperado: prioridad, tipologia'
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
      error: 'El archivo no contiene datos de tipologías'
    };
  }

  return {
    valido: true,
    mensaje: `✅ Archivo de Prioridad válido: ${filasConDatos} tipologías detectadas`,
    productos: filasConDatos
  };
};

/**
 * Valida archivo de DISTRIBUCIÓN AUTOMÁTICA
 * Estructura requerida:
 * - Col A: talle
 * - Col B: color
 * - Col C: cantidad_total
 * - Fila 6: porcentajes de distribución por tienda
 * - Columnas D+: nombres de tiendas
 */
export const validarDistribucionAuto = (data) => {
  if (!data || data.length < 7) {
    return {
      valido: false,
      error: 'El archivo debe tener al menos 7 filas (encabezados + fila de porcentajes + productos)'
    };
  }

  // Verificar que haya al menos 3 columnas (talle, color, cantidad_total)
  const primeraFila = data[0];
  if (!primeraFila || primeraFila.length < 3) {
    return {
      valido: false,
      error: 'El archivo debe tener al menos 3 columnas (talle, color, cantidad_total)'
    };
  }

  // Verificar que la fila 6 (índice 5) exista
  const fila6 = data[5];
  if (!fila6 || fila6.length < 4) {
    return {
      valido: false,
      error: 'La fila 6 debe contener los porcentajes de distribución por tienda (al menos 1 tienda)'
    };
  }

  // Verificar que haya al menos un porcentaje válido en la fila 6 (desde columna D = índice 3)
  let tienePorcentajes = false;
  for (let i = 3; i < fila6.length; i++) {
    const valor = parseFloat(fila6[i]);
    if (!isNaN(valor) && valor > 0) {
      tienePorcentajes = true;
      break;
    }
  }

  if (!tienePorcentajes) {
    return {
      valido: false,
      error: 'La fila 6 debe contener al menos un porcentaje válido (columnas D en adelante)'
    };
  }

  // Validación básica pasada
  return {
    valido: true,
    mensaje: `✅ Archivo válido con ${data.length - 6} productos. La validación completa se realizará al procesar.`
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
    case 'distribucionAuto':
      return validarDistribucionAuto(data);
    default:
      return {
        valido: false,
        error: 'Tipo de archivo desconocido'
      };
  }
};
