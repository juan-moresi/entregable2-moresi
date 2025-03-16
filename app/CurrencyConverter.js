/* Clase para conversiones de moneda */
class CurrencyConverter {
    constructor() {
        // Monedas desde localStorage o predeterminadas
        this.monedas = JSON.parse(localStorage.getItem('currencies')) || [
            { codigo: "USD", nombre: "Dólares estadounidenses", tasa: 1.0 },
            { codigo: "EUR", nombre: "Euros", tasa: 0.96 },
            { codigo: "ARS", nombre: "Pesos argentinos", tasa: 1057.77 },
        ];
        this.supportedCurrencies = this.monedas.map(moneda => moneda.codigo);
    }

    addCurrency(nombre, codigo, tasa) {
        codigo = codigo.toUpperCase();
        if (this.monedas.some(m => m.codigo === codigo)) {
            throw new Error("Esta moneda ya existe.");
        }
        this.monedas.push({ codigo, nombre, tasa: parseFloat(tasa) });
        this.supportedCurrencies = this.monedas.map(moneda => moneda.codigo);
    }

    getSupportedCurrenciesText() {
        return this.supportedCurrencies.join(', ');
    }

    // Obtener todas las monedas
    getAllCurrencies() {
        return this.monedas;
    }