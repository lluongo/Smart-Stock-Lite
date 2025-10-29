import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import {
  Download,
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  Package,
  RefreshCw,
} from 'lucide-react';

const Revision = () => {
  const navigate = useNavigate();
  const { distributionData } = useApp();
  const [exported, setExported] = useState(false);

  // Datos de ejemplo si no hay datos reales
  const movements = distributionData.length > 0 ? distributionData : [
    { id: 1, producto: 'Producto A', actual: 150, nuevo: 180, cambio: +30 },
    { id: 2, producto: 'Producto B', actual: 320, nuevo: 280, cambio: -40 },
    { id: 3, producto: 'Producto C', actual: 200, nuevo: 200, cambio: 0 },
    { id: 4, producto: 'Producto D', actual: 90, nuevo: 150, cambio: +60 },
    { id: 5, producto: 'Producto E', actual: 450, nuevo: 380, cambio: -70 },
  ];

  const totalMovements = movements.length;
  const totalIncrease = movements
    .filter((m) => m.cambio > 0)
    .reduce((sum, m) => sum + m.cambio, 0);
  const totalDecrease = Math.abs(
    movements.filter((m) => m.cambio < 0).reduce((sum, m) => sum + m.cambio, 0)
  );
  const noChanges = movements.filter((m) => m.cambio === 0).length;

  const handleExport = () => {
    // Crear CSV
    const headers = ['Producto', 'Stock Actual', 'Stock Nuevo', 'Cambio'];
    const rows = movements.map((m) => [
      m.producto,
      m.stockActual || m.actual,
      m.sugerido || m.nuevo,
      (m.sugerido || m.nuevo) - (m.stockActual || m.actual),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `distribucion_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Revisión y Exportación
        </h1>
        <p className="text-gray-500 mt-1">
          Revisa el resumen de movimientos y exporta tu propuesta
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-primary-50 border-primary-100">
          <div className="flex items-center space-x-3">
            <Package className="w-10 h-10 text-primary-600" />
            <div>
              <p className="text-sm text-primary-600 font-medium">
                Movimientos
              </p>
              <p className="text-2xl font-bold text-primary-700">
                {totalMovements}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-100">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-10 h-10 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Aumentos</p>
              <p className="text-2xl font-bold text-green-700">
                +{totalIncrease}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-red-50 border-red-100">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-10 h-10 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">Reducciones</p>
              <p className="text-2xl font-bold text-red-700">
                -{totalDecrease}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gray-50 border-gray-100">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-10 h-10 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Sin cambios</p>
              <p className="text-2xl font-bold text-gray-700">{noChanges}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Movements table */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Resumen de Movimientos
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Nuevo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cambio
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.map((movement) => {
                const cambio =
                  (movement.sugerido || movement.nuevo) -
                  (movement.stockActual || movement.actual);
                return (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {movement.producto}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {movement.stockActual || movement.actual}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {movement.sugerido || movement.nuevo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          cambio > 0
                            ? 'bg-green-100 text-green-700'
                            : cambio < 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {cambio > 0 ? '+' : ''}
                        {cambio}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success message */}
      {exported && (
        <div className="card bg-green-50 border-green-200 animate-pulse">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <p className="text-green-700 font-medium">
              Archivo exportado exitosamente
            </p>
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-2">
          Próximos pasos
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Revisa los movimientos sugeridos en la tabla</li>
          <li>• Exporta el archivo para implementar los cambios</li>
          <li>
            • Si necesitas ajustes, vuelve a la pantalla de distribución
          </li>
          <li>• Mantén tu inventario optimizado regularmente</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <button
          onClick={() => navigate('/distribucion')}
          className="btn-secondary"
        >
          <ArrowLeft className="w-5 h-5 mr-2 inline" />
          Volver a Ajustar
        </button>

        <button onClick={handleExport} className="btn-primary">
          <Download className="w-5 h-5 mr-2 inline" />
          Exportar Archivo Final
        </button>
      </div>
    </div>
  );
};

export default Revision;
