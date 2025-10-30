/**
 * Script de prueba para verificar la corrección de distribución
 * Prueba el caso: ECOMMERCE con stock inicial y 10% de participación
 */

import fs from 'fs';
import Papa from 'papaparse';
import { generarDistribucionAutomatica } from './src/services/distributionServiceV2.js';

// Función para cargar CSV
function cargarCSV(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const result = Papa.parse(content, { header: false });
  return result.data;
}

// Cargar datos de prueba
console.log('📂 Cargando datos de prueba...\n');

const stockData = cargarCSV('./test_data/stock_test.csv');
const participacionData = cargarCSV('./test_data/participacion_test.csv');
const prioridadData = cargarCSV('./test_data/prioridad_test.csv');

console.log(`✅ Stock: ${stockData.length - 1} registros`);
console.log(`✅ Participación: ${participacionData.length - 1} sucursales`);
console.log(`✅ Prioridad: ${prioridadData.length - 1} tipologías\n`);

// Ejecutar distribución
console.log('🔄 Ejecutando distribución...\n');

try {
  const resultado = generarDistribucionAutomatica(stockData, participacionData, prioridadData);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 RESULTADOS DE LA DISTRIBUCIÓN');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Check Sum
  console.log('✅ CHECK SUM:');
  console.log(`   Total Original: ${resultado.checkSum.totalOriginal} unidades`);
  console.log(`   Total Distribuido: ${resultado.checkSum.totalDistribuido} unidades`);
  console.log(`   Diferencia: ${resultado.checkSum.diferencia}`);
  console.log(`   Válido: ${resultado.checkSum.esValido ? '✅ SÍ' : '❌ NO'}\n`);

  // Resumen por sucursal
  console.log('📈 RESUMEN POR SUCURSAL:');
  console.log('───────────────────────────────────────────────────────────');
  console.log('Sucursal'.padEnd(20) + '| Total  | Esperado | Real    | Desviación');
  console.log('───────────────────────────────────────────────────────────');

  // Ordenar por participación esperada descendente
  const sucursalesOrdenadas = Object.entries(resultado.resumenSucursales)
    .sort((a, b) => b[1].participacionEsperada - a[1].participacionEsperada);

  sucursalesOrdenadas.forEach(([sucursal, datos]) => {
    const desviacion = (parseFloat(datos.participacionReal) - datos.participacionEsperada).toFixed(2);
    const color = Math.abs(desviacion) < 0.5 ? '✅' : '⚠️';

    console.log(
      sucursal.padEnd(20) + '| ' +
      datos.totalUnidades.toString().padEnd(6) + ' | ' +
      datos.participacionEsperada.toFixed(2).padEnd(8) + ' | ' +
      datos.participacionReal.toString().padEnd(7) + ' | ' +
      color + ' ' + (desviacion > 0 ? '+' : '') + desviacion + '%'
    );
  });

  console.log('───────────────────────────────────────────────────────────\n');

  // Análisis específico de ECOMMERCE
  console.log('🎯 ANÁLISIS ESPECÍFICO DE ECOMMERCE:');
  console.log('───────────────────────────────────────────────────────────');

  const ecommerceResumen = resultado.resumenSucursales['ECOMMERCE'];
  if (ecommerceResumen) {
    console.log(`   Stock inicial (depósito): 75 unidades (30 JEANS + 45 REMERA)`);
    console.log(`   % Participación esperado: ${ecommerceResumen.participacionEsperada.toFixed(2)}%`);
    console.log(`   % Participación real: ${ecommerceResumen.participacionReal}%`);
    console.log(`   Total unidades finales: ${ecommerceResumen.totalUnidades}`);

    const desviacion = parseFloat(ecommerceResumen.participacionReal) - ecommerceResumen.participacionEsperada;
    if (Math.abs(desviacion) < 0.5) {
      console.log(`   ✅ CORRECTO: Desviación de ${desviacion.toFixed(2)}% (dentro del rango aceptable)`);
    } else {
      console.log(`   ❌ ERROR: Desviación de ${desviacion.toFixed(2)}% (fuera del rango aceptable)`);
    }
  } else {
    console.log('   ❌ ERROR: ECOMMERCE no aparece en el resumen');
  }

  console.log('───────────────────────────────────────────────────────────\n');

  // Transferencias
  console.log('📦 TRANSFERENCIAS GENERADAS:');
  console.log(`   Total: ${resultado.transferencias.length} movimientos\n`);

  if (resultado.transferencias.length > 0) {
    console.log('   Primeras 10 transferencias:');
    console.log('   ' + '─'.repeat(80));
    resultado.transferencias.slice(0, 10).forEach((t, idx) => {
      console.log(`   ${idx + 1}. ${t.sku} | ${t.origen} → ${t.destino} | ${t.unidades} uds | ${t.motivo}`);
    });

    // Contar transferencias desde/hacia ECOMMERCE
    const desdeEcommerce = resultado.transferencias.filter(t => t.origen === 'ECOMMERCE').length;
    const haciaEcommerce = resultado.transferencias.filter(t => t.destino === 'ECOMMERCE').length;

    console.log(`\n   Desde ECOMMERCE: ${desdeEcommerce} transferencias`);
    console.log(`   Hacia ECOMMERCE: ${haciaEcommerce} transferencias`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ PRUEBA COMPLETADA');
  console.log('═══════════════════════════════════════════════════════════\n');

} catch (error) {
  console.error('❌ ERROR al ejecutar distribución:', error.message);
  console.error(error.stack);
  process.exit(1);
}
