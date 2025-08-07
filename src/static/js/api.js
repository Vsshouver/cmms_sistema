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

// Instanciar cliente e expor URL base
const api = new ApiClient();
window.API_BASE_URL = API_BASE_URL;

// Helper para operações CRUD básicas
const createCRUD = (base) => ({
    getAll: () => api.request(base),
    get: (id) => api.request(`${base}/${id}`),
    create: (data) => api.request(base, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => api.request(`${base}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => api.request(`${base}/${id}`, {
        method: 'DELETE'
    })
});

// Módulos da API
const API = {
    setToken: (token) => api.setToken(token),
    auth: {
        login: (credentials) => api.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),
        logout: () => api.request('/auth/logout', { method: 'POST' }),
        me: () => api.request('/auth/me')
    },
    equipments: createCRUD('/equipamentos'),
    equipmentTypes: {
        getAll: () => api.request('/tipos-equipamento')
    },
    workOrders: {
        ...createCRUD('/ordens-servico'),
        getMechanicAlerts: () => api.request('/ordens-servico/alertas')
    },
    mechanics: createCRUD('/mecanicos'),
    maintenanceTypes: createCRUD('/tipos-manutencao'),
    tires: {
        ...createCRUD('/pneus'),
        getAlerts: () => api.request('/pneus/alertas')
    },
    inventory: {
        ...createCRUD('/estoque'),
        movement: (id, data) => api.request(`/estoque/${id}/movimentacoes`, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    },
    itemGroups: createCRUD('/grupos-item'),
    users: {
        ...createCRUD('/usuarios'),
        resetPassword: (id) => api.request(`/usuarios/${id}/reset-password`, {
            method: 'POST'
        })
    },
    dashboard: {
        getStats: () => api.request('/dashboard/stats')
    },
    backlog: createCRUD('/backlog'),
    preventivePlans: createCRUD('/preventivas'),
    movements: createCRUD('/movimentacoes'),
    oilAnalysis: createCRUD('/analise-oleo'),
    items: createCRUD('/itens')
};

// Alias em português quando necessário
API.equipamentos = API.equipments;

// Expor API globalmente
window.API = API;
