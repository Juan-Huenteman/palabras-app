'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReconocimientoVoz, SintesisVoz, EstadoReconocimiento, GeneroVoz, dividirEnSilabas } from '../services/speech';
import { initGemini, verificarPronunciacion, generarPalabras } from '../api/gemini';

// Tipos para el contexto
interface AppContextProps {
  // Estado general
  cargando: boolean;
  error: string | null;
  
  // Gemini API
  geminiAPI: GoogleGenerativeAI | null;
  setApiKey: (key: string) => void;
  apiKeyEstablecida: boolean;
  
  // Palabras y sílabas
  palabras: string[];
  palabraActual: string;
  silabasPalabraActual: string[];
  cargarPalabras: (nivel: 'facil' | 'medio' | 'dificil', letraInicial?: string) => Promise<void>;
  siguientePalabra: () => void;
  
  // Reconocimiento de voz
  estadoReconocimiento: EstadoReconocimiento;
  resultadoReconocimiento: string;
  iniciarReconocimiento: () => Promise<void>;
  detenerReconocimiento: () => void;
  
  // Síntesis de voz
  hablarTexto: (texto: string) => void;
  hablarSilaba: (silaba: string) => void;
  estaHablando: boolean;
  detenerVoz: () => void;
  generoVoz: GeneroVoz;
  cambiarGeneroVoz: (genero: GeneroVoz) => void;
  
  // Opciones de visualización
  usarMayusculas: boolean;
  cambiarUsarMayusculas: (valor: boolean) => void;
  silabaActual: number;
  setSilabaActual: (index: number) => void;
  letraInicial: string;
  setLetraInicial: (letra: string) => void;
  
  // Verificación y retroalimentación
  verificarPalabraHablada: () => Promise<void>;
  retroalimentacion: string;
  respuestaCorrecta: boolean | null;
}

// Crear el contexto
const AppContext = createContext<AppContextProps | undefined>(undefined);

