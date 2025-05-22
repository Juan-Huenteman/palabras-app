// Tipos para el reconocimiento de voz
export type EstadoReconocimiento = 'inactivo' | 'escuchando' | 'procesando' | 'error';
export type GeneroVoz = 'mujer' | 'hombre';

// Interfaz para el servicio de reconocimiento de voz
export interface ReconocimientoVozServicio {
  iniciar: () => Promise<void>;
  detener: () => void;
  estado: EstadoReconocimiento;
  resultado: string;
  error: string | null;
}

// Clase para manejar el reconocimiento de voz
export class ReconocimientoVoz implements ReconocimientoVozServicio {
  private reconocimiento: SpeechRecognition | null = null;
  private _estado: EstadoReconocimiento = 'inactivo';
  private _resultado: string = '';
  private _error: string | null = null;
  private onResultadoCallback: ((texto: string) => void) | null = null;
  private onEstadoChangeCallback: ((estado: EstadoReconocimiento) => void) | null = null;
  private timeoutId: number | null = null;
  private isMovilDevice: boolean = false;

  constructor() {
    // Verificar si el navegador soporta reconocimiento de voz
    if (typeof window !== 'undefined') {
      // Detectar si es un dispositivo móvil
      this.isMovilDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.reconocimiento = new SpeechRecognition();
        this.configurarReconocimiento();
      } else {
        this._error = 'Tu navegador no soporta reconocimiento de voz.';
        this._estado = 'error';
      }
    }
  }

  private configurarReconocimiento() {
    if (!this.reconocimiento) return;

    this.reconocimiento.lang = 'es-ES';
    this.reconocimiento.continuous = false;
    this.reconocimiento.interimResults = true; // Permitir resultados intermedios para mejor respuesta en móviles
    this.reconocimiento.maxAlternatives = 1;

    // En móviles, usar parámetros optimizados
    if (this.isMovilDevice) {
      console.log('Configurando para dispositivo móvil');
    }

    this.reconocimiento.onstart = () => {
      this._estado = 'escuchando';
      this._resultado = '';
      this._error = null;
      this.onEstadoChangeCallback?.(this._estado);
      
      // Establecer un timeout más largo para dispositivos móviles
      const timeoutDuration = this.isMovilDevice ? 10000 : 7000;
      
      // Crear un timeout para asegurarse de que el reconocimiento no se queda atascado
      this.timeoutId = setTimeout(() => {
        console.log('Timeout de reconocimiento alcanzado');
        if (this._estado === 'escuchando') {
          this.detener();
          this._resultado = ''; // Limpiar resultado si no se detectó nada
          this._estado = 'inactivo';
          this.onEstadoChangeCallback?.(this._estado);
        }
      }, timeoutDuration);
    };

    this.reconocimiento.onresult = (event) => {
      // Procesar resultados intermedios o finales
      const isFinal = event.results[0].isFinal;
      const resultado = event.results[0][0].transcript;
      
      this._resultado = resultado;
      
      // Si es un resultado final o estamos en móvil con un resultado suficiente
      if (isFinal || (this.isMovilDevice && resultado.length > 2)) {
        // Limpiar el timeout ya que tenemos un resultado
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
        
        // Notificar del resultado
        this.onResultadoCallback?.(resultado);
        
        // En móviles, detener explícitamente después de obtener un resultado
        if (this.isMovilDevice) {
          this.detener();
        }
      }
    };

    this.reconocimiento.onerror = (event) => {
      // Limpiar timeout si existe
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      
      // En móviles, algunos errores son esperados y no deberían interrumpir la experiencia
      if (this.isMovilDevice && (event.error === 'no-speech' || event.error === 'aborted')) {
        console.log(`Error móvil ignorado: ${event.error}`);
        this._estado = 'inactivo';
        this.onEstadoChangeCallback?.(this._estado);
        return;
      }
      
      this._error = `Error de reconocimiento: ${event.error}`;
      console.error(this._error);
      this._estado = 'error';
      this.onEstadoChangeCallback?.(this._estado);
    };

    this.reconocimiento.onend = () => {
      // Limpiar timeout si existe
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      
      if (this._estado !== 'error') {
        this._estado = this._resultado ? 'procesando' : 'inactivo';
        this.onEstadoChangeCallback?.(this._estado);
        
        // Después de procesar, volvemos a inactivo
        if (this._estado === 'procesando') {
          setTimeout(() => {
            this._estado = 'inactivo';
            this.onEstadoChangeCallback?.(this._estado);
          }, 500);
        }
      }
    };
  }

  public async iniciar(): Promise<void> {
    if (!this.reconocimiento) {
      this._error = 'El reconocimiento de voz no está disponible.';
      this._estado = 'error';
      this.onEstadoChangeCallback?.(this._estado);
      throw new Error(this._error);
    }

    try {
      // Intentar solicitar permiso explícitamente para el micrófono
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('Permiso de micrófono concedido');
          
          // Verificar que el micrófono está recibiendo datos (solo para diagnóstico)
          if (this.isMovilDevice) {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const source = audioCtx.createMediaStreamSource(stream);
              const analyser = audioCtx.createAnalyser();
              source.connect(analyser);
              
              // No conectamos al destino para evitar retroalimentación
              console.log('Stream de audio verificado correctamente');
            } catch (audioError) {
              console.warn('No se pudo analizar el stream de audio:', audioError);
              // Continuamos de todos modos
            }
          }
          
        } catch (permissionError) {
          console.error('Error al solicitar permiso del micrófono:', permissionError);
          this._error = `Error de permisos: ${permissionError}`;
          this._estado = 'error';
          this.onEstadoChangeCallback?.(this._estado);
          throw permissionError;
        }
      }
      
      // En dispositivos móviles, reiniciar variables antes de iniciar
      if (this.isMovilDevice) {
        this._resultado = '';
        this._error = null;
      }
      
      // Iniciar reconocimiento después de verificar permisos
      this.reconocimiento.start();
      console.log('Reconocimiento iniciado');
    } catch (error) {
      this._error = `Error al iniciar reconocimiento: ${error}`;
      this._estado = 'error';
      this.onEstadoChangeCallback?.(this._estado);
      throw error;
    }
  }

  public detener(): void {
    // Limpiar timeout si existe
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.reconocimiento) {
      try {
        if (this._estado === 'escuchando') {
          this.reconocimiento.stop();
          console.log('Reconocimiento detenido manualmente');
        }
      } catch (error) {
        console.error('Error al detener reconocimiento:', error);
        // No actualizamos el estado aquí para evitar confusión
      }
    }
  }

  public onResultado(callback: (texto: string) => void): void {
    this.onResultadoCallback = callback;
  }

  public onEstadoChange(callback: (estado: EstadoReconocimiento) => void): void {
    this.onEstadoChangeCallback = callback;
  }

  get estado(): EstadoReconocimiento {
    return this._estado;
  }

  get resultado(): string {
    return this._resultado;
  }

  get error(): string | null {
    return this._error;
  }
}

