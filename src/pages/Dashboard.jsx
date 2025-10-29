import { useApp } from '../contexts/AppContext';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ArrowLeftRight,
  DollarSign,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const { user } = useApp();

  // Datos de ejemplo para los KPIs
  const kpis = [
    {
      icon: TrendingUp,
      label: 'Rotación',
      value: '87%',
      change: '+12%',
      color: 'primary',
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
      changeColor: 'text-green-600',
    },
    {
      icon: Package,
      label: 'Cobertura',
      value: '45 días',
      change: '-5 días',
      color: 'secondary',
      bgColor: 'bg-secondary-50',
      iconColor: 'text-secondary-600',
      changeColor: 'text-green-600',
    },
    {
      icon: AlertTriangle,
      label: 'En Riesgo',
      value: '23',
      change: '+3',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      changeColor: 'text-red-600',
    },
  ];

  // Datos de ejemplo para el gráfico
  const chartData = [
    { mes: 'Ene', ventas: 4000, stock: 2400 },
    { mes: 'Feb', ventas: 3000, stock: 1398 },
    { mes: 'Mar', ventas: 2000, stock: 9800 },
    { mes: 'Abr', ventas: 2780, stock: 3908 },
    { mes: 'May', ventas: 1890, stock: 4800 },
    { mes: 'Jun', ventas: 2390, stock: 3800 },
  ];

  // Acciones recomendadas
  const actions = [
    {
      icon: RefreshCw,
      title: 'Reordenar',
      description: '15 productos necesitan reposición',
      action: 'Ver lista',
      color: 'primary',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-600',
    },
    {
      icon: ArrowLeftRight,
      title: 'Transferir',
      description: '8 productos con distribución desbalanceada',
      action: 'Revisar',
      color: 'secondary',
      bgColor: 'bg-secondary-50',
      textColor: 'text-secondary-600',
    },
    {
      icon: DollarSign,
      title: 'Liquidar',
      description: '5 productos con exceso de inventario',
      action: 'Analizar',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.name}
        </h1>
        <p className="text-gray-500 mt-1">
          Resumen de tu inventario y acciones recomendadas
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className={`${kpi.bgColor} p-3 rounded-xl`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {kpi.value}
                  </p>
                </div>
              </div>
              <span
                className={`text-sm font-medium ${kpi.changeColor} flex items-center`}
              >
                {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Tendencias de Stock y Ventas
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="ventas"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', r: 4 }}
              name="Ventas"
            />
            <Line
              type="monotone"
              dataKey="stock"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ fill: '#0ea5e9', r: 4 }}
              name="Stock"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Acciones Recomendadas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {actions.map((action, index) => (
            <div key={index} className="card hover:scale-105 cursor-pointer">
              <div className={`${action.bgColor} p-3 rounded-xl inline-flex mb-4`}>
                <action.icon className={`w-6 h-6 ${action.textColor}`} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{action.description}</p>
              <button
                className={`flex items-center space-x-2 ${action.textColor} font-medium text-sm hover:underline`}
              >
                <span>{action.action}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
