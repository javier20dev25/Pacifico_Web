import React, { useState } from 'react';
import axios from 'axios'; // Usar axios directamente
import { getPublicImageUrl } from '../lib/supabase-utils';

const ImageUploadTest: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rawUrl, setRawUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setRawUrl(null);
      setProcessedUrl(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo primero.');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      // Usar axios.post directamente para evitar el interceptor de autenticación
      const response = await axios.post('/api/uploads/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        const url = response.data.url;
        setRawUrl(url);
        setProcessedUrl(getPublicImageUrl(url));
      } else {
        throw new Error('La respuesta del servidor no fue exitosa.');
      }
    } catch (err: unknown) {
      let errorMessage = 'Error desconocido durante la subida.';
      if (axios.isAxiosError(err) && err.response?.data) {
        errorMessage = err.response.data.error || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Test de Subida y Visualización de Imágenes</h1>
      <div className="p-6 border rounded-lg bg-gray-50 space-y-4">
        <div>
          <label htmlFor="image-test-upload" className="block text-sm font-medium text-gray-700 mb-1">
            1. Selecciona una imagen
          </label>
          <input
            type="file"
            id="image-test-upload"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-gray-400"
        >
          {isUploading ? 'Subiendo...' : '2. Subir y Procesar'}
        </button>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 border border-red-400 rounded-md">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {processedUrl && (
          <div className="space-y-4 pt-4 border-t">
            <h2 className="text-xl font-semibold">3. Resultados</h2>
            <div>
              <p className="font-mono text-xs bg-gray-100 p-2 rounded-md break-all">
                <strong>URL Cruda (del backend):</strong> {rawUrl}
              </p>
            </div>
            <div>
              <p className="font-mono text-xs bg-gray-100 p-2 rounded-md break-all">
                <strong>URL Procesada (con getPublicImageUrl):</strong> {processedUrl}
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">Visualización de la Imagen:</p>
              <img src={processedUrl} alt="Imagen subida" className="max-w-sm border-4 border-green-500 rounded-lg" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadTest;

