import CurrencyConverter from './CurrencyConverter.js';

// Objeto de textos - sin cambios
const textos = {
    titulo: "Chat de Conversión de Monedas",
    placeholder: {
        nombre: "Escribe tu nombre...",
        monto: "Escribe un monto...",
        moneda: "Escribe el código de la moneda..."
    },
    mensajes: {
        bienvenida: "Bienvenido",
        instruccion: "Para comenzar la conversión, ingresa el monto:",
        formatoInvalido: "Por favor ingresa solo números",
        monedaNoSoportada: "Moneda no soportada. Monedas soportadas: USD, EUR, ARS",
        solicitarNombre: "Por favor, ingresa tu nombre para comenzar:",
        pedirMonedaOrigen: "Ingresa la moneda de origen (USD, EUR, ARS):",
        pedirMonedaDestino: "Ingresa la moneda destino (USD, EUR, ARS):",
        historial: "Historial de conversiones:",
        sinHistorial: "No hay conversiones en el historial.",
        agregarMoneda: "Para agregar una nueva moneda, ingresa el nombre completo de la moneda:",
        ingresarCodigo: "Ingresa el código de 3 letras para la moneda:",
        ingresarTasa: "Ingresa la tasa de cambio en relación al dólar (USD):",
        monedaAgregada: "Moneda agregada exitosamente.",
        codigoInvalido: "El código debe ser de 3 letras.",
        tasaInvalida: "La tasa debe ser un número válido.",
        monedaExistente: "Esta moneda ya existe."
    },
    botones: {
        enviar: "Enviar",
        verHistorial: "Ver Historial",
        cerrarHistorial: "Cerrar",
        borrarHistorial: "Borrar Historial",
        agregarMoneda: "Agregar Moneda",
        borrarChat: "Borrar Chat" 
    },
};

// Clase principal del chatbot
class ChatBot {
    constructor() {
        this.converter = new CurrencyConverter();
        this.userName = localStorage.getItem('nombreUsuario') || '';
        this.messages = textos;
        this.conversionHistory = JSON.parse(localStorage.getItem('conversionHistory')) || [];
        
        this.conversionState = { step: 0, amount: null, fromCurrency: null, toCurrency: null };
        this.addCurrencyState = { step: null, nombre: null, codigo: null };

        this.initialize();
        this.initAutocomplete();
        this.addClearChatButton();  
    }

    // Inicializa el chatbot
    initialize() {
        const userInput = document.getElementById('userInput');
        
        if (!this.userName) {
            this.addMessage(this.messages.mensajes.solicitarNombre, 'bot');
            userInput.placeholder = this.messages.placeholder.nombre;
        } else {
            this.addMessage(`${this.messages.mensajes.bienvenida} ${this.userName}! ${this.messages.mensajes.instruccion}`, 'bot');
            userInput.placeholder = this.messages.placeholder.monto;
        }
    }

    // Agrega un mensaje al chat
    addMessage(text, type) {
        const messagesDiv = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = text;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Maneja la entrada del usuario
    handleInput(input) {
        // Manejo del nombre de usuario
        if (!this.userName) {
            if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(input)) {
                this.addMessage("Por favor ingresa un nombre válido (solo letras)", 'error');
                return;
            }
            
            this.userName = input;
            localStorage.setItem('nombreUsuario', input);
            document.getElementById('userInput').placeholder = this.messages.placeholder.monto;
            this.addMessage(`${this.messages.mensajes.bienvenida} ${this.userName}! ${this.messages.mensajes.instruccion}`, 'bot');
            
            // Habilitar botones
            document.querySelectorAll('.utility-buttons button').forEach(button => {
                button.disabled = false;
            });
            
            return;
        }

        // Verifica comando de agregar moneda
        if (input.toLowerCase() === "agregar moneda") {
            this.addCurrencyState.step = 0;
            this.addMessage(this.messages.mensajes.agregarMoneda, 'bot');
            return;
        }

        // Maneja adición de moneda o conversión
        if (this.addCurrencyState.step !== null) {
            this.handleAddCurrency(input);
        } else {
            this.handleConversionStep(input);
        }
    }

    // Maneja el proceso de agregar moneda
    handleAddCurrency(input) {
        try {
            switch (this.addCurrencyState.step) {
                case 0: // Nombre
                    this.addCurrencyState.nombre = input;
                    this.addCurrencyState.step = 1;
                    this.addMessage(this.messages.mensajes.ingresarCodigo, 'bot');
                    break;

                case 1: // Código
                    const cleanCode = input.trim();
                    if (cleanCode.length !== 3) {
                        throw new Error(this.messages.mensajes.codigoInvalido);
                    }
                    this.addCurrencyState.codigo = cleanCode.toUpperCase();
                    this.addCurrencyState.step = 2;
                    this.addMessage(this.messages.mensajes.ingresarTasa, 'bot');
                    break;

                case 2: // Tasa
                    const tasa = parseFloat(input);
                    if (isNaN(tasa) || tasa <= 0) {
                        throw new Error(this.messages.mensajes.tasaInvalida);
                    }
                    
                    this.addNewCurrency(
                        this.addCurrencyState.nombre,
                        this.addCurrencyState.codigo,
                        tasa
                    );
                    
                    // Reiniciar estados
                    this.resetAddCurrencyState();
                    break;
            }
        } catch (error) {
            this.addMessage(error.message, 'error');
            this.resetAddCurrencyState();
        }
    }

    // Reinicia el estado de agregar moneda
    resetAddCurrencyState() {
        this.addCurrencyState.step = null;
        this.addCurrencyState.nombre = null;
        this.addCurrencyState.codigo = null;
        this.addMessage(this.messages.mensajes.instruccion, 'bot');
    }

    // Agrega una nueva moneda
    addNewCurrency(nombre, codigo, tasa) {
        this.converter.addCurrency(nombre, codigo, tasa);
        
        // Agregar al historial
        this.conversionHistory.push({
            timestamp: new Date(),
            type: 'newCurrency',
            currency: { nombre, codigo, tasa }
        });
        
        this.saveState();
        this.addMessage(this.messages.mensajes.monedaAgregada, 'bot');
    }