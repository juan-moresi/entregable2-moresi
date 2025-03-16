import ChatBot from './scripts/ChatBot.js';

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

// Función el envío de mensajes del usuario
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
    