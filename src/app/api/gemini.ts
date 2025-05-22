import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar la API de Gemini
export const initGemini = (apiKey: string = '') => {
  // Usar la API key del archivo .env si está disponible
  const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const finalApiKey = envApiKey || apiKey;
  
  if (!finalApiKey) {
    throw new Error('No se proporcionó una API key para Gemini');
  }
  
  return new GoogleGenerativeAI(finalApiKey);
};

// Función para verificar pronunciación
export const verificarPronunciacion = async (
  genAI: GoogleGenerativeAI,
  palabraEsperada: string,
  audioPronunciado: string
): Promise<{ correcto: boolean; retroalimentacion: string }> => {
  try {
    // Obtener el modelo de Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Crear un prompt para evaluar la pronunciación
    const prompt = `
      Actúa como un profesor amable para niños de 4 años que están aprendiendo a leer.
      
      La palabra que se esperaba que el niño pronunciara es: "${palabraEsperada}".
      Lo que el niño dijo fue: "${audioPronunciado}".
      
      ¿Pronunció correctamente la palabra o sílaba? Responde solo con "sí" o "no" seguido de una breve explicación amigable.
      Si hay un error leve, sé comprensivo y da retroalimentación positiva.
    `;
    
    // Generar respuesta
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Analizar respuesta para determinar si fue correcto
    const correcto = response.toLowerCase().includes('sí');
    
    return {
      correcto,
      retroalimentacion: response
    };
  } catch (error) {
    console.error('Error al verificar pronunciación:', error);
    return {
      correcto: false,
      retroalimentacion: 'Lo siento, hubo un problema al revisar tu pronunciación. ¡Inténtalo de nuevo!'
    };
  }
};

// Generar palabras simples para practicar
export const generarPalabras = async (
  genAI: GoogleGenerativeAI,
  nivel: 'facil' | 'medio' | 'dificil' = 'facil',
  cantidad: number = 10,
  letraInicial: string = ''
): Promise<string[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    let complejidad = '';
    switch (nivel) {
      case 'facil':
        complejidad = 'palabras muy simples de 2-4 letras, sílabas básicas como "ma", "pa", "si", "no", etc.';
        break;
      case 'medio':
        complejidad = 'palabras simples de 4-8 letras como "casa", "mesa", "sol", "pan", etc.';
        break;
      case 'dificil':
        complejidad = 'palabras de mas de 8 letras como "perro", "gato", "libro", "agua", etc.';
        break;
    }
    
    let prompt = `
      Genera una lista de ${cantidad} palabras en español para que una niña de 4 años practique lectura.
      Las palabras deben ser ${complejidad}
    `;
    
    // Agregar restricción de letra inicial si se especificó
    if (letraInicial && letraInicial.length > 0) {
      prompt += `
      IMPORTANTE: Todas las palabras DEBEN comenzar con la letra "${letraInicial.toLowerCase()}".
      `;
    }
    
    prompt += `
      Responde solamente con las palabras separadas por comas, sin ningún texto adicional.
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Limpiamos y dividimos las palabras
    let palabras = response
      .replace(/[^\w,áéíóúñÁÉÍÓÚÑ]/g, '')
      .split(',')
      .map(palabra => palabra.trim())
      .filter(palabra => palabra.length > 0);
      
    // Filtro adicional por si el modelo no respeta la restricción de letra inicial
    if (letraInicial && letraInicial.length > 0) {
      palabras = palabras.filter(palabra => 
        palabra.toLowerCase().startsWith(letraInicial.toLowerCase())
      );
      
      // Si no tenemos suficientes palabras, agregamos algunas por defecto con esa letra
      if (palabras.length < 3) {
        const palabrasDefecto: Record<string, string[]> = {
          'a': ['ala', 'agua', 'amor', 'ave', 'año'],
          'b': ['boca', 'beso', 'bota', 'barco', 'bebé'],
          'c': ['casa', 'cola', 'cama', 'calle', 'cuna'],
          'd': ['dedo', 'día', 'dado', 'dama', 'dulce'],
          'e': ['eso', 'era', 'eje', 'eco', 'elfo'],
          'f': ['foca', 'feo', 'foto', 'fila', 'flor'],
          'g': ['gato', 'gol', 'goma', 'gris', 'grande'],
          'h': ['hola', 'hora', 'hijo', 'hada', 'huevo'],
          'i': ['isla', 'idea', 'igual', 'ir', 'imán'],
          'j': ['jugo', 'jaula', 'jefe', 'jamón', 'jugar'],
          'k': ['kilo', 'kiwi', 'koala', 'karate', 'kétchup'],
          'l': ['luna', 'loco', 'lápiz', 'lazo', 'leer'],
          'm': ['mesa', 'mamá', 'mar', 'mano', 'miel'],
          'n': ['nube', 'nido', 'nadar', 'noche', 'nariz'],
          'o': ['oso', 'ojo', 'oro', 'ocho', 'oval'],
          'p': ['papá', 'pato', 'pelo', 'pie', 'pan'],
          'q': ['queso', 'quince', 'querer', 'quemar', 'quizás'],
          'r': ['rojo', 'rana', 'reloj', 'risa', 'rata'],
          's': ['sol', 'sopa', 'seis', 'sapo', 'silla'],
          't': ['taza', 'toro', 'tres', 'tela', 'tío'],
          'u': ['uva', 'uno', 'usar', 'unir', 'útil'],
          'v': ['vaca', 'ver', 'vaso', 'viaje', 'volar'],
          'w': ['web', 'wafle', 'wifi', 'western', 'whisky'],
          'x': ['xilófono', 'rayos x', 'xi', 'xenón'],
          'y': ['yo', 'ya', 'yema', 'yuyo', 'yoga'],
          'z': ['zapato', 'zero', 'zoo', 'zorro', 'zumo']
        };
        
        const letra = letraInicial.toLowerCase();
        if (palabrasDefecto[letra]) {
          palabras = palabras.concat(palabrasDefecto[letra]);
        }
      }
    }
    
    // Si después de todo no tenemos palabras, usamos algunas por defecto
    if (palabras.length === 0) {
      palabras = ['ma', 'pa', 'si', 'no', 'sol', 'pan', 'oso', 'casa'];
    }
    
    return palabras;
  } catch (error) {
    console.error('Error al generar palabras:', error);
    // Devolvemos algunas palabras por defecto en caso de error
    return ['ma', 'pa', 'si', 'no', 'sol', 'pan', 'oso', 'casa'];
  }
}; 