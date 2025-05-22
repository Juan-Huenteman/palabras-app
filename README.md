# ¡Aprendamos a Leer!

Una aplicación web desarrollada con Next.js para ayudar a niños de 4 años a aprender a leer. La aplicación utiliza la API de Gemini para reconocimiento de voz y la Web Speech API para síntesis de voz.

## Características

- 🎤 Reconocimiento de voz para capturar lo que dice el niño
- 🔊 Síntesis de voz para pronunciar palabras
- 🧠 Integración con la API de Gemini para verificar la pronunciación
- 📚 Diferentes niveles de dificultad (sílabas, palabras simples, palabras más complejas)
- 👍 Retroalimentación amigable y comprensiva

## Requisitos previos

- Node.js 18 o superior
- Una clave API de Gemini (se puede obtener en [Google AI Studio](https://ai.google.dev/))

## Instalación

1. Clona este repositorio o descárgalo
2. Navega al directorio del proyecto
3. Instala las dependencias:

```bash
cd palabras-app
npm install
```

## Configuración

La aplicación requiere una clave API de Gemini para funcionar. Tienes dos opciones para configurarla:

### Opción 1: Usar un archivo .env.local (recomendado)

1. Crea un archivo `.env.local` en la raíz del proyecto
2. Añade tu clave API en este formato:
```
NEXT_PUBLIC_GEMINI_API_KEY=tu_clave_api_aquí
```
3. Reinicia la aplicación si ya estaba en ejecución

### Opción 2: Ingresar la clave manualmente

Cuando ejecutes la aplicación, se te pedirá que ingreses esta clave antes de poder usar todas las funcionalidades.

## Uso

1. Inicia la aplicación en modo desarrollo:

```bash
npm run dev
```

2. Abre [http://localhost:3000](http://localhost:3000) en tu navegador
3. Si no has configurado la clave API en el archivo .env.local, ingrésala cuando se te solicite
4. Selecciona un nivel de dificultad (Fácil, Medio, Difícil)
5. Se mostrará una palabra que también será pronunciada automáticamente
6. El niño puede presionar el botón "Escuchar palabra" para volver a escuchar la pronunciación
7. Para practicar, el niño debe presionar el botón del micrófono y leer la palabra en voz alta
8. La aplicación verificará la pronunciación y proporcionará retroalimentación
9. Continúa con más palabras usando el botón "Siguiente Palabra"

## Tecnologías utilizadas

- [Next.js](https://nextjs.org/) - Framework de React
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [API de Gemini](https://ai.google.dev/) - IA para verificación de pronunciación
- [Web Speech API](https://developer.mozilla.org/es/docs/Web/API/Web_Speech_API) - Para reconocimiento y síntesis de voz

## Consideraciones importantes

- La aplicación requiere permisos de micrófono para funcionar
- Funciona mejor en navegadores modernos como Chrome, Edge o Firefox
- La síntesis de voz funciona mejor si hay voces en español instaladas en el sistema
- Se requiere una conexión a internet para comunicarse con la API de Gemini

## Licencia

Este proyecto está bajo la Licencia MIT - consulta el archivo LICENSE para más detalles.

## Contacto

Si tienes preguntas o sugerencias, no dudes en contactarnos.
