'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

type NivelDificultad = 'facil' | 'medio' | 'dificil';

const PracticaPalabras: React.FC = () => {
  const {
    palabras,
    palabraActual,
    silabasPalabraActual,
    cargarPalabras,
    siguientePalabra,
    estadoReconocimiento,
    resultadoReconocimiento,
    iniciarReconocimiento,
    hablarTexto,
    hablarSilaba,
    estaHablando,
    verificarPalabraHablada,
    retroalimentacion,
    respuestaCorrecta,
    cargando,
    error,
    generoVoz,
    cambiarGeneroVoz,
    usarMayusculas,
    cambiarUsarMayusculas,
    silabaActual,
    setSilabaActual
  } = useAppContext();

  const [nivelSeleccionado, setNivelSeleccionado] = useState<NivelDificultad>('facil');
  const [palabrasCargadas, setPalabrasCargadas] = useState<boolean>(false);
  const [audioInicializado, setAudioInicializado] = useState<boolean>(true);
  
  // Referencias para evitar bucles
  const palabraRef = useRef<string>('');
  const estaHablandoRef = useRef<boolean>(false);

  // Cargar palabras inicialmente
  useEffect(() => {
    if (!palabrasCargadas && palabras.length === 0) {
      cargarPalabras(nivelSeleccionado);
      setPalabrasCargadas(true);
    }
  }, [palabrasCargadas, palabras.length, cargarPalabras, nivelSeleccionado]);

  // Leer automáticamente la palabra cuando cambia
  useEffect(() => {
    // Actualizar las referencias para seguir el estado actual
    estaHablandoRef.current = estaHablando;
    
    // Solo reproducir si la palabra ha cambiado realmente y no estamos hablando
    if (palabraActual && !estaHablando && palabraActual !== palabraRef.current) {
      console.log('Palabra cambió, reproduciendo:', palabraActual);
      palabraRef.current = palabraActual;
      
      const leerPalabra = async () => {
        try {
          await hablarTexto(palabraActual);
        } catch (error: unknown) {
          console.error('Error al leer palabra automáticamente:', error);
          setAudioInicializado(false);
        }
      };
      
      leerPalabra();
    }
  }, [palabraActual, estaHablando, hablarTexto]);

  // Cambiar nivel de dificultad
  const cambiarNivel = (nivel: NivelDificultad) => {
    setNivelSeleccionado(nivel);
    cargarPalabras(nivel);
  };

  // Repetir pronunciación de la palabra actual
  const repetirPronunciacion = async () => {
    if (!estaHablando && palabraActual) {
      console.log('Iniciando reproducción de palabra (manual):', palabraActual);

      // Establecer una bandera para evitar que se dispare el useEffect
      const palabraAnterior = palabraRef.current;
      palabraRef.current = palabraActual;
      
      try {
        await hablarTexto(palabraActual);
        setSilabaActual(-1); // Reiniciar sílaba seleccionada
      } catch (error) {
        console.error('Error al repetir pronunciación:', error);
        // Restaurar la referencia en caso de error
        palabraRef.current = palabraAnterior;
      }
    } else {
      console.log('No se puede reproducir:', estaHablando ? 'Ya está hablando' : 'No hay palabra actual');
    }
  };
  
  // Pronunciar una sílaba específica
  const pronunciarSilaba = (index: number) => {
    if (!estaHablando && silabasPalabraActual[index]) {
      console.log('Iniciando reproducción de sílaba:', silabasPalabraActual[index]);
      setSilabaActual(index);
      hablarSilaba(silabasPalabraActual[index]);
    } else {
      console.log('No se puede reproducir sílaba:', estaHablando ? 'Ya está hablando' : 'Sílaba no disponible');
    }
  };

  // Manejar el inicio del reconocimiento de voz
  const handleIniciarReconocimiento = async () => {
    console.log('Intentando iniciar reconocimiento de voz');
    try {
      await iniciarReconocimiento();
    } catch (error) {
      console.error('Error al iniciar reconocimiento:', error);
    }
  };

  // Verificar la palabra después de la grabación
  useEffect(() => {
    // Si tenemos un resultado y no estamos escuchando, podemos verificar
    if (
      resultadoReconocimiento && 
      estadoReconocimiento === 'procesando' && 
      !cargando
    ) {
      verificarPalabraHablada();
    }
  }, [resultadoReconocimiento, estadoReconocimiento, cargando, verificarPalabraHablada]);

  // Mostrar un indicador de estado según el estado del reconocimiento
  const getEstadoIndicador = () => {
    switch (estadoReconocimiento) {
      case 'escuchando':
        return { color: 'bg-red-500', texto: 'Escuchando...' };
      case 'procesando':
        return { color: 'bg-yellow-500', texto: 'Procesando...' };
      case 'error':
        return { color: 'bg-red-700', texto: 'Error' };
      default:
        return { color: 'bg-gray-300', texto: 'Presiona para hablar' };
    }
  };

  const estadoIndicador = getEstadoIndicador();

  // Determinar si el botón de grabar está deshabilitado
  const grabacionDeshabilitada = 
    cargando || 
    estaHablando || 
    estadoReconocimiento === 'escuchando' || 
    estadoReconocimiento === 'procesando' ||
    !palabraActual;
  
  // Obtener la palabra con el formato correcto (mayúsculas o minúsculas)
  const getPalabraFormateada = (): string => {
    return usarMayusculas ? palabraActual.toUpperCase() : palabraActual;
  };
  
  // Colores para las sílabas
  const coloresSilabas = [
    'text-red-600',
    'text-blue-600',
    'text-green-600',
    'text-purple-600',
    'text-orange-600'
  ];

  // Función para inicializar el audio con interacción del usuario
  const inicializarAudio = async () => {
    try {
      console.log('Intentando inicializar audio con interacción del usuario');
      
      // Si tenemos acceso directo a la síntesis, la inicializamos explícitamente
      if (window.speechSynthesis) {
        // Creamos una utterance temporal para desbloquear el audio
        const tempUtterance = new SpeechSynthesisUtterance('.');
        tempUtterance.volume = 0.01; // Casi silencioso
        window.speechSynthesis.speak(tempUtterance);
        
        // Cancelamos rápidamente para que no se oiga nada
        setTimeout(() => {
          window.speechSynthesis.cancel();
        }, 100);
      }
      
      // Solo reproducir un mensaje simple para inicializar
      await hablarTexto('Hola');
      setAudioInicializado(true);
      
      // No reproducimos la palabra actual aquí para evitar bucles
      // La reproducción ocurrirá en el useEffect cuando sea necesario
    } catch (error) {
      console.error('Error al inicializar audio:', error);
      // Incluso si hay error, marcamos como inicializado para que el usuario pueda seguir intentándolo
      setAudioInicializado(true);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-purple-700 mb-4">
        Practica de Lectura
      </h2>

      {/* Alerta de inicialización de audio */}
      {!audioInicializado && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          <p className="font-medium mb-2">Se necesita inicializar el audio</p>
          <p className="text-sm mb-2">Los navegadores requieren interacción del usuario para reproducir audio.</p>
          <button 
            onClick={inicializarAudio}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
          >
            Inicializar Audio
          </button>
        </div>
      )}

      {/* Opciones de configuración */}
      <div className="mb-6 space-y-4">
        {/* Selector de nivel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel de dificultad:
          </label>
          <div className="flex space-x-2">
            <button 
              onClick={() => cambiarNivel('facil')}
              className={`px-4 py-2 rounded-md ${
                nivelSeleccionado === 'facil' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Fácil
            </button>
            <button 
              onClick={() => cambiarNivel('medio')}
              className={`px-4 py-2 rounded-md ${
                nivelSeleccionado === 'medio' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Medio
            </button>
            <button 
              onClick={() => cambiarNivel('dificil')}
              className={`px-4 py-2 rounded-md ${
                nivelSeleccionado === 'dificil' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Difícil
            </button>
          </div>
        </div>
        
        {/* Opciones de visualización */}
        <div className="flex justify-between">
          {/* Selector de género de voz */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Género de voz:
            </label>
            <div className="flex space-x-2">
              <button 
                onClick={() => cambiarGeneroVoz('mujer')}
                className={`px-4 py-2 rounded-md ${
                  generoVoz === 'mujer' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Mujer
              </button>
              <button 
                onClick={() => cambiarGeneroVoz('hombre')}
                className={`px-4 py-2 rounded-md ${
                  generoVoz === 'hombre' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Hombre
              </button>
            </div>
          </div>
          
          {/* Selector de mayúsculas/minúsculas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato:
            </label>
            <div className="flex space-x-2">
              <button 
                onClick={() => cambiarUsarMayusculas(true)}
                className={`px-4 py-2 rounded-md ${
                  usarMayusculas 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                MAYÚSCULAS
              </button>
              <button 
                onClick={() => cambiarUsarMayusculas(false)}
                className={`px-4 py-2 rounded-md ${
                  !usarMayusculas 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                minúsculas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Área de palabra actual */}
      <div className="mb-8 text-center">
        {cargando ? (
          <div className="animate-pulse h-20 bg-gray-200 rounded-md flex items-center justify-center">
            <p className="text-gray-500">Cargando palabras...</p>
          </div>
        ) : palabraActual ? (
          <div className="relative">
            {/* Palabra completa */}
            <h3 className="text-5xl font-bold text-purple-800 py-4 mb-2">
              {getPalabraFormateada()}
            </h3>
            
            {/* Sílabas */}
            <div className="flex justify-center items-center space-x-1 mb-4">
              {silabasPalabraActual.map((silaba, index) => (
                <button
                  key={index}
                  onClick={() => pronunciarSilaba(index)}
                  disabled={estaHablando}
                  className={`text-4xl font-bold py-2 px-1 rounded transition-all ${
                    silabaActual === index 
                      ? `${coloresSilabas[index % coloresSilabas.length]} border-b-4 border-current`
                      : 'text-purple-800 hover:text-purple-600'
                  }`}
                >
                  {usarMayusculas ? silaba.toUpperCase() : silaba}
                </button>
              ))}
            </div>
            
            <button 
              onClick={repetirPronunciacion}
              disabled={estaHablando}
              className="absolute top-0 right-0 p-2 text-purple-600 hover:text-purple-800 disabled:text-gray-400"
              aria-label="Escuchar pronunciación"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
              </svg>
            </button>
            
            {/* Botón grande para leer la palabra */}
            <div className="mt-4">
              <button
                onClick={repetirPronunciacion}
                disabled={estaHablando}
                className="bg-purple-600 text-white py-2 px-6 rounded-full flex items-center justify-center mx-auto hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
                </svg>
                Escuchar palabra
              </button>
            </div>
          </div>
        ) : (
          <div className="h-20 bg-gray-100 rounded-md flex items-center justify-center">
            <p className="text-gray-500">No hay palabras disponibles</p>
          </div>
        )}
      </div>

      {/* Botón de grabación */}
      <div className="mb-6 flex flex-col items-center">
        <button
          onClick={handleIniciarReconocimiento}
          disabled={grabacionDeshabilitada}
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
            estadoIndicador.color
          } ${grabacionDeshabilitada ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        <span className="text-sm text-gray-600">{estadoIndicador.texto}</span>
      </div>

      {/* Resultado del reconocimiento */}
      {resultadoReconocimiento && (
        <div className="mb-6 p-3 bg-gray-100 rounded-md">
          <p className="text-sm text-gray-600 mb-1">Lo que dijiste:</p>
          <p className="text-lg font-medium">{resultadoReconocimiento}</p>
        </div>
      )}

      {/* Retroalimentación */}
      {retroalimentacion && (
        <div className={`mb-6 p-4 rounded-md ${
          respuestaCorrecta 
            ? 'bg-green-100 text-green-800' 
            : 'bg-orange-100 text-orange-800'
        }`}>
          <p className="text-lg">{retroalimentacion}</p>
        </div>
      )}

      {/* Botón siguiente */}
      <div className="flex justify-end">
        <button
          onClick={siguientePalabra}
          disabled={cargando || !palabraActual}
          className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Siguiente Palabra
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default PracticaPalabras; 