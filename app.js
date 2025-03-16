import ChatBot from './scripts/ChatBot.js';

// Crear una única instancia del chatbot
let chatbot;

// Función para cerrar todos los paneles
function closeAllPanels() {
    const panels = ['.history-panel', '.currencies-panel', '.currency-form-panel'];
    panels.forEach(selector => {
        const panel = document.querySelector(selector);
        if (panel) panel.classList.remove('show');
    });
}

function clearFormErrors() {
    ['nameError', 'codeError', 'rateError'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '';
    });
}

function resetCurrencyForm() {
    const currencyForm = document.getElementById('currencyForm');
    if (currencyForm) currencyForm.reset();
    clearFormErrors();
}

// Función para  envío de mensajes del usuario
function handleUserMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    
    if (message) {
        chatbot.addMessage(message, 'user');
        chatbot.handleInput(message);
        userInput.value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar chatbot
    chatbot = new ChatBot();
    
    // Deshabilitar botones si no hay usuario guardado
    if (!localStorage.getItem('nombreUsuario')) {
        document.querySelectorAll('.utility-buttons button').forEach(button => {
            button.disabled = true;
        });
    }
    
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', handleUserMessage);
    }
    
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleUserMessage();
            }
        });
    }
    
    // Configurar botones de paneles
    const buttonActions = {
        'historyBtn': () => chatbot.showHistory(),
        'showCurrenciesBtn': () => chatbot.showCurrencies(),
        'addCurrencyBtn': () => {
            const currencyFormPanel = document.querySelector('.currency-form-panel');
            if (currencyFormPanel) currencyFormPanel.classList.add('show');
        }
    };
    
    Object.entries(buttonActions).forEach(([id, action]) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', () => {
                closeAllPanels();
                action();
            });
        }
    });
    
    const closeButtons = [
        { selector: '.close-history', resetForm: false },
        { selector: '.close-currencies', resetForm: false },
        { selector: '.close-currency-form', resetForm: true }
    ];
    
    closeButtons.forEach(btn => {
        const closeBtn = document.querySelector(btn.selector);
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeAllPanels();
                if (btn.resetForm) {
                    resetCurrencyForm();
                }
            });
        }
    });
    
    const cancelCurrencyBtn = document.getElementById('cancelCurrency');
    if (cancelCurrencyBtn) {
        cancelCurrencyBtn.addEventListener('click', () => {
            closeAllPanels();
            resetCurrencyForm();
        });
    }
    
    // Configurar envío del formulario de monedas
    const currencyForm = document.getElementById('currencyForm');
    if (currencyForm) {
        currencyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearFormErrors();
            
            const nombre = document.getElementById('currencyName').value.trim();
            const codigo = document.getElementById('currencyCode').value.trim();
            const tasa = document.getElementById('currencyRate').value;
            
            let isValid = true;
            const validationRules = [
                { id: 'nameError', condition: !nombre, message: 'El nombre es obligatorio' },
                { id: 'codeError', condition: !codigo, message: 'El código es obligatorio' },
                { id: 'codeError', condition: codigo.length !== 3, message: 'El código debe tener exactamente 3 letras' },
                { id: 'rateError', condition: !tasa, message: 'La tasa es obligatoria' },
                { id: 'rateError', condition: parseFloat(tasa) <= 0, message: 'La tasa debe ser un número positivo' }
            ];
            
            validationRules.forEach(rule => {
                if (rule.condition) {
                    document.getElementById(rule.id).textContent = rule.message;
                    isValid = false;
                }
            });
            
            if (isValid) {
                const success = chatbot.addCurrencyFromForm(nombre, codigo, tasa);
                
                if (success) {
                    closeAllPanels();
                    resetCurrencyForm();
                }
            }
        });
    }
});


    