//objeto de textos
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
        agregarMoneda: "Para agregar una nueva moneda, ingresa el nombre completo:",
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

//clase contructora para manejar las monedas
class CurrencyConverter {
    constructor() {
        // Cargar monedas guardadas desde localStorage o usar valores predeterminados
        this.monedas = JSON.parse(localStorage.getItem('currencies')) || [
            { codigo: "USD", nombre: "Dólares estadounidenses", tasa: 1.0 },
            { codigo: "EUR", nombre: "Euros", tasa: 0.96 },
            { codigo: "ARS", nombre: "Pesos argentinos", tasa: 1057.77 },
        ];
        this.supportedCurrencies = this.monedas.map(moneda => moneda.codigo);
    }

    //agregar moneda
    addCurrency(nombre, codigo, tasa) {
        codigo = codigo.toUpperCase();
        if (this.supportedCurrencies.includes(codigo)) {
            throw new Error(textos.mensajes.monedaExistente);
        }
        this.monedas.push({ codigo, nombre, tasa: parseFloat(tasa) });
        this.supportedCurrencies = this.monedas.map(moneda => moneda.codigo);
        
        // guardado en el localstorage
        localStorage.setItem('currencies', JSON.stringify(this.monedas));
    }

    //lista de monedas soportadas
    getSupportedCurrenciesText() {
        return this.supportedCurrencies.join(', ');
    }

    //conversor
    convert(amount, fromCurrency, toCurrency) {
        const fromCurrencyData = this.monedas.find(m => m.codigo === fromCurrency);
        const toCurrencyData = this.monedas.find(m => m.codigo === toCurrency);
        
        if (!fromCurrencyData || !toCurrencyData) {
            throw new Error('Moneda no encontrada');
        }

        //primero convierte a USD
        const amountInUSD = amount / fromCurrencyData.tasa;
        const result = amountInUSD * toCurrencyData.tasa;
        
        return parseFloat(result.toFixed(2));
    }
}

//clase chatbot maneja la interaccion con el usuario
class ChatBot {
    constructor() {
        // Inicializa el convertidor y estado del chat
        this.converter = new CurrencyConverter();
        this.userName = '';
        this.messages = textos;
        // Carga el historial desde localStorage o inicia uno nuevo
        this.conversionHistory = JSON.parse(localStorage.getItem('conversionHistory')) || [];
        
        // Estado actual de la conversión
        this.conversionState = {
            step: 0,         
            amount: null,
            fromCurrency: null,
            toCurrency: null
        };

        // Estado para agregar moneda
        this.addCurrencyState = {
            step: null,      
            nombre: null,
            codigo: null
        };

        this.initialize();
    }

    //Inicializa el chatbot y configura el estado inicial - Verifica si hay un usuario guardado y muestra el mensaje apropiado
    
    initialize() {
        this.userName = localStorage.getItem('nombreUsuario');
        if (!this.userName) {
            this.addMessage(this.messages.mensajes.solicitarNombre, 'bot');
            document.getElementById('userInput').placeholder = this.messages.placeholder.nombre;
        } else {
            this.addMessage(`${this.messages.mensajes.bienvenida} ${this.userName}! ${this.messages.mensajes.instruccion}`, 'bot');
            document.getElementById('userInput').placeholder = this.messages.placeholder.monto;
        }
    }

    /**
     * Agrega un mensaje al chat
     * @param {string} text - Texto del mensaje
     * @param {string} type - Tipo de mensaje 
     */
    addMessage = (text, type) => {
        const messagesDiv = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = text;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }; 

    parseInput = (input) => {
        const regex = /(\d+)\s+(\w+)\s+a\s+(\w+)/i;
        const match = input.match(regex);
        
        if (!match) {
            throw new Error(this.messages.mensajes.formatoInvalido);
        }

        const [, amount, fromCurrency, toCurrency] = match;
        const upperFromCurrency = fromCurrency.toUpperCase();
        const upperToCurrency = toCurrency.toUpperCase();

        if (!this.converter.supportedCurrencies.includes(upperFromCurrency) || 
            !this.converter.supportedCurrencies.includes(upperToCurrency)) {
            throw new Error(`Moneda no soportada. Monedas soportadas: ${this.converter.getSupportedCurrenciesText()}`);
        }

        return {
            amount: parseFloat(amount),
            fromCurrency: upperFromCurrency,
            toCurrency: upperToCurrency
        };
    }