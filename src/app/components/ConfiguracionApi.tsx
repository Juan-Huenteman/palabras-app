'use client';

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const ConfiguracionApi: React.FC = () => {
  const { setApiKey, apiKeyEstablecida, error } = useAppContext();
  const [keyInput, setKeyInput] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim()) {
      setApiKey(keyInput.trim());
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-purple-700 mb-4">
        Configuración de API
      </h2>
      
      {apiKeyEstablecida ? (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>¡API configurada correctamente!</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              Clave de API de Gemini
            </label>
            <input
              type="password"
              id="apiKey"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Ingresa tu clave de API"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Necesitas una clave de API de Gemini para usar esta aplicación.
            </p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-300"
          >
            Guardar Clave API
          </button>
        </form>
      )}
      
      {apiKeyEstablecida && (
        <button
          onClick={() => setKeyInput('')}
          className="mt-4 text-sm text-purple-600 hover:text-purple-800 underline"
        >
          Cambiar clave API
        </button>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-medium text-gray-700 mb-2">¿Cómo obtener una clave API?</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Visita <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Google AI Studio</a></li>
          <li>Regístrate o inicia sesión con tu cuenta de Google</li>
          <li>Ve a "API Keys" en el menú</li>
          <li>Crea una nueva clave API</li>
          <li>Copia la clave y pégala aquí</li>
        </ol>
      </div>
    </div>
  );
};

export default ConfiguracionApi; 