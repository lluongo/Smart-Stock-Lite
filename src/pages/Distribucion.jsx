import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import {
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  BarChart3,
  Store,
  Package,
  TrendingUp,
  Info
} from 'lucide-react';
import {
  parsearArchivoDistribucion,
  generarDistribucionAutomatica,
  exportarDistribucionCSV
} from '../services/distributionService';

const Distribucion = () => {
  const navigate = useNavigate();
  const { distributionFileData } = useApp();

  const [distribucionDetallada, setDistribucionDetallada] = useState([]);
  const [resumenTiendas, setResumenTiendas] = useState(null);
  const [validacion, setValidacion] = useState(null);
  const [justificacion, setJustificacion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [datosParsed, setDatosParsed] = useState(null);

  // Calcular distribución al cargar datos
  useEffect(() => {
    if (distributionFileData && distributionFileData.length > 0) {
      calcularDistribucion();
    }
  }, [distributionFileData]);

  const calcularDistribucion = () => {
    setCargando(true);
    setError(null);

    try {
      // Validar datos
      if (!distributionFileData || distributionFileData.length < 7) {
        throw new Error('Archivo incompleto. Debe tener al menos 7 filas (encabezados + porcentajes + productos).');
      }

      // Parsear archivo
      const { productos, porcentajes, tiendas } = parsearArchivoDistribucion(distributionFileData);
      setDatosParsed({ productos, porcentajes, tiendas });

      // Generar distribución automática
      const resultado = generarDistribucionAutomatica(productos, porcentajes);

      setDistribucionDetallada(resultado.distribucionDetallada);
      setResumenTiendas(resultado.resumenTiendas);
      setValidacion(resultado.validacion);
      setJustificacion(resultado.justificacion);
    } catch (err) {
      setError(err.message);
      console.error('Error al calcular distribución:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleExportarCSV = () => {
    if (distribucionDetallada.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    exportarDistribucionCSV(distribucionDetallada);
  };

  // Si no hay datos cargados
  if (!distributionFileData || distributionFileData.length === 0) {
    return (
      <div className="p-6">
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                Archivo de distribución no cargado
              </h3>
              <p className="text-yellow-700 mb-4">
                Para usar la distribución automática, debes cargar un archivo con el siguiente formato:
              </p>
              <div className="bg-white p-4 rounded-lg border border-yellow-200 mb-4 text-sm">
                <p className="font-medium text-gray-900 mb-2">Estructura requerida:</p>
                <ul className="space-y-1 text-gray-700">
                  <li>• <strong>Columna A:</strong> talle (ej: 38, M, L)</li>
                  <li>• <strong>Columna B:</strong> color (ej: Azul, Rojo)</li>
                  <li>• <strong>Columna C:</strong> cantidad_total (unidades disponibles)</li>
                  <li>• <strong>Fila 6:</strong> porcentajes de distribución por tienda</li>
                  <li>• <strong>Columnas D+:</strong> cada columna representa una tienda</li>
                </ul>
                <p className="mt-3 text-xs text-gray-600">
                  ⚠️ Los porcentajes en la fila 6 deben sumar exactamente 100%
                </p>
              </div>
              <button
                onClick={() => navigate('/cargar-datos')}
                className="btn-primary"
              >
                Ir a Cargar Datos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Distribución Automática
          </h1>
          <p className="text-gray-500 mt-1">
            Algoritmo de Mayor Resto (Hamilton) - Sin stock sin asignar
          </p>
        </div>
        <button
          onClick={calcularDistribucion}
          disabled={cargando}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`w-5 h-5 ${cargando ? 'animate-spin' : ''}`} />
          <span>Recalcular</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-1">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Validación */}
      {validacion && (
        <div className={`card ${validacion.esValido ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start space-x-3">
            {validacion.esValido ? (
              <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
            )}
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-2 ${validacion.esValido ? 'text-green-900' : 'text-red-900'}`}>
                Validación de Consistencia
              </h3>
              <p className={validacion.esValido ? 'text-green-700' : 'text-red-700'}>
                {validacion.mensaje}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Original</p>
                  <p className="text-xl font-bold text-gray-900">{validacion.totalOriginal}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Distribuido</p>
                  <p className="text-xl font-bold text-gray-900">{validacion.totalDistribuido}</p>
                </div>
                <div>
                  <p className="text-gray-600">Diferencia</p>
                  <p className={`text-xl font-bold ${validacion.diferencia === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {validacion.diferencia}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas principales */}
      {datosParsed && resumenTiendas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-primary-50 border-primary-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-600 font-medium">
                  Total Productos
                </p>
                <p className="text-3xl font-bold text-primary-700 mt-1">
                  {datosParsed.productos.length}
                </p>
              </div>
              <Package className="w-10 h-10 text-primary-400" />
            </div>
          </div>

          <div className="card bg-secondary-50 border-secondary-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 font-medium">
                  Tiendas Destino
                </p>
                <p className="text-3xl font-bold text-secondary-700 mt-1">
                  {datosParsed.tiendas.length}
                </p>
              </div>
              <Store className="w-10 h-10 text-secondary-400" />
            </div>
          </div>

          <div className="card bg-green-50 border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Asignaciones
                </p>
                <p className="text-3xl font-bold text-green-700 mt-1">
                  {distribucionDetallada.length}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-400" />
            </div>
          </div>
        </div>
      )}

      {/* Resumen por Tienda */}
      {resumenTiendas && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Resumen por Tienda
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tienda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Unidades Asignadas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    % Esperado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    % Real
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Desviación
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(resumenTiendas).map(([tienda, datos]) => {
                  const desviacion = (parseFloat(datos.porcentajeReal) - datos.porcentajeEsperado).toFixed(2);
                  return (
                    <tr key={tienda} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tienda}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {datos.unidadesAsignadas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {datos.porcentajeEsperado.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {datos.porcentajeReal}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          Math.abs(desviacion) < 0.5 ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {desviacion > 0 ? '+' : ''}{desviacion}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Justificación */}
      {justificacion && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-2">
                Justificación de la Distribución
              </h3>
              <p className="text-blue-700 mb-3">
                {justificacion.explicacion}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-900">Total de productos procesados:</p>
                  <p className="text-blue-700">{justificacion.totalProductos}</p>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Productos con ajustes:</p>
                  <p className="text-blue-700">{justificacion.totalAjustes}</p>
                </div>
              </div>
              {justificacion.detalleAjustes.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-blue-900 mb-2">Detalle de ajustes por redondeo:</p>
                  <div className="bg-white p-3 rounded-lg border border-blue-200 max-h-40 overflow-y-auto">
                    {justificacion.detalleAjustes.map((ajuste, idx) => (
                      <div key={idx} className="text-xs text-gray-700 mb-1">
                        • {ajuste.talle} - {ajuste.color} (Total: {ajuste.cantidadTotal}, Ajustes: {ajuste.ajustes})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Distribución Detallada */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Distribución Detallada ({distribucionDetallada.length} asignaciones)
          </h2>
          <button
            onClick={handleExportarCSV}
            disabled={distribucionDetallada.length === 0}
            className="btn-secondary text-sm flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>

        {distribucionDetallada.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              No hay datos para mostrar. Carga un archivo de distribución.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Talle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tienda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Unidades Asignadas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cuota Exacta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Residuo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {distribucionDetallada.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.talle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.color}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.tienda}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {item.unidadesAsignadas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.cuotaExacta}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.residuo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Algoritmo Info */}
      <div className="card bg-gray-50 border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 mb-2">
          Algoritmo de Mayor Resto (Hamilton)
        </h3>
        <p className="text-xs text-gray-700">
          Este algoritmo garantiza que todas las unidades sean distribuidas sin dejar residuo.
          Primero asigna la parte entera de cada cuota, y luego distribuye las unidades restantes
          a las tiendas con mayor residuo decimal, asegurando que la suma total coincida exactamente
          con el stock original.
        </p>
      </div>
    </div>
  );
};

export default Distribucion;