// Proveedor del contexto
export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Estado general
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // API de Gemini
  const [apiKey, setApiKey] = useState<string>('');
  const [geminiAPI, setGeminiAPI] = useState<GoogleGenerativeAI | null>(null);
  const [apiKeyEstablecida, setApiKeyEstablecida] = useState<boolean>(false);
  
  // Palabras y sílabas
  const [palabras, setPalabras] = useState<string[]>([]);
  const [indicePalabraActual, setIndicePalabraActual] = useState<number>(0);
  const [silabasPalabraActual, setSilabasPalabraActual] = useState<string[]>([]);
  const [silabaActual, setSilabaActual] = useState<number>(-1);
  const [letraInicial, setLetraInicial] = useState<string>('');
  
  // Obtener la palabra actual usando useMemo para evitar problemas de inicialización
  const palabraActual = useMemo(() => palabras[indicePalabraActual] || '', [palabras, indicePalabraActual]);
  
  // Opciones de visualización
  const [usarMayusculas, setUsarMayusculas] = useState<boolean>(true);
  
  // Reconocimiento y síntesis de voz
  const [reconocimientoVoz, setReconocimientoVoz] = useState<ReconocimientoVoz | null>(null);
  const [sintesisVoz, setSintesisVoz] = useState<SintesisVoz | null>(null);
  const [estadoReconocimiento, setEstadoReconocimiento] = useState<EstadoReconocimiento>('inactivo');
  const [resultadoReconocimiento, setResultadoReconocimiento] = useState<string>('');
  const [estaHablando, setEstaHablando] = useState<boolean>(false);
  const [generoVoz, setGeneroVoz] = useState<GeneroVoz>('mujer');
  
  // Verificación y retroalimentación
  const [retroalimentacion, setRetroalimentacion] = useState<string>('');
  const [respuestaCorrecta, setRespuestaCorrecta] = useState<boolean | null>(null);

  // Inicializar servicios en el lado del cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const reconocimiento = new ReconocimientoVoz();
      const sintesis = new SintesisVoz();
      
      setReconocimientoVoz(reconocimiento);
      setSintesisVoz(sintesis);
      
      // Establecer el género de voz inicial
      sintesis.setGenero(generoVoz);
      
      // Inicializar la síntesis de voz (esto requerirá interacción del usuario)
      sintesis.inicializar().then(inicializado => {
        console.log('Síntesis de voz inicializada:', inicializado);
      }).catch(err => {
        console.error('Error al inicializar síntesis:', err);
      });
      
      // Suscribirse a eventos del reconocimiento
      reconocimiento.onResultado((texto) => {
        setResultadoReconocimiento(texto);
      });
      
      reconocimiento.onEstadoChange((estado) => {
        setEstadoReconocimiento(estado);
      });
      
      // Verificar si hay una clave API en el .env o en localStorage
      const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      const savedApiKey = localStorage.getItem('gemini-api-key');
      
      // Priorizar la API key del .env, si existe
      if (envApiKey) {
        try {
          const api = initGemini(envApiKey);
          setGeminiAPI(api);
          setApiKeyEstablecida(true);
        } catch (error) {
          console.error('Error al inicializar Gemini con la API key del .env:', error);
          // Si falla, intentar con la clave guardada en localStorage
          if (savedApiKey) {
            setApiKey(savedApiKey);
            try {
              const api = initGemini(savedApiKey);
              setGeminiAPI(api);
              setApiKeyEstablecida(true);
            } catch (err) {
              setError('Error al configurar la API de Gemini');
            }
          }
        }
      } else if (savedApiKey) {
        // Si no hay API key en .env, usar la de localStorage
        setApiKey(savedApiKey);
        try {
          const api = initGemini(savedApiKey);
          setGeminiAPI(api);
          setApiKeyEstablecida(true);
        } catch (error) {
          setError('Error al configurar la API de Gemini');
        }
      }
    }
  }, [generoVoz]);

  // Actualizar las sílabas cuando cambia la palabra actual
  useEffect(() => {
    if (palabraActual) {
      const silabas = dividirEnSilabas(palabraActual);
      setSilabasPalabraActual(silabas);
      setSilabaActual(-1); // Restablecer el índice de sílaba
    }
  }, [palabraActual]);

  // Actualizar la API de Gemini cuando cambia la clave
  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    try {
      const api = initGemini(key);
      setGeminiAPI(api);
      setApiKeyEstablecida(true);
      localStorage.setItem('gemini-api-key', key);
    } catch (error) {
      setError('Error al configurar la API de Gemini');
      setApiKeyEstablecida(false);
    }
  };

  // Cargar palabras según el nivel
  const cargarPalabras = async (nivel: 'facil' | 'medio' | 'dificil' = 'facil', letraInicial: string = '') => {
    if (!geminiAPI) return;
    
    setCargando(true);
    setError(null);
    
    try {
      const nuevasPalabras = await generarPalabras(geminiAPI, nivel, 10, letraInicial);
      setPalabras(nuevasPalabras);
      setIndicePalabraActual(0);
      
      // Hablar la primera palabra si hay sintesis disponible
      if (sintesisVoz && nuevasPalabras.length > 0) {
        sintesisVoz.hablar(nuevasPalabras[0]);
        setEstaHablando(true);
        
        // Dividir en sílabas
        const silabas = dividirEnSilabas(nuevasPalabras[0]);
        setSilabasPalabraActual(silabas);
        setSilabaActual(-1); // No hay sílaba seleccionada al inicio
      }
    } catch (error) {
      console.error('Error al cargar palabras:', error);
      setError('Hubo un problema al cargar las palabras. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // Pasar a la siguiente palabra
  const siguientePalabra = () => {
    if (palabras.length === 0) return;
    
    const nuevoIndice = (indicePalabraActual + 1) % palabras.length;
    setIndicePalabraActual(nuevoIndice);
    
    // Reiniciar estado
    setRetroalimentacion('');
    setRespuestaCorrecta(null);
    setResultadoReconocimiento('');
    setSilabaActual(-1);
    
    // Hablar la nueva palabra
    if (sintesisVoz) {
      sintesisVoz.hablar(palabras[nuevoIndice]);
      setEstaHablando(true);
    }
  };

  // Iniciar reconocimiento de voz
  const iniciarReconocimiento = async () => {
    if (!reconocimientoVoz) return;
    
    try {
      await reconocimientoVoz.iniciar();
    } catch (error) {
      setError('Error al iniciar reconocimiento de voz');
    }
  };

  // Detener reconocimiento de voz
  const detenerReconocimiento = () => {
    if (reconocimientoVoz) {
      reconocimientoVoz.detener();
    }
  };

  // Hacer que la app hable
  const hablarTexto = async (texto: string) => {
    if (!sintesisVoz) {
      console.error('Error: sintesisVoz no está disponible');
      return;
    }
    
    console.log('Intentando hablar:', texto);
    
    try {
      setEstaHablando(true);
      
      // Timeout de seguridad (forzar a false después de un tiempo máximo)
      const timeoutMaximo = setTimeout(() => {
        console.log('Timeout máximo alcanzado, reseteando estado');
        setEstaHablando(false);
      }, texto.length * 500); // Tiempo aproximado basado en longitud del texto
      
      // Llamada asíncrona al método hablar
      await sintesisVoz.hablar(texto);
      
      // Si llegamos aquí, la síntesis ha terminado correctamente
      console.log('Síntesis completada correctamente');
      setEstaHablando(false);
      clearTimeout(timeoutMaximo);
    } catch (error) {
      console.error('Error al hablar:', error);
      setEstaHablando(false);
    }
  };
  
  // Hablar una sílaba específica
  const hablarSilaba = async (silaba: string) => {
    if (!sintesisVoz) return;
    
    try {
      setEstaHablando(true);
      
      // Timeout de seguridad (forzar a false después de un tiempo máximo)
      const timeoutMaximo = setTimeout(() => {
        console.log('Timeout máximo de sílaba alcanzado, reseteando estado');
        setEstaHablando(false);
      }, 2000); // 2 segundos máximo para una sílaba
      
      // Llamada asíncrona al método hablar
      await sintesisVoz.hablar(silaba, 0.8); // Un poco más lento para enfatizar
      
      // Si llegamos aquí, la síntesis ha terminado correctamente
      console.log('Síntesis de sílaba completada correctamente');
      setEstaHablando(false);
      clearTimeout(timeoutMaximo);
    } catch (error) {
      console.error('Error al hablar sílaba:', error);
      setEstaHablando(false);
    }
  };

  // Detener la síntesis de voz
  const detenerVoz = () => {
    if (sintesisVoz) {
      sintesisVoz.detener();
      setEstaHablando(false);
    }
  };
  
  // Cambiar el género de la voz
  const cambiarGeneroVoz = (genero: GeneroVoz) => {
    setGeneroVoz(genero);
    if (sintesisVoz) {
      sintesisVoz.setGenero(genero);
    }
  };
  
  // Cambiar el uso de mayúsculas
  const cambiarUsarMayusculas = (valor: boolean) => {
    setUsarMayusculas(valor);
  };

  // Verificar la palabra pronunciada
  const verificarPalabraHablada = async () => {
    if (!geminiAPI || !palabraActual || !resultadoReconocimiento) return;
    
    setCargando(true);
    
    try {
      const resultado = await verificarPronunciacion(
        geminiAPI,
        palabraActual,
        resultadoReconocimiento
      );
      
      setRetroalimentacion(resultado.retroalimentacion);
      setRespuestaCorrecta(resultado.correcto);
      
      // Decir la retroalimentación
      if (sintesisVoz) {
        sintesisVoz.hablar(resultado.retroalimentacion);
        setEstaHablando(true);
      }
    } catch (error) {
      setError('Error al verificar la pronunciación');
    } finally {
      setCargando(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        cargando,
        error,
        geminiAPI,
        setApiKey: handleSetApiKey,
        apiKeyEstablecida,
        palabras,
        palabraActual,
        silabasPalabraActual,
        cargarPalabras,
        siguientePalabra,
        estadoReconocimiento,
        resultadoReconocimiento,
        iniciarReconocimiento,
        detenerReconocimiento,
        hablarTexto,
        hablarSilaba,
        estaHablando,
        detenerVoz,
        generoVoz,
        cambiarGeneroVoz,
        usarMayusculas,
        cambiarUsarMayusculas,
        silabaActual,
        setSilabaActual,
        letraInicial,
        setLetraInicial,
        verificarPalabraHablada,
        retroalimentacion,
        respuestaCorrecta
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Hook para usar el contexto
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext debe ser usado dentro de un AppProvider');
  }
  return context;
}; 