// Clase para manejar la síntesis de voz (text-to-speech)
export class SintesisVoz {
  private sintesis: SpeechSynthesis | null = null;
  private voz: SpeechSynthesisVoice | null = null;
  private generoSeleccionado: GeneroVoz = 'mujer';
  private vocesPorGenero: {
    mujer: SpeechSynthesisVoice | null;
    hombre: SpeechSynthesisVoice | null;
  } = {
    mujer: null,
    hombre: null
  };
  private audioCtx: AudioContext | null = null;
  private inicializado: boolean = false;
  private _ultimoTextoHablado: string = '';
  private _ultimoTiempoHablado: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.sintesis = window.speechSynthesis;
      this.cargarVoces();
      
      // No creamos AudioContext automáticamente, solo cuando haya interacción del usuario
      this.audioCtx = null;
    }
  }

  // Método para inicializar el audio con interacción del usuario
  public async inicializar(): Promise<boolean> {
    if (this.inicializado) return true;
    
    try {
      // Crear AudioContext solo cuando se llame a inicializar (después de interacción del usuario)
      if (!this.audioCtx && typeof window !== 'undefined') {
        try {
          this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          console.log('AudioContext creado correctamente');
        } catch (err) {
          console.error('Error al crear AudioContext:', err);
        }
      }
      
      // Intenta resumir el contexto de audio si existe y está suspendido
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
        console.log('AudioContext reanudado correctamente');
      }
      
      // Reproducir un sonido silencioso para desbloquear el audio
      if (this.sintesis) {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0.01; // Casi silencioso
        utterance.rate = 1;
        utterance.pitch = 1;
        
        return new Promise<boolean>((resolve) => {
          utterance.onend = () => {
            console.log('Audio desbloqueado');
            this.inicializado = true;
            resolve(true);
          };
          
          utterance.onerror = (err) => {
            console.warn('Error al inicializar audio:', err);
            // Incluso con error, intentamos continuar
            this.inicializado = true;
            resolve(true);
          };
          
          this.sintesis.speak(utterance);
          
          // Por si el evento onend nunca se dispara
          setTimeout(() => {
            if (!this.inicializado) {
              console.log('Timeout al inicializar audio, continuando de todos modos');
              this.inicializado = true;
              resolve(true);
            }
          }, 1000);
        });
      }
      
      this.inicializado = true;
      return true;
    } catch (err) {
      console.error('Error al inicializar audio:', err);
      // Incluso con error, marcamos como inicializado para intentar continuar
      this.inicializado = true;
      return true;
    }
  }

  private cargarVoces(): void {
    if (!this.sintesis) return;

    // Esperar a que las voces estén disponibles
    const obtenerVoces = () => {
      const voces = this.sintesis?.getVoices() || [];
      
      // Intentar encontrar voces en español por género
      // Generalmente las voces femeninas tienen "female" en el nombre o descripción
      this.vocesPorGenero.mujer = voces.find(voz => 
        (voz.lang.includes('es') || voz.name.toLowerCase().includes('spanish')) &&
        (voz.name.toLowerCase().includes('female') || 
         voz.name.toLowerCase().includes('mujer') ||
         !voz.name.toLowerCase().includes('male'))
      ) || null;
      
      // Voces masculinas generalmente tienen "male" en el nombre o descripción
      this.vocesPorGenero.hombre = voces.find(voz => 
        (voz.lang.includes('es') || voz.name.toLowerCase().includes('spanish')) &&
        (voz.name.toLowerCase().includes('male') && 
         !voz.name.toLowerCase().includes('female'))
      ) || null;
      
      // Si no encontramos una voz específica por género, usamos cualquier voz en español
      const vozEspañolGeneral = voces.find(voz => 
        voz.lang.includes('es') || voz.name.toLowerCase().includes('spanish')
      );
      
      if (!this.vocesPorGenero.mujer) this.vocesPorGenero.mujer = vozEspañolGeneral || voces[0];
      if (!this.vocesPorGenero.hombre) this.vocesPorGenero.hombre = vozEspañolGeneral || voces[0];
      
      // Establecer la voz según el género seleccionado por defecto
      this.voz = this.vocesPorGenero[this.generoSeleccionado];
    };

    if (this.sintesis.onvoiceschanged !== undefined) {
      this.sintesis.onvoiceschanged = obtenerVoces;
    }
    
    // También intentamos obtener las voces inmediatamente
    obtenerVoces();
  }
  
  public setGenero(genero: GeneroVoz): void {
    this.generoSeleccionado = genero;
    this.voz = this.vocesPorGenero[genero];
  }
  
  public getGenero(): GeneroVoz {
    return this.generoSeleccionado;
  }

  // Método para detener cualquier síntesis en curso con un retraso opcional
  private async detenerConRetraso(retrasoMs: number = 0): Promise<void> {
    if (this.sintesis?.speaking) {
      this.sintesis.cancel();
      
      // Si se solicita un retraso, esperamos antes de continuar
      if (retrasoMs > 0) {
        await new Promise(resolve => setTimeout(resolve, retrasoMs));
      }
    }
  }

  public async hablar(texto: string, ritmo: number = 1, tono: number = 1): Promise<void> {
    if (!this.sintesis) {
      console.error('Síntesis de voz no disponible');
      return;
    }

    // Guardamos el texto para verificar bucles
    const ultimoTexto = texto;
    
    // Verificar si es una repetición inmediata (posible bucle)
    if (this._ultimoTextoHablado === ultimoTexto && Date.now() - this._ultimoTiempoHablado < 500) {
      console.warn('Posible bucle detectado. Evitando repetición inmediata de:', ultimoTexto);
      return;
    }

    // Intentar inicializar primero
    if (!this.inicializado) {
      const inicializado = await this.inicializar();
      if (!inicializado) {
        console.error('No se pudo inicializar el audio. Se requiere interacción del usuario.');
        return;
      }
    }

    try {
      // Detener cualquier síntesis en curso y esperar un pequeño retraso
      // para evitar errores de "interrupted"
      await this.detenerConRetraso(50);
      
      console.log('Iniciando síntesis de voz para:', texto);
      
      const utterance = new SpeechSynthesisUtterance(texto);
      
      if (this.voz) {
        utterance.voice = this.voz;
        console.log('Usando voz:', this.voz.name);
      } else {
        console.warn('No hay voz seleccionada, usando voz por defecto');
      }
      
      utterance.lang = 'es-ES';
      utterance.rate = ritmo;  // 0.1 a 10, donde 1 es normal
      utterance.pitch = tono;  // 0 a 2, donde 1 es normal
      utterance.volume = 1;    // 0 a 1

      // Registrar este texto como el último hablado
      this._ultimoTextoHablado = ultimoTexto;
      this._ultimoTiempoHablado = Date.now();

      // Crear una promesa que se resuelve cuando termina de hablar o hay un error
      return new Promise((resolve, reject) => {
        // Agregar manejadores de eventos para depuración
        utterance.onstart = () => console.log('Comenzó a hablar');
        
        utterance.onend = () => {
          console.log('Terminó de hablar (evento onend)');
          resolve();
          
          // A veces el evento onend se dispara pero speaking sigue en true
          // Forzamos una verificación adicional
          setTimeout(() => {
            if (this.sintesis?.speaking) {
              console.log('Forzando finalización de síntesis...');
              this.sintesis.cancel();
            }
          }, 100);
        };
        
        utterance.onerror = (event) => {
          console.error('Error en síntesis:', event);
          
          if (event.error === 'not-allowed') {
            console.warn('Audio bloqueado por el navegador. Se requiere interacción del usuario.');
            this.inicializado = false;
            reject(new Error('Audio bloqueado'));
          } else if (event.error === 'interrupted') {
            console.warn('Síntesis interrumpida, posiblemente por otra solicitud de habla');
            // No consideramos una interrupción como un error completo
            resolve();
          } else {
            reject(new Error(`Error de síntesis: ${event.error}`));
          }
        };

        this.sintesis.speak(utterance);
      });
    } catch (error) {
      console.error('Error al iniciar síntesis de voz:', error);
      this.detener(); // Asegurar que se cancela en caso de error
      throw error;
    }
  }

  public detener(): void {
    this.sintesis?.cancel();
  }

  public get estaHablando(): boolean {
    return this.sintesis?.speaking || false;
  }
}

