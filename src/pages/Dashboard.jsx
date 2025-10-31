import { useApp } from '../contexts/AppContext';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  Store,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

const Dashboard = () => {
  const { user, distributionData, stockData } = useApp();
  const navigate = useNavigate();

  // Calcular métricas desde distributionData
  const metrics = useMemo(() => {
    if (!distributionData || Object.keys(distributionData).length === 0) {
      return null;
    }

    const {
      distribucionDetallada = [],
      resumenSucursales = {},
      analisisPorLocal = {},
      transferencias = [],
      checkSum = {},
      curvas = {},
      sucursales = [],
    } = distributionData;

    // KPIs principales
    const totalUnidades = checkSum.totalDistribuido || 0;
    const totalSucursales = sucursales.length;
    const totalTransferencias = transferencias.length;

    // Curvas completas totales
    const totalCurvasCompletas = Object.values(analisisPorLocal).reduce(
      (sum, local) => sum + (local.curvasCompletas || 0),
      0
    );

    // Desviación promedio de participación
    const desviaciones = Object.values(resumenSucursales).map((suc) => {
      const esperada = parseFloat(suc.participacionEsperada) || 0;
      const real = parseFloat(suc.participacionReal) || 0;
      return Math.abs(esperada - real);
    });
    const desviacionPromedio =
      desviaciones.length > 0
        ? (desviaciones.reduce((a, b) => a + b, 0) / desviaciones.length).toFixed(2)
        : 0;

    // Sucursales con mayor desviación
    const sucursalesConDesviacion = Object.entries(resumenSucursales)
      .map(([nombre, datos]) => ({
        nombre,
        esperada: parseFloat(datos.participacionEsperada) || 0,
        real: parseFloat(datos.participacionReal) || 0,
        desviacion: Math.abs(
          parseFloat(datos.participacionEsperada) - parseFloat(datos.participacionReal)
        ).toFixed(2),
      }))
      .sort((a, b) => parseFloat(b.desviacion) - parseFloat(a.desviacion))
      .slice(0, 5);

    // Datos para gráfica de distribución por sucursal
    const distribucionPorSucursal = Object.entries(resumenSucursales)
      .map(([nombre, datos]) => ({
        sucursal: nombre,
        unidades: datos.totalUnidades,
        participacionEsperada: parseFloat(datos.participacionEsperada),
        participacionReal: parseFloat(datos.participacionReal),
      }))
      .sort((a, b) => b.unidades - a.unidades);

    // Datos para gráfica de curvas por local
    const curvasPorLocal = Object.entries(analisisPorLocal)
      .map(([nombre, datos]) => ({
        local: nombre,
        completas: datos.curvasCompletas || 0,
        incompletas: datos.curvasIncompletas || 0,
        total: (datos.curvasCompletas || 0) + (datos.curvasIncompletas || 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10

    // Top transferencias
    const topTransferencias = transferencias
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 8);

    // Stock por tipología
    const stockPorTipologia = {};
    distribucionDetallada.forEach((item) => {
      if (!stockPorTipologia[item.tipologia]) {
        stockPorTipologia[item.tipologia] = 0;
      }
      stockPorTipologia[item.tipologia] += item.unidades;
    });

    const tipologiasChart = Object.entries(stockPorTipologia)
      .map(([tipo, unidades]) => ({ tipologia: tipo, unidades }))
      .sort((a, b) => b.unidades - a.unidades);

    // Acciones sugeridas por análisis
    const accionesSugeridas = Object.entries(analisisPorLocal)
      .map(([nombre, datos]) => ({
        local: nombre,
        accion: datos.accionSugerida,
        sobrestock: datos.sobrestock === 'SÍ',
        curvasCompletas: datos.curvasCompletas,
        curvasIncompletas: datos.curvasIncompletas,
      }))
      .filter((item) => item.accion && !item.accion.includes('Óptimo'))
      .slice(0, 5);

    return {
      totalUnidades,
      totalSucursales,
      totalTransferencias,
      totalCurvasCompletas,
      desviacionPromedio,
      sucursalesConDesviacion,
      distribucionPorSucursal,
      curvasPorLocal,
      topTransferencias,
      tipologiasChart,
      accionesSugeridas,
      checkSum,
    };
  }, [distributionData]);

  // Colores para las gráficas
  const COLORS = ['#22c55e', '#0ea5e9', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#f97316'];

  // Si no hay datos, mostrar mensaje
  if (!metrics) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.name}
          </h1>
          <p className="text-gray-500 mt-1">
            Dashboard de análisis inteligente de stock y distribución
          </p>
        </div>

        {/* Empty State */}
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No hay datos de distribución
          </h3>
          <p className="text-gray-600 mb-6">
            Carga tus archivos de stock y participación para ver el dashboard completo
          </p>
          <button
            onClick={() => navigate('/cargar')}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <span>Cargar Datos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.name}
          </h1>
          <p className="text-gray-500 mt-1">
            Dashboard de análisis inteligente de stock y distribución
          </p>
        </div>
        {metrics.checkSum.esValido ? (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Distribución Válida</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Error en Distribución</span>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Unidades */}
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-50 p-3 rounded-xl">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Unidades</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalUnidades.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Total Sucursales */}
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="bg-secondary-50 p-3 rounded-xl">
              <Store className="w-6 h-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sucursales</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalSucursales}
              </p>
            </div>
          </div>
        </div>

        {/* Transferencias */}
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-50 p-3 rounded-xl">
              <ArrowLeftRight className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Transferencias</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalTransferencias}
              </p>
            </div>
          </div>
        </div>

        {/* Curvas Completas */}
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="bg-green-50 p-3 rounded-xl">
              <Layers className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Curvas Completas</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalCurvasCompletas}
              </p>
            </div>
          </div>
        </div>

        {/* Desviación Promedio */}
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-50 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Desviación Prom.</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.desviacionPromedio}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Sucursal */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Distribución por Sucursal (Top 10)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.distribucionPorSucursal.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="sucursal"
                stroke="#9ca3af"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="unidades" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Participación Esperada vs Real */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Participación: Esperada vs Real (Top 10)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics.distribucionPorSucursal.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="sucursal"
                stroke="#9ca3af"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="participacionEsperada"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.3}
                name="Esperada %"
              />
              <Area
                type="monotone"
                dataKey="participacionReal"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.3}
                name="Real %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Curvas Completas vs Incompletas */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Curvas Completas vs Incompletas por Local
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.curvasPorLocal}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="local"
                stroke="#9ca3af"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="completas" fill="#22c55e" name="Completas" radius={[8, 8, 0, 0]} />
              <Bar dataKey="incompletas" fill="#eab308" name="Incompletas" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stock por Tipología */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Distribución por Tipología
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.tipologiasChart}
                dataKey="unidades"
                nameKey="tipologia"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ tipologia, percent }) =>
                  `${tipologia} ${(percent * 100).toFixed(0)}%`
                }
              >
                {metrics.tipologiasChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tablas de datos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Transferencias */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Top Transferencias Interlocales
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    SKU
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Origen
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Destino
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Unidades
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {metrics.topTransferencias.map((transfer, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {transfer.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transfer.origen}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transfer.destino}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                      {transfer.unidades}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sucursales con Mayor Desviación */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Sucursales con Mayor Desviación
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Sucursal
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Esperada
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Real
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Desviación
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {metrics.sucursalesConDesviacion.map((suc, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {suc.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {suc.esperada.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {suc.real.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span
                        className={`font-semibold ${
                          parseFloat(suc.desviacion) > 1
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {suc.desviacion}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Acciones Sugeridas */}
      {metrics.accionesSugeridas.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Acciones Sugeridas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.accionesSugeridas.map((accion, idx) => (
              <div key={idx} className="card hover:scale-105 cursor-pointer transition-transform">
                <div className={`${
                  accion.sobrestock
                    ? 'bg-red-50'
                    : accion.curvasCompletas === 0
                    ? 'bg-yellow-50'
                    : 'bg-blue-50'
                } p-3 rounded-xl inline-flex mb-4`}>
                  {accion.sobrestock ? (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  ) : accion.curvasCompletas === 0 ? (
                    <RefreshCw className="w-6 h-6 text-yellow-600" />
                  ) : (
                    <ArrowLeftRight className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {accion.local}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{accion.accion}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Completas: {accion.curvasCompletas}</span>
                  <span>Incompletas: {accion.curvasIncompletas}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón para ver detalles */}
      <div className="card text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Ver análisis completo de la distribución
        </h3>
        <button
          onClick={() => navigate('/distribucion')}
          className="btn-primary inline-flex items-center space-x-2"
        >
          <span>Ir a Distribución</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
