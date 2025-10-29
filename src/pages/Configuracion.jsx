import { Settings, User, Bell, Shield, Database } from 'lucide-react';

const Configuracion = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">
          Personaliza tu experiencia en SmartStock Lite
        </p>
      </div>

      {/* Settings sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card hover:scale-105 cursor-pointer">
          <div className="flex items-start space-x-4">
            <div className="bg-primary-100 p-3 rounded-xl">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Perfil
              </h3>
              <p className="text-sm text-gray-600">
                Gestiona tu información personal y preferencias de cuenta
              </p>
            </div>
          </div>
        </div>

        <div className="card hover:scale-105 cursor-pointer">
          <div className="flex items-start space-x-4">
            <div className="bg-secondary-100 p-3 rounded-xl">
              <Bell className="w-6 h-6 text-secondary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Notificaciones
              </h3>
              <p className="text-sm text-gray-600">
                Configura alertas de stock y notificaciones del sistema
              </p>
            </div>
          </div>
        </div>

        <div className="card hover:scale-105 cursor-pointer">
          <div className="flex items-start space-x-4">
            <div className="bg-yellow-100 p-3 rounded-xl">
              <Shield className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Seguridad
              </h3>
              <p className="text-sm text-gray-600">
                Administra contraseñas y opciones de seguridad
              </p>
            </div>
          </div>
        </div>

        <div className="card hover:scale-105 cursor-pointer">
          <div className="flex items-start space-x-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Datos
              </h3>
              <p className="text-sm text-gray-600">
                Exporta, importa y gestiona tus datos de inventario
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Settings className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-1">
              En desarrollo
            </h3>
            <p className="text-sm text-blue-700">
              Estas opciones estarán disponibles próximamente. Estamos
              trabajando para ofrecerte más funcionalidades de configuración.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
