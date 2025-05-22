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
  cantidad: number = 10
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
    
    const prompt = `
      Genera una lista de ${cantidad} palabras en español para que una niña de 4 años practique lectura.
      Las palabras deben ser ${complejidad}
      Responde solamente con las palabras separadas por comas, sin ningún texto adicional.
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Limpiamos y dividimos las palabras
    return response
      .replace(/[^\w,áéíóúñÁÉÍÓÚÑ]/g, '')
      .split(',')
      .map(palabra => palabra.trim())
      .filter(palabra => palabra.length > 0);
  } catch (error) {
    console.error('Error al generar palabras:', error);
    // Devolvemos algunas palabras por defecto en caso de error
    return ['ma', 'pa', 'si', 'no', 'sol', 'pan', 'oso', 'casa'];
  }
}; 