import CurrencyConverter from './CurrencyConverter.js';

// Objeto de textos
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
        this.addClearChatButton();  // Uncommented this line
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

        // Verificar comando de agregar moneda
        if (input.toLowerCase() === "agregar moneda") {
            this.addCurrencyState.step = 0;
            this.addMessage(this.messages.mensajes.agregarMoneda, 'bot');
            return;
        }

        //  Agrega moneda o conversión
        if (this.addCurrencyState.step !== null) {
            this.handleAddCurrency(input);
        } else {
            this.handleConversionStep(input);
        }
    }

    //  Proceso de agregar moneda
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

    // Guarda el estado en localStorage
    saveState() {
        // Limitar el historial a las últimas 7 conversiones
        if (this.conversionHistory.length > 7) {
            this.conversionHistory = this.conversionHistory.slice(-7);
        }
        
        localStorage.setItem('currencies', JSON.stringify(this.converter.monedas));
        localStorage.setItem('conversionHistory', JSON.stringify(this.conversionHistory));
    }

    // Pasos de conversión
    handleConversionStep(input) {
        try {
            switch (this.conversionState.step) {
                case 0: // Monto
                    const amount = parseFloat(input);
                    if (isNaN(amount)) {
                        throw new Error(this.messages.mensajes.formatoInvalido);
                    }
                    this.conversionState.amount = amount;
                    this.conversionState.step = 1;
                    this.updateInputPlaceholder(this.messages.placeholder.moneda);
                    this.addMessage(this.messages.mensajes.pedirMonedaOrigen, 'bot');
                    break;

                case 1: // Moneda origen
                    this.validateAndSetCurrency(input, 'fromCurrency');
                    this.conversionState.step = 2;
                    this.updateInputPlaceholder(this.messages.placeholder.moneda);
                    this.addMessage(this.messages.mensajes.pedirMonedaDestino, 'bot');
                    break;
                    
                case 2: // Moneda destino
                    this.validateAndSetCurrency(input, 'toCurrency');
                    this.performConversion();
                    break;
            }
        } catch (error) {
            this.addMessage(error.message, 'error');
            this.resetConversionState();
        }
    }
    
    // Valida y establece una moneda
    validateAndSetCurrency(input, stateProperty) {
        const currency = input.trim().toUpperCase();
        if (!this.converter.supportedCurrencies.includes(currency)) {
            throw new Error(`Moneda no soportada. Monedas soportadas: ${this.converter.getSupportedCurrenciesText()}`);
        }
        this.conversionState[stateProperty] = currency;
        this.clearUserInput();
    }
    
    // Realiza la conversión
    performConversion() {
        const { amount, fromCurrency, toCurrency } = this.conversionState;
        const result = this.converter.convert(amount, fromCurrency, toCurrency);
        
        const monedaOrigen = this.converter.monedas.find(m => m.codigo === fromCurrency).nombre;
        const monedaDestino = this.converter.monedas.find(m => m.codigo === toCurrency).nombre;
        
        // Guardar en historial
        this.conversionHistory.push({
            timestamp: new Date(),
            from: fromCurrency,
            to: toCurrency,
            amount: amount,
            result: result
        });
        
        this.saveState();
        
        // Mostrar resultado
        this.showConversionResult(amount, monedaOrigen, result, monedaDestino);
        
        // Reiniciar para próxima conversión
        this.resetConversionState();
    }
    
    // Muestra el resultado de la conversión
    showConversionResult(amount, fromName, result, toName) {
        const resultMessage = document.createElement('div');
        resultMessage.className = 'message bot-message conversion-result';
        resultMessage.textContent = `${amount} ${fromName} = ${result} ${toName}`;
        document.getElementById('chatMessages').appendChild(resultMessage);
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    }
    
    // Reinicia el estado de conversión
    resetConversionState() {
        this.conversionState.step = 0;
        this.conversionState.amount = null;
        this.conversionState.fromCurrency = null;
        this.updateInputPlaceholder(this.messages.placeholder.monto);
        this.addMessage(this.messages.mensajes.instruccion, 'bot');
    }
    
    // Actualiza el placeholder del input
    updateInputPlaceholder(text) {
        const userInput = document.getElementById('userInput');
        if (userInput) userInput.placeholder = text;
    }
    
    // Limpia el campo de entrada
    clearUserInput() {
        const userInput = document.getElementById('userInput');
        if (userInput) userInput.value = '';
    }

    // Muestra el historial de conversiones
    showHistory() {
        // Eliminar panel existente si lo hay
        const existingPanel = document.querySelector('.history-panel');
        if (existingPanel) {
            existingPanel.classList.remove('show');
            setTimeout(() => existingPanel.remove(), 300);
            return;
        }

        // Crear panel de historial
        const historyPanel = this.createPanel('history-panel', this.messages.mensajes.historial);
        
        // Crear contenedor de botones
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'history-panel-buttons';
        
        // Agregar botones
        const closeBtn = this.createButton('close-history', this.messages.botones.cerrarHistorial, 
            () => this.closePanel(historyPanel));
        
        const clearBtn = this.createButton('clear-history', this.messages.botones.borrarHistorial, 
            () => this.clearHistory(historyPanel));
        
        buttonsContainer.appendChild(closeBtn);
        buttonsContainer.appendChild(clearBtn);
        historyPanel.appendChild(buttonsContainer);

        // Crea contenedor para elementos del historial
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'history-items-container';
        historyPanel.appendChild(itemsContainer);
        
        // Muestra elementos del historial o mensaje de vacío
        if (this.conversionHistory.length === 0) {
            this.showEmptyHistoryMessage(itemsContainer);
        } else {
            this.populateHistoryItems(itemsContainer);
        }
        
        // Muestra panel con animación
        this.showPanel(historyPanel);
    }
    
    // Muestra mensaje de historial vacío
    showEmptyHistoryMessage(container) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-history-message';
        emptyMessage.textContent = this.messages.mensajes.sinHistorial;
        container.appendChild(emptyMessage);
    }
    
    // Rellena el historial
    populateHistoryItems(container) {
        // Ordenar historial por fecha (más reciente primero)
        const sortedHistory = [...this.conversionHistory].reverse();
        
        sortedHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            // Formatear fecha
            const date = new Date(item.timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            // Crear contenido según tipo de item
            if (item.type === 'newCurrency') {
                historyItem.innerHTML = `
                    <div class="history-date">${formattedDate}</div>
                    <div class="history-content">
                        Nueva moneda: <strong>${item.currency.codigo}</strong> (${item.currency.nombre})
                        <br>Tasa: ${item.currency.tasa} USD
                    </div>
                `;
            } else {
                // Obtener nombres completos de monedas
                const monedaOrigen = this.converter.monedas.find(m => m.codigo === item.from)?.nombre || item.from;
                const monedaDestino = this.converter.monedas.find(m => m.codigo === item.to)?.nombre || item.to;
                
                // Mostrar conversión
                historyItem.innerHTML = `
                    <div class="history-date">${formattedDate}</div>
                    <div class="history-content">
                        <strong>${item.amount} ${item.from}</strong> (${monedaOrigen}) → 
                        <strong>${item.result} ${item.to}</strong> (${monedaDestino})
                    </div>
                `;
            }
            
            container.appendChild(historyItem);
        });
    }
    
    // Limpia el historial
    clearHistory(panel) {
        if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
            this.conversionHistory = [];
            localStorage.removeItem('conversionHistory');
            
            // Actualizar panel
            panel.remove();
            this.showHistory();
            
            this.addMessage('Historial borrado correctamente.', 'bot');
        }
    }
    
    // Crea un panel
    createPanel(className, title) {
        const panel = document.createElement('div');
        panel.className = className;
        
        const header = document.createElement('h2');
        header.textContent = title;
        panel.appendChild(header);
        
        return panel;
    }
    
    // Crea un botón
    createButton(className, text, onClick) {
        const button = document.createElement('button');
        button.className = className;
        button.textContent = text;
        button.onclick = onClick;
        return button;
    }
    
    // Cierra un panel
    closePanel(panel) {
        panel.classList.remove('show');
        setTimeout(() => panel.remove(), 300);
    }
    
    // Muestra un panel
    showPanel(panel) {
        document.body.appendChild(panel);
        panel.offsetHeight; // Force reflow
        panel.classList.add('show');
    }
    
    // Muestra panel de monedas disponibles
    showCurrencies() {
        const existingPanel = document.querySelector('.currencies-panel');
        if (existingPanel) {
            existingPanel.classList.remove('show');
            setTimeout(() => existingPanel.remove(), 300);
            return;
        }

        // Crear panel
        const currenciesPanel = document.createElement('div');
        currenciesPanel.className = 'currencies-panel';
        
        // Crear encabezado
        const header = document.createElement('h2');
        header.textContent = 'Monedas Disponibles';
        currenciesPanel.appendChild(header);

        // Crear botón de cierre
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-currencies';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => {
            currenciesPanel.classList.remove('show');
            setTimeout(() => currenciesPanel.remove(), 300);
        };
        currenciesPanel.appendChild(closeBtn);
        
        // Crear campo de búsqueda
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'currency-search';
        searchInput.placeholder = 'Buscar moneda...';
        currenciesPanel.appendChild(searchInput);
        
        // Crear contenedor de tabla
        const tableContainer = document.createElement('div');
        tableContainer.className = 'currencies-table-container';
        currenciesPanel.appendChild(tableContainer);

        // Crear tabla de monedas
        const table = document.createElement('table');
        table.className = 'currencies-table centered-table';
        
        // Crear encabezado de tabla
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Agregar celdas de encabezado
        ['Código', 'Nombre', 'Tasa (USD)'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            th.className = 'centered-cell';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Crear cuerpo de tabla
        const tbody = document.createElement('tbody');
        const currencies = this.converter.getAllCurrencies();
        
        if (currencies.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 3;
            emptyCell.className = 'no-currencies-message centered-cell';
            emptyCell.textContent = 'No hay monedas disponibles';
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
        } else {
            currencies.forEach(currency => {
                const row = document.createElement('tr');
                
                // Celda de código
                const codeCell = document.createElement('td');
                codeCell.className = 'currency-code-cell centered-cell';
                codeCell.textContent = currency.codigo;
                row.appendChild(codeCell);
                
                // Celda de nombre
                const nameCell = document.createElement('td');
                nameCell.className = 'currency-name-cell centered-cell';
                nameCell.textContent = currency.nombre;
                row.appendChild(nameCell);
                
                // Celda de tasa
                const rateCell = document.createElement('td');
                rateCell.className = 'currency-rate-cell centered-cell';
                rateCell.textContent = currency.tasa;
                row.appendChild(rateCell);
                
                tbody.appendChild(row);
            });
        }
        
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        // Filtrar monedas al buscar
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const rows = tbody.querySelectorAll('tr');
            
            rows.forEach(row => {
                if (row.querySelector('.no-currencies-message')) return;
                
                const code = row.querySelector('.currency-code-cell')?.textContent.toLowerCase() || '';
                const name = row.querySelector('.currency-name-cell')?.textContent.toLowerCase() || '';
                
                if (code.includes(searchTerm) || name.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
        
        document.body.appendChild(currenciesPanel);
        currenciesPanel.offsetHeight; // Force reflow
        currenciesPanel.classList.add('show');
    }
        
    // Agrega botón para borrar chat
    addClearChatButton() {
        const chatHeader = document.querySelector('.chat-header');
        if (!chatHeader) return;
        
        // Eliminar botones existentes
        const existingButtons = document.querySelectorAll('#clearChatBtn');
        existingButtons.forEach(button => button.remove());
        
        // Crear botón si no existe
        if (!document.getElementById('clearChatBtn')) {
            const clearChatBtn = document.createElement('button');
            clearChatBtn.id = 'clearChatBtn';
            clearChatBtn.textContent = this.messages.botones.borrarChat;
            
            const boundClearChat = this.clearChat.bind(this);
            clearChatBtn.addEventListener('click', boundClearChat);
            
            chatHeader.appendChild(clearChatBtn);
        }
    }
    
    // Borra todos los mensajes
    clearChat() {
        const confirmClear = confirm('¿Estás seguro de que quieres borrar todo el chat?');
        
        if (confirmClear) {
            const messagesDiv = document.getElementById('chatMessages');
            if (messagesDiv) {
                messagesDiv.innerHTML = '';
                
                // Reiniciar estados
                this.conversionState = { step: 0, amount: null, fromCurrency: null, toCurrency: null };
                this.addCurrencyState = { step: null, nombre: null, codigo: null };
                
                // Mostrar mensaje de bienvenida
                this.addMessage(`${this.messages.mensajes.bienvenida} ${this.userName}! ${this.messages.mensajes.instruccion}`, 'bot');
            }
        }
    }
    
    // Inicializa autocompletado
    initAutocomplete() {
        const userInput = document.getElementById('userInput');
        if (!userInput) return;
        
        // Crear contenedor
        const autocompleteContainer = document.createElement('div');
        autocompleteContainer.className = 'autocomplete-container';
        userInput.parentNode.appendChild(autocompleteContainer);
        
        // Agregar evento de entrada
        userInput.addEventListener('input', () => {
            // Solo mostrar sugerencias en pasos de moneda
            if (this.conversionState.step !== 1 && this.conversionState.step !== 2) {
                autocompleteContainer.innerHTML = '';
                return;
            }
            
            const inputValue = userInput.value.trim().toUpperCase();
            if (!inputValue) {
                autocompleteContainer.innerHTML = '';
                return;
            }
            
            // Obtener monedas coincidentes
            const currencies = this.converter.getAllCurrencies();
            const matches = currencies.filter(currency => 
                currency.codigo.includes(inputValue) || 
                currency.nombre.toLowerCase().includes(inputValue.toLowerCase())
            );
            
            // Mostrar coincidencias
            autocompleteContainer.innerHTML = '';
            if (matches.length > 0) {
                matches.forEach(currency => {
                    const suggestion = document.createElement('div');
                    suggestion.className = 'autocomplete-item';
                    suggestion.innerHTML = `<strong>${currency.codigo}</strong> - ${currency.nombre}`;
                    suggestion.addEventListener('click', () => {
                        userInput.value = currency.codigo;
                        autocompleteContainer.innerHTML = '';
                        userInput.focus();
                    });
                    autocompleteContainer.appendChild(suggestion);
                });
            }
        });
        
        // Ocultar sugerencias al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (e.target !== userInput && !autocompleteContainer.contains(e.target)) {
                autocompleteContainer.innerHTML = '';
            }
        });
        
        // Navegación con teclado
        userInput.addEventListener('keydown', (e) => {
            const items = autocompleteContainer.querySelectorAll('.autocomplete-item');
            if (!items.length) return;
            
            let activeIndex = Array.from(items).findIndex(item => 
                item.classList.contains('active')
            );
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (activeIndex < 0) {
                        items[0].classList.add('active');
                    } else {
                        items[activeIndex].classList.remove('active');
                        activeIndex = (activeIndex + 1) % items.length;
                        items[activeIndex].classList.add('active');
                    }
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    if (activeIndex < 0) {
                        items[items.length - 1].classList.add('active');
                    } else {
                        items[activeIndex].classList.remove('active');
                        activeIndex = (activeIndex - 1 + items.length) % items.length;
                        items[activeIndex].classList.add('active');
                    }
                    break;
                    
                case 'Enter':
                    if (activeIndex >= 0) {
                        e.preventDefault();
                        items[activeIndex].click();
                    }
                    break;
                    
                case 'Escape':
                    autocompleteContainer.innerHTML = '';
                    break;
            }
        });
    }

    // Agrega moneda desde formulario
    addCurrencyFromForm(name, code, rate) {
        try {
            // Validar entradas
            if (!name || !code || !rate) return false;
            
            code = code.toUpperCase();
            rate = parseFloat(rate);
            
            if (code.length !== 3 || isNaN(rate) || rate <= 0) return false;
            
            this.addNewCurrency(name, code, rate);
            this.addMessage(`Moneda ${code} (${name}) agregada exitosamente.`, 'bot');
            
            return true;
        } catch (error) {
            console.error('Error adding currency:', error);
            this.addMessage('Ocurrió un error al agregar la moneda.', 'bot');
            return false;
        }
    }
}

export default ChatBot;