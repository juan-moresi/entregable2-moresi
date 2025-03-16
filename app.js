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