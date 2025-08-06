// Configuração dinâmica para ambiente local ou produção
const API_BASE_URL = window.location.origin + '/api';

// Cliente HTTP para comunicação com a API
class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('token');
    }

    // Configurar token de autenticação
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    // Obter headers padrão
    getHeaders(contentType = 'application/json') {
        const headers = {
            'Content-Type': contentType
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // Fazer requisição HTTP
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };
        const response = await fetch(url, config);
        if (!response.ok) {
            throw new Error(`Erro ao acessar ${url}: ${response.status}`);
        }
        return await response.json();
    }
}

// Tornar disponíveis globalmente
window.api = new ApiClient();
window.API_BASE_URL = API_BASE_URL;