// Función para dividir una palabra en sílabas
export function dividirEnSilabas(palabra: string): string[] {
  // Algoritmo básico para dividir palabras en español en sílabas
  const palabra_limpia = palabra.toLowerCase().trim();
  const vocales = 'aáeéiíoóuúü';
  const silabas: string[] = [];
  
  let silaba_actual = '';
  let i = 0;
  
  while (i < palabra_limpia.length) {
    silaba_actual += palabra_limpia[i];
    
    // Si la letra actual es una vocal
    if (vocales.includes(palabra_limpia[i])) {
      // Si es la última letra o la siguiente no es vocal, cerramos la sílaba
      if (i + 1 >= palabra_limpia.length || !vocales.includes(palabra_limpia[i + 1])) {
        // Excepto en caso de diptongos (combinaciones específicas de vocales)
        const siguienteSilaba = i + 1 < palabra_limpia.length ? palabra_limpia.substring(i + 1) : '';
        
        // Si quedan al menos 2 consonantes, la primera va con esta sílaba, 
        // el resto con la siguiente
        if (i + 2 < palabra_limpia.length && 
            !vocales.includes(palabra_limpia[i + 1]) && 
            !vocales.includes(palabra_limpia[i + 2])) {
          // Excepción para consonantes inseparables (pr, pl, br, bl, etc.)
          const consonantesInseparables = ['pr', 'pl', 'br', 'bl', 'fr', 'fl', 'cr', 'cl', 'gr', 'gl', 'dr', 'tr', 'tl'];
          const siguientesDosConsonantes = palabra_limpia.substring(i + 1, i + 3);
          
          if (consonantesInseparables.includes(siguientesDosConsonantes)) {
            // Ambas consonantes van con la siguiente sílaba
            silabas.push(silaba_actual);
            silaba_actual = '';
          } else {
            // La primera consonante va con la sílaba actual
            silaba_actual += palabra_limpia[i + 1];
            i++;
            silabas.push(silaba_actual);
            silaba_actual = '';
          }
        } else {
          silabas.push(silaba_actual);
          silaba_actual = '';
        }
      }
    }
    
    i++;
  }
  
  // Agregar cualquier sílaba restante
  if (silaba_actual !== '') {
    silabas.push(silaba_actual);
  }
  
  return silabas;
}

// Declaraciones globales para TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
    AudioContext: typeof AudioContext;
    webkitAudioContext: any;
  }
} 