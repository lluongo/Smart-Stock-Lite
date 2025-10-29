import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Upload, CheckCircle, AlertCircle, FileText, Trash2 } from 'lucide-react';
import Papa from 'papaparse';

const CargarDatos = () => {
  const navigate = useNavigate();
  const { setStockData, setParticipacionData, setPrioridadData } = useApp();

  const [files, setFiles] = useState({
    stock: null,
    participacion: null,
    prioridad: null,
  });

  const [previews, setPreviews] = useState({
    stock: null,
    participacion: null,
    prioridad: null,
  });

  const [validations, setValidations] = useState({
    stock: null,
    participacion: null,
    prioridad: null,
  });

  const [dragActive, setDragActive] = useState({
    stock: false,
    participacion: false,
    prioridad: false,
  });

  const fileDescriptions = {
    stock: 'Contiene el stock por tienda',
    participacion: 'Contiene el porcentaje de venta por tienda',
    prioridad: 'Define la prioridad de distribución por producto',
  };

  const handleFileUpload = (type, file) => {
    if (file) {
      setFiles({ ...files, [type]: file });

      Papa.parse(file, {
        complete: (result) => {
          const data = result.data;
          setPreviews({
            ...previews,
            [type]: data.slice(0, 5),
          });

          // Validación simple
          const isValid = data.length > 1 && data[0].length > 0;
          setValidations({
            ...validations,
            [type]: isValid ? 'valid' : 'invalid',
          });

          // Guardar datos en el contexto
          if (type === 'stock') setStockData(data);
          if (type === 'participacion') setParticipacionData(data);
          if (type === 'prioridad') setPrioridadData(data);
        },
        header: false,
      });
    }
  };

  const handleRemoveFile = (type) => {
    setFiles({ ...files, [type]: null });
    setPreviews({ ...previews, [type]: null });
    setValidations({ ...validations, [type]: null });
  };

  const handleDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive({ ...dragActive, [type]: true });
    } else if (e.type === "dragleave") {
      setDragActive({ ...dragActive, [type]: false });
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive({ ...dragActive, [type]: false });

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(type, e.dataTransfer.files[0]);
    }
  };

  const handleConfirm = () => {
    const allValid = Object.values(validations).every((v) => v === 'valid');
    if (allValid) {
      navigate('/distribucion');
    }
  };

  const allFilesUploaded = Object.values(files).every((f) => f !== null);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cargar Datos</h1>
        <p className="text-gray-500 mt-1">
          Sube los archivos CSV o Excel para analizar tu inventario
        </p>
      </div>

      {/* File upload cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.keys(files).map((type) => (
          <div key={type} className="card">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 capitalize">
                    {type}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {fileDescriptions[type]}
                  </p>
                </div>
                {validations[type] && (
                  <div>
                    {validations[type] === 'valid' ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-500" />
                    )}
                  </div>
                )}
              </div>

              {!files[type] ? (
                <div
                  onDragEnter={(e) => handleDrag(e, type)}
                  onDragLeave={(e) => handleDrag(e, type)}
                  onDragOver={(e) => handleDrag(e, type)}
                  onDrop={(e) => handleDrop(e, type)}
                >
                  <label className="block">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => handleFileUpload(type, e.target.files[0])}
                      className="hidden"
                    />
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                        dragActive[type]
                          ? 'border-primary-500 bg-primary-100 scale-105'
                          : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                      }`}
                    >
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${
                        dragActive[type] ? 'text-primary-600' : 'text-gray-400'
                      }`} />
                      <p className="text-sm text-gray-600 font-medium">
                        {dragActive[type] ? 'Suelta el archivo aquí' : 'Arrastra el archivo o click para subir'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">CSV o Excel</p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 truncate">
                        {files[type].name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(type)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {validations[type] === 'valid' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-700 font-medium">
                        Archivo validado correctamente
                      </p>
                    </div>
                  )}

                  {validations[type] === 'invalid' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-700 font-medium">
                        Revisar formato del archivo
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview table */}
      {Object.values(previews).some((p) => p !== null) && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Previsualización de Datos
          </h2>
          <div className="overflow-x-auto">
            {Object.entries(previews).map(
              ([type, data]) =>
                data && (
                  <div key={type} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                      {type}
                    </h3>
                    <table className="min-w-full divide-y divide-gray-200">
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td
                                key={j}
                                className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-2">
          Instrucciones
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Los archivos deben estar en formato CSV o Excel</li>
          <li>• Puedes arrastrar y soltar o hacer click para seleccionar</li>
          <li>• Asegúrate de que los datos estén completos y sin errores</li>
          <li>• La primera fila debe contener los encabezados de columna</li>
          <li>• Sube los tres archivos para continuar con el análisis</li>
        </ul>
      </div>

      {/* Confirm button */}
      <div className="flex justify-end">
        <button
          onClick={handleConfirm}
          disabled={!allFilesUploaded}
          className={`btn-primary ${
            !allFilesUploaded ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Confirmar Carga
        </button>
      </div>
    </div>
  );
};

export default CargarDatos;
