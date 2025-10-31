import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import {
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  Package,
  Store,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Box
} from 'lucide-react';
import {
  generarDistribucionAutomatica,
  exportarDistribucionCompleta,
  exportarDistribucionCSV
} from '../services/distributionServiceV2';

const Distribucion = () => {
  const navigate = useNavigate();
  const { stockData, participacionData, prioridadData, distributionData, setDistributionData } = useApp();

  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [tabActiva, setTabActiva] = useState('distribucion'); // distribucion, resumen, analisis, stock

  // Estados de paginación
  const [paginaDistribucion, setPaginaDistribucion] = useState(1);
  const [registrosPorPaginaDistribucion, setRegistrosPorPaginaDistribucion] = useState(10);

  // Estado para controlar locales expandidos
  const [localesExpandidos, setLocalesExpandidos] = useState({});

  // Cargar datos del contexto al montar el componente
  useEffect(() => {
    if (distributionData && Object.keys(distributionData).length > 0) {
      setResultado(distributionData);
    }
  }, []);

  // Calcular distribución al cargar datos
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
        throw new Error('No hay datos de stock cargados. Por favor, carga el archivo de Stock en "Cargar Datos".');
      }

      if (!participacionData || participacionData.length < 2) {
        throw new Error('No hay datos de participación cargados. Por favor, carga el archivo de Participación en "Cargar Datos".');
      }

      // Generar distribución
      const result = generarDistribucionAutomatica(
        stockData,
        participacionData,
        prioridadData || []
      );

      setResultado(result);
      // Guardar en el contexto global para que el Dashboard pueda acceder
      setDistributionData(result);
    } catch (err) {
      setError(err.message);
      console.error('Error al calcular distribución:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleExportarExcel = () => {
    if (!resultado) {
      alert('No hay datos para exportar');
      return;
    }
    exportarDistribucionCompleta(resultado);
  };

  const handleExportarCSV = () => {
    if (!resultado || !resultado.distribucionDetallada) {
      alert('No hay datos para exportar');
      return;
    }
    exportarDistribucionCSV(resultado.distribucionDetallada);
  };

  // Funciones helper para paginación
  const getPaginatedData = (data, page, itemsPerPage) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (dataLength, itemsPerPage) => {
    return Math.ceil(dataLength / itemsPerPage);
  };

  const handlePageChange = (setPage, newPage, totalPages) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleItemsPerPageChange = (setPage, setItemsPerPage, value) => {
    setItemsPerPage(parseInt(value));
    setPage(1); // Reset to first page when changing items per page
  };

  // Función para expandir/colapsar locales
  const toggleLocal = (local) => {
    setLocalesExpandidos(prev => ({
      ...prev,
      [local]: !prev[local]
    }));
  };

  // Si no hay datos cargados
  if (!stockData || stockData.length === 0 || !participacionData || participacionData.length === 0) {
    return (
      <div className="p-6">
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                Archivos no cargados
              </h3>
              <p className="text-yellow-700 mb-4">
                Para usar la distribución automática, debes cargar los siguientes archivos:
              </p>
              <ul className="list-disc list-inside text-yellow-700 mb-4 space-y-1">
                <li><strong>Stock</strong> (obligatorio): Inventario disponible</li>
                <li><strong>Participación</strong> (obligatorio): % por sucursal</li>
                <li><strong>Prioridad</strong> (opcional): Ranking de productos</li>
              </ul>
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
            Distribución inteligente - Sin stock sin asignar
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={calcularDistribucion}
            disabled={cargando}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`w-5 h-5 ${cargando ? 'animate-spin' : ''}`} />
            <span>Recalcular</span>
          </button>
          <button
            onClick={handleExportarExcel}
            disabled={!resultado}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Exportar Excel (4 hojas)</span>
          </button>
        </div>
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

      {/* Check Sum Validación */}
      {resultado && resultado.checkSum && (
        <div className={`card ${resultado.checkSum.esValido ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start space-x-3">
            {resultado.checkSum.esValido ? (
              <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
            )}
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-2 ${resultado.checkSum.esValido ? 'text-green-900' : 'text-red-900'}`}>
                ✅ Validación de Distribución
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Original</p>
                  <p className="text-xl font-bold text-gray-900">{resultado.checkSum.totalOriginal}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Distribuido</p>
                  <p className="text-xl font-bold text-gray-900">{resultado.checkSum.totalDistribuido}</p>
                </div>
                <div>
                  <p className="text-gray-600">Diferencia</p>
                  <p className={`text-xl font-bold ${resultado.checkSum.diferencia === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {resultado.checkSum.diferencia}
                  </p>
                </div>
              </div>
              {resultado.checkSum.esValido && (
                <p className="text-green-700 mt-3">
                  ✅ 100% del stock asignado correctamente
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas principales */}
      {resultado && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card bg-primary-50 border-primary-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-600 font-medium">
                  Total Productos
                </p>
                <p className="text-3xl font-bold text-primary-700 mt-1">
                  {resultado.productos.length}
                </p>
              </div>
              <Package className="w-10 h-10 text-primary-400" />
            </div>
          </div>

          <div className="card bg-secondary-50 border-secondary-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 font-medium">
                  Sucursales
                </p>
                <p className="text-3xl font-bold text-secondary-700 mt-1">
                  {resultado.sucursales.length}
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
                  {resultado.distribucionDetallada.length}
                </p>
              </div>
              <Activity className="w-10 h-10 text-green-400" />
            </div>
          </div>

          <div className="card bg-blue-50 border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Transferencias
                </p>
                <p className="text-3xl font-bold text-blue-700 mt-1">
                  {resultado.transferencias.length}
                </p>
              </div>
              <Activity className="w-10 h-10 text-blue-400" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {resultado && (
        <div className="card">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setTabActiva('distribucion')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tabActiva === 'distribucion'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Distribución Final
              </button>
              <button
                onClick={() => setTabActiva('resumen')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tabActiva === 'resumen'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Store className="w-4 h-4 inline mr-2" />
                Resumen Sucursales
              </button>
              <button
                onClick={() => setTabActiva('analisis')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tabActiva === 'analisis'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Análisis por Local
              </button>
              <button
                onClick={() => setTabActiva('stock')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tabActiva === 'stock'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Box className="w-4 h-4 inline mr-2" />
                Stock por Local
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* TAB: Distribución Final */}
            {tabActiva === 'distribucion' && (() => {
              const totalPagesDistribucion = getTotalPages(resultado.transferencias.length, registrosPorPaginaDistribucion);
              const paginatedDataDistribucion = getPaginatedData(resultado.transferencias, paginaDistribucion, registrosPorPaginaDistribucion);

              return (
                <div>
                  {/* Controles superiores */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Registros por página:</label>
                      <select
                        value={registrosPorPaginaDistribucion}
                        onChange={(e) => handleItemsPerPageChange(setPaginaDistribucion, setRegistrosPorPaginaDistribucion, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                      </select>
                      <span className="text-sm text-gray-600">
                        Total: {resultado.transferencias.length} registros
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(setPaginaDistribucion, paginaDistribucion - 1, totalPagesDistribucion)}
                        disabled={paginaDistribucion === 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-gray-600">
                        Página {paginaDistribucion} de {totalPagesDistribucion}
                      </span>
                      <button
                        onClick={() => handlePageChange(setPaginaDistribucion, paginaDistribucion + 1, totalPagesDistribucion)}
                        disabled={paginaDistribucion === totalPagesDistribucion}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Tabla */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talle</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origen</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destino</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidades</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedDataDistribucion.map((t, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.sku}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.talle}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.color}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.origen}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.destino}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{t.unidades}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.motivo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.prioridad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* TAB: Resumen Sucursales */}
            {tabActiva === 'resumen' && (() => {
              // Calcular totales para verificación
              const totalUnidadesGlobal = Object.values(resultado.resumenSucursales).reduce((sum, datos) => sum + datos.totalUnidades, 0);
              const sumaEsperado = Object.values(resultado.resumenSucursales).reduce((sum, datos) => sum + datos.participacionEsperada, 0);
              const sumaReal = Object.values(resultado.resumenSucursales).reduce((sum, datos) => sum + parseFloat(datos.participacionReal), 0);

              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Unidades</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Esperado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Real</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desviación</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(resultado.resumenSucursales).map(([suc, datos]) => {
                        const desviacion = (parseFloat(datos.participacionReal) - datos.participacionEsperada).toFixed(2);
                        return (
                          <tr key={suc} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{suc}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{datos.totalUnidades}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{datos.participacionEsperada.toFixed(2)}%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{datos.participacionReal}%</td>
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
                      {/* Fila de TOTALES */}
                      <tr className="bg-blue-50 font-bold border-t-2 border-blue-300">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">TOTAL</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">{totalUnidadesGlobal}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">
                          {sumaEsperado.toFixed(2)}%
                          {Math.abs(sumaEsperado - 100) > 0.01 && (
                            <span className="ml-2 text-xs text-red-600">⚠️ No suma 100%</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">
                          {sumaReal.toFixed(2)}%
                          {Math.abs(sumaReal - 100) > 0.01 && (
                            <span className="ml-2 text-xs text-red-600">⚠️ No suma 100%</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* TAB: Análisis por Local */}
            {tabActiva === 'analisis' && resultado.analisisPorLocal && (
              <div className="overflow-x-auto">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">📊 Modelo de 3 Niveles: Análisis Integral</h3>
                  <p className="text-xs text-blue-700">
                    Este análisis aplica el modelo completo de distribución retail:
                    <strong> Nivel Matemático</strong> (Hamilton + Check Sum),
                    <strong> Nivel Comercial</strong> (Curvas completas, capacidad real, sin microasignaciones),
                    <strong> Nivel Logístico</strong> (Eficiencia de movimientos, inter-local optimizado).
                  </p>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Local</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% UTA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curvas Completas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curvas Incompletas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sobrestock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción Sugerida</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(resultado.analisisPorLocal)
                      .sort((a, b) => parseFloat(b[1].participacionUTA) - parseFloat(a[1].participacionUTA))
                      .map(([local, datos]) => (
                        <tr key={local} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {local}
                            {datos.esLocalGrande && (
                              <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                                Grande
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {datos.participacionUTA}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {datos.stockActual}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-medium">
                            {datos.curvasCompletas}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-700">
                            {datos.curvasIncompletas}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              datos.sobrestock === 'SÍ'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {datos.sobrestock}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {datos.accionSugerida}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {/* Detalle expandible de curvas (opcional, muestra al hacer hover o click) */}
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">💡 Interpretación de Acciones</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-700">
                    <div>
                      <span className="font-medium">✅ Óptimo:</span> Local tiene curvas completas bien balanceadas
                    </div>
                    <div>
                      <span className="font-medium">⚡ Completar curvas:</span> Tiene curvas incompletas que podrían completarse
                    </div>
                    <div>
                      <span className="font-medium">⚠️ Sobrestock:</span> Tiene ≥3 curvas completas, puede redistribuir excedentes
                    </div>
                    <div>
                      <span className="font-medium">📦 Vacío:</span> No tiene curvas asignadas, requiere stock inicial
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Stock por Local */}
            {tabActiva === 'stock' && resultado.distribucionDetallada && (() => {
              // Agrupar distribución por sucursal
              const stockPorLocal = {};
              resultado.distribucionDetallada.forEach(item => {
                if (!stockPorLocal[item.sucursal]) {
                  stockPorLocal[item.sucursal] = [];
                }
                stockPorLocal[item.sucursal].push(item);
              });

              // Ordenar locales por % UTA descendente
              const localesOrdenados = Object.keys(stockPorLocal).sort((a, b) => {
                const utaA = resultado.participaciones[a] || 0;
                const utaB = resultado.participaciones[b] || 0;
                return utaB - utaA;
              });

              return (
                <div className="space-y-4">
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">📦 Stock Post-Distribución por Local</h3>
                    <p className="text-xs text-blue-700">
                      Este detalle muestra el stock final asignado a cada sucursal luego de aplicar las 12 reglas de negocio.
                      Haz clic en cada local para expandir y ver el detalle por tipología, talle y color.
                    </p>
                  </div>

                  {localesOrdenados.map(local => {
                    const items = stockPorLocal[local];
                    const totalUnidades = items.reduce((sum, item) => sum + item.unidades, 0);
                    const utaPorcentaje = resultado.participaciones[local] || 0;
                    const isExpanded = localesExpandidos[local];

                    return (
                      <div key={local} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Header colapsable */}
                        <button
                          onClick={() => toggleLocal(local)}
                          className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            )}
                            <div className="text-left">
                              <h4 className="text-sm font-bold text-gray-900">{local}</h4>
                              <p className="text-xs text-gray-500">% UTA: {utaPorcentaje.toFixed(2)}%</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Total Unidades</p>
                              <p className="text-lg font-bold text-gray-900">{totalUnidades}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">SKUs Únicos</p>
                              <p className="text-lg font-bold text-gray-900">{items.length}</p>
                            </div>
                          </div>
                        </button>

                        {/* Contenido expandible */}
                        {isExpanded && (
                          <div className="border-t border-gray-200">
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipología</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talle</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidades</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orígenes</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {items
                                    .sort((a, b) => {
                                      // Ordenar por tipología, talle, color
                                      if (a.sku !== b.sku) return a.sku.localeCompare(b.sku);
                                      if (a.talle !== b.talle) return a.talle.localeCompare(b.talle);
                                      return a.color.localeCompare(b.color);
                                    })
                                    .map((item, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                          {item.sku}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                          {item.talle}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                          {item.color}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                          {item.unidades}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                          {item.origenes}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          </div>
        </div>
      )}
    </div>
  );
};

export default Distribucion;
