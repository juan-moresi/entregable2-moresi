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
     * Analiza la entrada del usuario para extraer los datos de conversión
     * @param {string} input - Texto ingresado por el usuario en formato "cantidad monedaOrigen a monedaDestino"
     * @param {string} input objeto con monto (amount), moneda origen (fromCurrency) y moneda destino (toCurrency)
     */
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

    /**
     * Maneja la entrada del usuario según el estado actual
     * @param {string} input - Entrada del usuario
     */
    handleInput = (input) => {
        if (!this.userName) {
            this.userName = input;
            localStorage.setItem('nombreUsuario', input);
            document.getElementById('userInput').placeholder = this.messages.placeholder.monto;
            this.addMessage(`${this.messages.mensajes.bienvenida} ${this.userName}! ${this.messages.mensajes.instruccion}`, 'bot');
            return;
        }

        // Verifica comando de agregar moneda
        if (input.toLowerCase() === "agregar moneda") {
            this.addCurrencyState.step = 0;
            this.addMessage(this.messages.mensajes.agregarMoneda, 'bot');
            return;
        }

        // Maneja adición de moneda si está en proceso
        if (this.addCurrencyState.step !== null) {
            this.handleAddCurrency(input);
            return;
        }

        //maneja conversión regular
        this.handleConversionStep(input);
    }

    //agregar moneda y guardarla en el localstorage 
    handleAddCurrency = (input) => {
        try {
            switch (this.addCurrencyState.step) {
                case 0: // Nombre
                    this.addCurrencyState.nombre = input;
                    this.addCurrencyState.step = 1;
                    this.addMessage(this.messages.mensajes.ingresarCodigo, 'bot');
                    break;

                case 1: // Código
                    if (input.length !== 3) {
                        throw new Error(this.messages.mensajes.codigoInvalido);
                    }
                    this.addCurrencyState.codigo = input.toUpperCase();
                    this.addCurrencyState.step = 2;
                    this.addMessage(this.messages.mensajes.ingresarTasa, 'bot');
                    break;

                case 2: // Tasa
                    const tasa = parseFloat(input);
                    if (isNaN(tasa) || tasa <= 0) {
                        throw new Error(this.messages.mensajes.tasaInvalida);
                    }
                    
                    this.converter.addCurrency(
                        this.addCurrencyState.nombre,
                        this.addCurrencyState.codigo,
                        tasa
                    );

                    // Add to conversion history
                    this.conversionHistory.push({
                        timestamp: new Date(),
                        type: 'newCurrency',
                        currency: {
                            nombre: this.addCurrencyState.nombre,
                            codigo: this.addCurrencyState.codigo,
                            tasa: tasa
                        }
                    });
                    localStorage.setItem('conversionHistory', JSON.stringify(this.conversionHistory));

                    this.addMessage(this.messages.mensajes.monedaAgregada, 'bot');
                    this.addMessage(this.messages.mensajes.instruccion, 'bot');
                    
                    // Reset states
                    this.addCurrencyState.step = null;
                    this.addCurrencyState.nombre = null;
                    this.addCurrencyState.codigo = null;
                    break;
            }
        } catch (error) {
            this.addMessage(error.message, 'error');
            // Reset on error
            this.addCurrencyState.step = null;
            this.addCurrencyState.nombre = null;
            this.addCurrencyState.codigo = null;
            this.addMessage(this.messages.mensajes.instruccion, 'bot');
        }
    }

    /**
     * Procesa cada paso de la conversión
     * @param {string} input - Entrada del usuario para el paso actual
     */
    handleConversionStep = (input) => {
        try {
            switch (this.conversionState.step) {
                case 0: // Monto
                    const amount = parseFloat(input);
                    if (isNaN(amount)) {
                        throw new Error(this.messages.mensajes.formatoInvalido);
                    }
                    this.conversionState.amount = amount;
                    this.conversionState.step = 1;
                    document.getElementById('userInput').value = ''; // Clear input
                    document.getElementById('userInput').placeholder = this.messages.placeholder.moneda;
                    this.addMessage(this.messages.mensajes.pedirMonedaOrigen, 'bot');
                    break;

                case 1: // Moneda origen
                    const fromCurrency = input.toUpperCase();
                    if (!this.converter.supportedCurrencies.includes(fromCurrency)) {
                        throw new Error(`Moneda no soportada. Monedas soportadas: ${this.converter.getSupportedCurrenciesText()}`);
                    }
                    this.conversionState.fromCurrency = fromCurrency;
                    this.conversionState.step = 2;
                    document.getElementById('userInput').value = ''; // Clear input
                    document.getElementById('userInput').placeholder = this.messages.placeholder.moneda;
                    this.addMessage(this.messages.mensajes.pedirMonedaDestino, 'bot');
                    break;

                case 2: // Moneda destino
                    const toCurrency = input.toUpperCase();
                    if (!this.converter.supportedCurrencies.includes(toCurrency)) {
                        throw new Error(`Moneda no soportada. Monedas soportadas: ${this.converter.getSupportedCurrenciesText()}`);
                    }
                    this.conversionState.toCurrency = toCurrency;
                    
                    // Realizar la conversión
                    const result = this.converter.convert(
                        this.conversionState.amount,
                        this.conversionState.fromCurrency,
                        toCurrency
                    );

                    const monedaOrigen = this.converter.monedas.find(m => m.codigo === this.conversionState.fromCurrency).nombre;
                    const monedaDestino = this.converter.monedas.find(m => m.codigo === toCurrency).nombre;

                    // guarda en el historial
                    this.conversionHistory.push({
                        timestamp: new Date(),
                        from: this.conversionState.fromCurrency,
                        to: toCurrency,
                        amount: this.conversionState.amount,
                        result: result
                    });
                    localStorage.setItem('conversionHistory', JSON.stringify(this.conversionHistory));

                    // Mostrar resultado
                    this.addMessage(
                        `${this.conversionState.amount} ${monedaOrigen} = ${result} ${monedaDestino}`,
                        'bot'
                    );

                    // Reiniciar para nueva conversión
                    this.conversionState.step = 0;
                    document.getElementById('userInput').value = ''; // Clear input
                    document.getElementById('userInput').placeholder = this.messages.placeholder.monto;
                    this.addMessage(this.messages.mensajes.instruccion, 'bot');
                    break;
            }
        } catch (error) {
            this.addMessage(error.message, 'error');
            document.getElementById('userInput').value = ''; // Clear input on error
        }
    }

    /**
     * Muestra el panel de historial de conversiones
     * Permite ver, cerrar y borrar el historial
     */
    showHistory = () => {
        const historyPanel = document.querySelector('.history-panel');
        const historyContent = document.createElement('div');
        historyContent.className = 'history-content';
        
        historyPanel.innerHTML = ''; 
        
        // agrega un Heades
        const header = document.createElement('div');
        header.className = 'history-header';
        header.innerHTML = '<h2>Historial</h2>';
        historyPanel.appendChild(header);
        
        // agrega los controles
        const controls = document.createElement('div');
        controls.className = 'history-controls';
        controls.innerHTML = `
            <button id="clearHistoryBtn" class="history-btn">${this.messages.botones.borrarHistorial}</button>
            <button id="closeHistoryBtn" class="history-btn">${this.messages.botones.cerrarHistorial}</button>
        `;
        historyPanel.appendChild(controls);
        
        // agrega el contenido
        if (this.conversionHistory.length === 0) {
            historyContent.innerHTML = `<div class="message bot-message">${this.messages.mensajes.sinHistorial}</div>`;
        } else {
            const historyHtml = this.conversionHistory.map(entry => {
                const fecha = new Date(entry.timestamp).toLocaleString();
                if (entry.type === 'newCurrency') {
                    return `<div class="message history-message">
                        ${fecha}: Nueva moneda agregada - ${entry.currency.nombre} (${entry.currency.codigo}) - Tasa: ${entry.currency.tasa}
                    </div>`;
                } else {
                    const monedaOrigen = this.converter.monedas.find(m => m.codigo === entry.from).nombre;
                    const monedaDestino = this.converter.monedas.find(m => m.codigo === entry.to).nombre;
                    return `<div class="message history-message">
                        ${fecha}: ${entry.amount} ${monedaOrigen} = ${entry.result} ${monedaDestino}
                    </div>`;
                }
            }).join('');
            historyContent.innerHTML = historyHtml;
        }
        historyPanel.appendChild(historyContent);
        historyPanel.classList.add('active');

        // agrega eventos
        document.getElementById('closeHistoryBtn').addEventListener('click', () => {
            historyPanel.classList.remove('active');
        });

        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
                this.conversionHistory = [];
                localStorage.removeItem('conversionHistory');
                this.showHistory();
            }
        });
    }

    //mostrar monedas disponibles
    showCurrencies = () => {
        this.addMessage('Monedas disponibles:', 'bot');
        
        this.converter.monedas.forEach(moneda => {
            this.addMessage(`* ${moneda.nombre} (${moneda.codigo})`, 'bot');
        });
        
        this.addMessage(this.messages.mensajes.instruccion, 'bot');
    }

    //borrar chat
    clearChat = () => {
        const messagesDiv = document.getElementById('chatMessages');
        messagesDiv.innerHTML = '';
        this.addMessage(this.messages.mensajes.instruccion, 'bot');
    }
}

