'use client';

import React from 'react';
import Image from 'next/image';

const Bienvenida: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-extrabold text-purple-700 mb-3">
        ¡Aprendamos a Leer!
      </h1>
      
      <div className="relative w-60 h-60 mx-auto my-6">
        <div className="w-full h-full bg-purple-100 rounded-full flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-32 h-32 text-purple-500"
          >
            <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
          </svg>
        </div>
      </div>
      
      <p className="text-lg text-purple-900 mb-6 max-w-lg mx-auto">
        Una aplicación divertida para ayudar a los niños a aprender a leer.
        ¡Vamos a practicar palabras juntos!
      </p>
      
      <div className="bg-white p-4 rounded-lg shadow-md max-w-md mx-auto">
        <h2 className="text-xl font-bold text-purple-700 mb-3">
          ¿Cómo funciona?
        </h2>
        
        <ol className="text-left space-y-3 pl-2">
          <li className="flex items-start">
            <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 shrink-0">
              1
            </span>
            <span className="text-gray-700">
              Escucha la palabra que se te muestra en la pantalla
            </span>
          </li>
          
          <li className="flex items-start">
            <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 shrink-0">
              2
            </span>
            <span className="text-gray-700">
              Presiona el botón del micrófono y lee la palabra en voz alta
            </span>
          </li>
          
          <li className="flex items-start">
            <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 shrink-0">
              3
            </span>
            <span className="text-gray-700">
              Recibe retroalimentación sobre tu pronunciación
            </span>
          </li>
          
          <li className="flex items-start">
            <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 shrink-0">
              4
            </span>
            <span className="text-gray-700">
              ¡Continúa con más palabras y diviértete aprendiendo!
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default Bienvenida; 