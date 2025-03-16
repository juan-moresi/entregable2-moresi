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