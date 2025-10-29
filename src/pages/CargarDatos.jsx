import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Upload, CheckCircle, AlertCircle, FileText, Trash2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import Papa from 'papaparse';
import { validarArchivo } from '../services/fileValidation';

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

  const [validationMessages, setValidationMessages] = useState({
    stock: null,
    participacion: null,
    prioridad: null,
  });

  const [dragActive, setDragActive] = useState({
    stock: false,
    participacion: false,
    prioridad: false,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fileDescriptions = {
    stock: 'Inventario por depósito (Coddep, Deposito, Color, NombreColor, Medida, Cantidad, TIPOLOGIA, ORIGEN, TEMPORADA)',
    participacion: 'Sucursal y participación (sucursal, participacion)',
    prioridad: 'Orden de distribución por tipología (prioridad, tipologia)',
  };

  const handleFileUpload = (type, file) => {
    if (file) {
      setFiles({ ...files, [type]: file });

      Papa.parse(file, {
        complete: (result) => {
          const data = result.data;

          // Filtrar filas vacías
          const dataFiltrada = data.filter(row =>
            row && row.length > 0 && row.some(cell => cell && cell.trim() !== '')
          );

          // Validación específica según el tipo de archivo
          const validacion = validarArchivo(type, dataFiltrada);

          // Actualizar estado de validación
          setValidations({
            ...validations,
            [type]: validacion.valido ? 'valid' : 'invalid',
          });

          setValidationMessages({
            ...validationMessages,
            [type]: validacion,
          });

          if (validacion.valido) {
            // Solo guardar datos si la validación es exitosa
            setPreviews({
              ...previews,
              [type]: dataFiltrada,
            });

            // Guardar datos en el contexto
            if (type === 'stock') setStockData(dataFiltrada);
            if (type === 'participacion') setParticipacionData(dataFiltrada);
            if (type === 'prioridad') setPrioridadData(dataFiltrada);
          } else {
            // Si no es válido, limpiar preview
            setPreviews({
              ...previews,
              [type]: null,
            });
          }
        },
        header: false,
        skipEmptyLines: true,
      });
    }
  };

  const handleRemoveFile = (type) => {
    setFiles({ ...files, [type]: null });
    setPreviews({ ...previews, [type]: null });
    setValidations({ ...validations, [type]: null });
    setValidationMessages({ ...validationMessages, [type]: null });
    setCurrentPage(1);

    // Limpiar datos del contexto
    if (type === 'stock') setStockData([]);
    if (type === 'participacion') setParticipacionData([]);
    if (type === 'prioridad') setPrioridadData([]);
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
  const allFilesValid = Object.values(validations).every((v) => v === 'valid');

  // Función para obtener datos paginados solo para stock
  const getPaginatedData = (data, type) => {
    if (type === 'stock') {
      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      return data.slice(startIndex, endIndex);
    }
    return data; // Para participacion y prioridad retornamos todos los datos
  };

  // Calcular total de páginas para stock
  const getTotalPages = (data, type) => {
    if (type === 'stock') {
      return Math.ceil(data.length / rowsPerPage);
    }
    return 1;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cargar Datos</h1>
        <p className="text-gray-500 mt-1">
          Sube los archivos CSV con el formato específico para cada tipo
        </p>
      </div>

      {/* Distribución Automática */}
      <div className="card bg-purple-50 border-purple-200">
        <h2 className="text-lg font-bold text-purple-900 mb-2">
          📊 Distribución Automática
        </h2>
        <p className="text-sm text-purple-700">
          Carga los 3 archivos para usar el motor de distribución automática con Hamilton + Reglas de Negocio R1-R8
        </p>
      </div>

      {/* File upload cards - Inter-local */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['stock', 'participacion', 'prioridad'].map((type) => (
          <div key={type} className="card">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 capitalize">
                    {type}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {fileDescriptions[type]}
                  </p>
                </div>
                {validations[type] && (
                  <div>
                    {validations[type] === 'valid' ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
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

                  {validations[type] === 'valid' && validationMessages[type] && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-green-700 font-medium">
                            Archivo validado correctamente
                          </p>
                          {validationMessages[type].mensaje && (
                            <p className="text-xs text-green-600 mt-1">
                              {validationMessages[type].mensaje}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {validations[type] === 'invalid' && validationMessages[type] && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-red-700 font-medium">
                            Error en formato del archivo
                          </p>
                          {validationMessages[type].error && (
                            <p className="text-xs text-red-600 mt-1">
                              {validationMessages[type].error}
                            </p>
                          )}
                        </div>
                      </div>
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
          <div className="space-y-6">
            {Object.entries(previews).map(
              ([type, data]) =>
                data && (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {type} {type === 'stock' && `(${data.length - 1} filas)`}
                      </h3>
                      {type === 'stock' && getTotalPages(data, type) > 1 && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <span className="text-sm text-gray-600">
                            Página {currentPage} de {getTotalPages(data, type)}
                          </span>
                          <button
                            onClick={() => setCurrentPage(Math.min(getTotalPages(data, type), currentPage + 1))}
                            disabled={currentPage === getTotalPages(data, type)}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getPaginatedData(data, type).map((row, i) => (
                            <tr key={i} className={`hover:bg-gray-50 ${i === 0 ? 'bg-gray-100 font-medium' : ''}`}>
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
                  </div>
                )
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-3">
          Formato de Archivos Requeridos
        </h3>

        <div className="space-y-3 text-sm text-blue-700">
          <div>
            <p className="font-medium mb-1">📦 Stock:</p>
            <p className="text-xs">Columnas: <code className="bg-blue-100 px-1 rounded">Coddep, Deposito, Color, NombreColor, Medida, Cantidad, TIPOLOGIA, ORIGEN, TEMPORADA</code></p>
            <p className="text-xs mt-0.5">Ejemplo: 001, Depósito Central, AZ, Azul, M, 15, Remera, Nacional, Verano</p>
          </div>
          <div>
            <p className="font-medium mb-1">📊 Participación:</p>
            <p className="text-xs">Columnas: <code className="bg-blue-100 px-1 rounded">sucursal, participacion</code></p>
            <p className="text-xs mt-0.5">Ejemplo: Sucursal_001, 35.5</p>
            <p className="text-xs mt-0.5 font-medium">⚠️ Las participaciones deben sumar exactamente 100%</p>
          </div>
          <div>
            <p className="font-medium mb-1">⭐ Prioridad (OBLIGATORIO):</p>
            <p className="text-xs">Columnas: <code className="bg-blue-100 px-1 rounded">prioridad, tipologia</code></p>
            <p className="text-xs mt-0.5">Ejemplo: 1, Remera (menor número = mayor prioridad)</p>
            <p className="text-xs mt-0.5 font-medium">📋 Define el orden en que se distribuyen las tipologías</p>
          </div>
        </div>
      </div>

      {/* Confirm button */}
      <div className="flex justify-end">
        <button
          onClick={handleConfirm}
          disabled={!allFilesUploaded || !allFilesValid}
          className={`btn-primary ${
            !allFilesUploaded || !allFilesValid ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Confirmar Carga
        </button>
      </div>
    </div>
  );
};

export default CargarDatos;
