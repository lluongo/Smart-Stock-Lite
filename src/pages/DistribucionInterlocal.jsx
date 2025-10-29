import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import {
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Download,
  BarChart3,
  ArrowRight,
  RefreshCw,
  Circle
} from 'lucide-react';
import {
  calcularDistribucionOptima,
  generarEstadisticas,
  analizarCurvasPorLocal,
  parsearStockData
} from '../services/distributionEngine';
import {
  exportarMovimientosXLS,
  exportarAnalisisCurvasXLS,
  exportarDashboardCompletoXLS
} from '../services/xlsExport';

const DistribucionInterlocal = () => {
  const navigate = useNavigate();
  const { stockData, participacionData, prioridadData } = useApp();

  const [movimientos, setMovimientos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [analisisCurvas, setAnalisisCurvas] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Calcular distribución al cargar la página
  useEffect(() => {
    if (stockData.length > 0 && participacionData.length > 0) {
      calcularDistribucion();
    }
  }, [stockData, participacionData, prioridadData]);

  const calcularDistribucion = () => {
    setCargando(true);
    setError(null);

    try {
      // Validar datos
      if (!stockData || stockData.length < 2) {
        throw new Error('No hay datos de stock cargados. Por favor, carga los archivos en "Cargar Datos".');
      }

      if (!participacionData || participacionData.length < 2) {
        throw new Error('No hay datos de participación cargados.');
      }

      // Calcular distribución
      const movimientosCalculados = calcularDistribucionOptima(
        stockData,
        participacionData,
        prioridadData
      );

      // Análisis de curvas
      const productosData = parsearStockData(stockData);
      const analisis = analizarCurvasPorLocal(productosData);

      // Generar estadísticas
      const stats = generarEstadisticas(movimientosCalculados, analisis);

      setMovimientos(movimientosCalculados);
      setAnalisisCurvas(analisis);
      setEstadisticas(stats);
    } catch (err) {
      setError(err.message);
      console.error('Error al calcular distribución:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleExportarMovimientos = () => {
    if (movimientos.length === 0) {
      alert('No hay movimientos para exportar');
      return;
    }
    exportarMovimientosXLS(movimientos);
  };

  const handleExportarAnalisisCurvas = () => {
    if (!analisisCurvas) {
      alert('No hay análisis de curvas para exportar');
      return;
    }
    exportarAnalisisCurvasXLS(analisisCurvas);
  };

  const handleExportarDashboardCompleto = () => {
    if (!movimientos || !analisisCurvas || !estadisticas) {
      alert('Datos incompletos para exportar');
      return;
    }
    exportarDashboardCompletoXLS(movimientos, analisisCurvas, estadisticas);
  };

  // Si no hay datos cargados
  if (stockData.length === 0 || participacionData.length === 0) {
    return (
      <div className="p-6">
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                Datos no cargados
              </h3>
              <p className="text-yellow-700 mb-4">
                Para usar el motor de distribución inter-local, primero debes cargar los datos de stock y participación.
              </p>
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
            Distribución Inter-local
          </h1>
          <p className="text-gray-500 mt-1">
            Motor de optimización para redistribución de mercadería entre locales
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

      {/* Estadísticas principales */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card bg-primary-50 border-primary-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-600 font-medium">
                  Movimientos Propuestos
                </p>
                <p className="text-3xl font-bold text-primary-700 mt-1">
                  {estadisticas.totalMovimientos}
                </p>
              </div>
              <Package className="w-10 h-10 text-primary-400" />
            </div>
          </div>

          <div className="card bg-secondary-50 border-secondary-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 font-medium">
                  Unidades a Mover
                </p>
                <p className="text-3xl font-bold text-secondary-700 mt-1">
                  {estadisticas.unidadesTotales}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-secondary-400" />
            </div>
          </div>

          <div className="card bg-green-50 border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Curvas Completas
                </p>
                <p className="text-3xl font-bold text-green-700 mt-1">
                  {estadisticas.curvasCompletasAntes}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </div>

          <div className="card bg-red-50 border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Curvas Rotas</p>
                <p className="text-3xl font-bold text-red-700 mt-1">
                  {estadisticas.curvasRotasAntes}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
          </div>
        </div>
      )}

      {/* Resumen por motivo y prioridad */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Movimientos por Motivo
            </h2>
            <div className="space-y-3">
              {Object.entries(estadisticas.porMotivo || {}).map(([motivo, cantidad]) => (
                <div
                  key={motivo}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-700">{motivo}</span>
                  <span className="text-lg font-bold text-gray-900">{cantidad}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Movimientos por Prioridad
            </h2>
            <div className="space-y-3">
              {Object.entries(estadisticas.porPrioridad || {}).map(([prioridad, cantidad]) => {
                const colorClass = {
                  alta: 'bg-red-50 text-red-700',
                  media: 'bg-yellow-50 text-yellow-700',
                  baja: 'bg-green-50 text-green-700'
                }[prioridad] || 'bg-gray-50 text-gray-700';

                return (
                  <div
                    key={prioridad}
                    className={`flex items-center justify-between p-3 rounded-lg ${colorClass}`}
                  >
                    <span className="text-sm font-medium capitalize">{prioridad}</span>
                    <span className="text-lg font-bold">{cantidad}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Análisis de Curvas con Semáforos */}
      {analisisCurvas && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Análisis de Curvas por Local
            </h2>
            <button
              onClick={handleExportarAnalisisCurvas}
              className="btn-secondary text-sm flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Análisis</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Local
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado Curva
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Completitud
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(analisisCurvas).flatMap(([productoKey, producto]) =>
                  Object.entries(producto.locales).map(([local, analisis]) => (
                    <tr key={`${productoKey}-${local}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {producto.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {producto.color}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {local}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Circle
                            className={`w-4 h-4 fill-current ${
                              analisis.completa
                                ? 'text-green-500'
                                : analisis.porcentaje >= 0.7
                                ? 'text-yellow-500'
                                : 'text-red-500'
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              analisis.completa
                                ? 'text-green-700'
                                : analisis.porcentaje >= 0.7
                                ? 'text-yellow-700'
                                : 'text-red-700'
                            }`}
                          >
                            {analisis.completa ? 'Completa' : 'Incompleta'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {analisis.tallesDisponibles}/{analisis.totalTalles} (
                        {(analisis.porcentaje * 100).toFixed(0)}%)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {analisis.totalStock}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla de Movimientos Inter-locales */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Movimientos Propuestos ({movimientos.length})
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={handleExportarMovimientos}
              disabled={movimientos.length === 0}
              className="btn-secondary text-sm flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Movimientos</span>
            </button>
          </div>
        </div>

        {movimientos.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              No se encontraron movimientos necesarios. La distribución actual es óptima.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Talle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Origen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movimientos.map((mov, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {mov.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {mov.talle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {mov.color}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {mov.origen}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{mov.destino}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {mov.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {mov.motivo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          mov.prioridad === 'alta'
                            ? 'bg-red-100 text-red-700'
                            : mov.prioridad === 'media'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {mov.prioridad}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {mov.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reglas de Negocio Aplicadas */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-3">
          Reglas de Negocio Aplicadas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span><strong>R1:</strong> Locales grandes solo mueven en sobrestock</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span><strong>R2:</strong> Sobrestock = +3 curvas o exceso de capacidad</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span><strong>R3:</strong> Distribución según % de ventas</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span><strong>R4:</strong> Prioridad a curvas completas</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span><strong>R5:</strong> Baja prioridad si no completa curva</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span><strong>R6:</strong> No romper curvas del donante</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span><strong>R7:</strong> Análisis por categoría y criticidad</span>
          </div>
        </div>
      </div>

      {/* Exportación completa */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleExportarDashboardCompleto}
          disabled={!movimientos || !analisisCurvas || !estadisticas}
          className="btn-primary flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Exportar Dashboard Completo (XLS)</span>
        </button>
      </div>
    </div>
  );
};

export default DistribucionInterlocal;
