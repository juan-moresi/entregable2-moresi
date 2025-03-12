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

