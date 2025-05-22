'use client';

import { useEffect, useState } from 'react';
import { useAppContext } from './context/AppContext';
import Bienvenida from './components/Bienvenida';
import ConfiguracionApi from './components/ConfiguracionApi';
import PracticaPalabras from './components/PracticaPalabras';

export default function Home() {
  const { apiKeyEstablecida } = useAppContext();
  const [mostrarPractica, setMostrarPractica] = useState(false);

  // Efecto para mostrar la práctica después de configurar la API
  useEffect(() => {
    if (apiKeyEstablecida) {
      setMostrarPractica(true);
    }
  }, [apiKeyEstablecida]);

  return (
    <div className="container mx-auto py-8 px-4">
      <Bienvenida />
      
      <div className="max-w-3xl mx-auto">
        {!apiKeyEstablecida && (
          <ConfiguracionApi />
        )}
        
        {apiKeyEstablecida && mostrarPractica && (
          <PracticaPalabras />
        )}
        
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            Desarrollado con ❤️ para ayudar a niños a aprender a leer
          </p>
          <p className="mt-2">
            Usa la API de Gemini para reconocimiento de voz y Web Speech API para síntesis de voz
          </p>
        </footer>
      </div>
    </div>
  );
}
