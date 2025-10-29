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
  TrendingUp,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  generarDistribucionAutomatica,
  exportarDistribucionCompleta,
  exportarDistribucionCSV
} from '../services/distributionService';

const Distribucion = () => {
  const navigate = useNavigate();
  const { stockData, participacionData, prioridadData } = useApp();

  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [tabActiva, setTabActiva] = useState('distribucion'); // distribucion, transferencias, resumen, log

  // Estados de paginación
  const [paginaDistribucion, setPaginaDistribucion] = useState(1);
  const [registrosPorPaginaDistribucion, setRegistrosPorPaginaDistribucion] = useState(10);

  const [paginaTransferencias, setPaginaTransferencias] = useState(1);
  const [registrosPorPaginaTransferencias, setRegistrosPorPaginaTransferencias] = useState(10);

  const [paginaLog, setPaginaLog] = useState(1);
  const [registrosPorPaginaLog, setRegistrosPorPaginaLog] = useState(10);

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
            Hamilton + Reglas de Negocio R1-R8 - Sin stock sin asignar
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
                ✅ Validación Check Sum
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
              <TrendingUp className="w-10 h-10 text-green-400" />
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
                onClick={() => setTabActiva('transferencias')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tabActiva === 'transferencias'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Transferencias
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
                onClick={() => setTabActiva('log')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tabActiva === 'log'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Log Trazabilidad ({resultado.trazabilidad.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* TAB: Distribución Final */}
            {tabActiva === 'distribucion' && (() => {
              const totalPagesDistribucion = getTotalPages(resultado.distribucionDetallada.length, registrosPorPaginaDistribucion);
              const paginatedDataDistribucion = getPaginatedData(resultado.distribucionDetallada, paginaDistribucion, registrosPorPaginaDistribucion);

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
                        Total: {resultado.distribucionDetallada.length} registros
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipología</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talle</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidades</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuota</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedDataDistribucion.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.sku}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.tipologia}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.nombreColor || item.color}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.medida}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.sucursal}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.unidades}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.cuotaExacta}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* TAB: Transferencias */}
            {tabActiva === 'transferencias' && (() => {
              const totalPagesTransferencias = getTotalPages(resultado.transferencias.length, registrosPorPaginaTransferencias);
              const paginatedDataTransferencias = getPaginatedData(resultado.transferencias, paginaTransferencias, registrosPorPaginaTransferencias);

              return (
                <div>
                  {/* Controles superiores */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Registros por página:</label>
                      <select
                        value={registrosPorPaginaTransferencias}
                        onChange={(e) => handleItemsPerPageChange(setPaginaTransferencias, setRegistrosPorPaginaTransferencias, e.target.value)}
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
                        onClick={() => handlePageChange(setPaginaTransferencias, paginaTransferencias - 1, totalPagesTransferencias)}
                        disabled={paginaTransferencias === 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-gray-600">
                        Página {paginaTransferencias} de {totalPagesTransferencias}
                      </span>
                      <button
                        onClick={() => handlePageChange(setPaginaTransferencias, paginaTransferencias + 1, totalPagesTransferencias)}
                        disabled={paginaTransferencias === totalPagesTransferencias}
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
                        {paginatedDataTransferencias.map((t, idx) => (
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
            {tabActiva === 'resumen' && (
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
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: Log Trazabilidad */}
            {tabActiva === 'log' && (() => {
              const totalPagesLog = getTotalPages(resultado.trazabilidad.length, registrosPorPaginaLog);
              const paginatedDataLog = getPaginatedData(resultado.trazabilidad, paginaLog, registrosPorPaginaLog);

              return (
                <div>
                  {/* Controles superiores */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Registros por página:</label>
                      <select
                        value={registrosPorPaginaLog}
                        onChange={(e) => handleItemsPerPageChange(setPaginaLog, setRegistrosPorPaginaLog, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                      </select>
                      <span className="text-sm text-gray-600">
                        Total: {resultado.trazabilidad.length} registros
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(setPaginaLog, paginaLog - 1, totalPagesLog)}
                        disabled={paginaLog === 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-gray-600">
                        Página {paginaLog} de {totalPagesLog}
                      </span>
                      <button
                        onClick={() => handlePageChange(setPaginaLog, paginaLog + 1, totalPagesLog)}
                        disabled={paginaLog === totalPagesLog}
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regla</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temporada</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedDataLog.map((log, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">{log.regla}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.sku || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.sucursal || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.producto || log.tipologia || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{log.motivo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.prioridad || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.temporada || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Reglas Aplicadas */}
      {resultado && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-3">
            Reglas de Negocio Aplicadas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><strong>R1:</strong> Mantener curva entera (TIPOLOGIA + Color)</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><strong>R2:</strong> Sobrantes según necesidad del local</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><strong>R3:</strong> Locales grandes NO sacan mercadería</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><strong>R4:</strong> Minimizar movimientos inter-local</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><strong>R5:</strong> Limpieza de curvas rotas existentes</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><strong>R6:</strong> Interior se acomoda entre ellos</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><strong>R7:</strong> Categoría + prioridad (trazabilidad)</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><strong>R8:</strong> UTA se acumula (análisis futuro IA)</span>
            </div>
          </div>
        </div>
      )}

      {/* Algoritmo Info */}
      <div className="card bg-gray-50 border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 mb-2">
          Algoritmo de Hamilton + Reglas de Negocio
        </h3>
        <p className="text-xs text-gray-700 mb-2">
          <strong>Capa 1:</strong> Algoritmo de Mayor Resto (Hamilton) - Distribución matemática exacta sin residuos.
        </p>
        <p className="text-xs text-gray-700 mb-2">
          <strong>Capa 2:</strong> Reglas R1-R8 aplicadas secuencialmente para optimizar curvas y minimizar movimientos.
        </p>
        <p className="text-xs text-gray-700">
          <strong>Resultado:</strong> 100% del stock distribuido con trazabilidad completa.
        </p>
      </div>
    </div>
  );
};

export default Distribucion;
