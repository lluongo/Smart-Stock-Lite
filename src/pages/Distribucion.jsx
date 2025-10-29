import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { AlertCircle, CheckCircle, Edit2, Save, ArrowRight } from 'lucide-react';

const Distribucion = () => {
  const navigate = useNavigate();
  const { stockData, setDistributionData } = useApp();

  // Datos de ejemplo si no hay datos reales
  const defaultProducts = [
    {
      id: 1,
      producto: 'Producto A',
      stockActual: 150,
      sugerido: 180,
      status: 'low',
      editable: false,
    },
    {
      id: 2,
      producto: 'Producto B',
      stockActual: 320,
      sugerido: 280,
      status: 'high',
      editable: false,
    },
    {
      id: 3,
      producto: 'Producto C',
      stockActual: 200,
      sugerido: 200,
      status: 'good',
      editable: false,
    },
    {
      id: 4,
      producto: 'Producto D',
      stockActual: 90,
      sugerido: 150,
      status: 'low',
      editable: false,
    },
    {
      id: 5,
      producto: 'Producto E',
      stockActual: 450,
      sugerido: 380,
      status: 'high',
      editable: false,
    },
  ];

  const [products, setProducts] = useState(defaultProducts);

  const getStatusColor = (status) => {
    switch (status) {
      case 'low':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-yellow-100 text-yellow-700';
      case 'good':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'low':
        return <AlertCircle className="w-4 h-4" />;
      case 'high':
        return <AlertCircle className="w-4 h-4" />;
      case 'good':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'low':
        return 'Stock bajo';
      case 'high':
        return 'Exceso';
      case 'good':
        return 'Óptimo';
      default:
        return '';
    }
  };

  const handleEdit = (id) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, editable: true } : p))
    );
  };

  const handleSave = (id) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, editable: false } : p))
    );
  };

  const handleChange = (id, field, value) => {
    setProducts(
      products.map((p) =>
        p.id === id ? { ...p, [field]: parseInt(value) || 0 } : p
      )
    );
  };

  const handleGenerateProposal = () => {
    setDistributionData(products);
    navigate('/revision');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Distribución</h1>
        <p className="text-gray-500 mt-1">
          Revisa y ajusta la distribución sugerida para cada producto
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-red-50 border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Stock Bajo</p>
              <p className="text-3xl font-bold text-red-700 mt-1">
                {products.filter((p) => p.status === 'low').length}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <div className="card bg-yellow-50 border-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">
                En Exceso
              </p>
              <p className="text-3xl font-bold text-yellow-700 mt-1">
                {products.filter((p) => p.status === 'high').length}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-yellow-400" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Óptimos</p>
              <p className="text-3xl font-bold text-green-700 mt-1">
                {products.filter((p) => p.status === 'good').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
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
                  Sugerido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.producto}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.stockActual}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.editable ? (
                      <input
                        type="number"
                        value={product.sugerido}
                        onChange={(e) =>
                          handleChange(product.id, 'sugerido', e.target.value)
                        }
                        className="w-24 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {product.sugerido}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        product.status
                      )}`}
                    >
                      {getStatusIcon(product.status)}
                      <span>{getStatusText(product.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {product.editable ? (
                      <button
                        onClick={() => handleSave(product.id)}
                        className="text-primary-600 hover:text-primary-900 inline-flex items-center space-x-1"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEdit(product.id)}
                        className="text-secondary-600 hover:text-secondary-900 inline-flex items-center space-x-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-2">
          Cómo funciona
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • <strong>Stock bajo:</strong> Productos que necesitan reposición
          </li>
          <li>
            • <strong>En exceso:</strong> Productos con sobreinventario
          </li>
          <li>
            • <strong>Óptimo:</strong> Productos con stock adecuado
          </li>
          <li>• Edita los valores sugeridos si necesitas ajustes manuales</li>
        </ul>
      </div>

      {/* Generate button */}
      <div className="flex justify-end">
        <button onClick={handleGenerateProposal} className="btn-primary">
          <span>Generar Propuesta Final</span>
          <ArrowRight className="w-5 h-5 ml-2 inline" />
        </button>
      </div>
    </div>
  );
};

export default Distribucion;
