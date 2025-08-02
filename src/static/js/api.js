// Configuração da API
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
            headers: this.getHeaders(options.contentType),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Se não autorizado, redirecionar para login
            if (response.status === 401) {
                this.setToken(null);
                window.location.reload();
                return;
            }

            // Se resposta não é JSON (ex: PDF)
            if (options.responseType === 'blob') {
                return response.blob();
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Métodos HTTP
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Upload de arquivo
    async upload(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            contentType: null // Para FormData, não definir Content-Type
        });
    }

    // Download de arquivo
    async download(endpoint, filename) {
        return this.request(endpoint, {
            method: 'GET',
            responseType: 'blob'
        });
    }
}

// Instância global do cliente API
const api = new ApiClient();

// Serviços da API organizados por módulo
const API = {
    // Autenticação
    auth: {
        // Encaminha os campos exatamente como recebidos
        login: (credentials) => api.post('/auth/login', credentials),
        logout: () => api.post('/auth/logout'),
        me: () => api.get('/auth/me')
    },

    // Dashboard
    dashboard: {
        getStats: () => api.get('/dashboard'),
        getCharts: () => api.get('/dashboard/charts')
    },

    // Usuários
    users: {
        list: (params) => api.get('/usuarios', params),
        get: (id) => api.get(`/usuarios/${id}`),
        create: (data) => api.post('/usuarios', data),
        update: (id, data) => api.put(`/usuarios/${id}`, data),
        delete: (id) => api.delete(`/usuarios/${id}`)
    },

    // Equipamentos
    equipments: {
        list: (params) => api.get('/equipamentos', params),
        get: (id) => api.get(`/equipamentos/${id}`),
        create: (data) => api.post('/equipamentos', data),
        update: (id, data) => api.put(`/equipamentos/${id}`, data),
        delete: (id) => api.delete(`/equipamentos/${id}`)
    },

    // Tipos de Equipamento
    equipmentTypes: {
        list: (params) => api.get('/tipos-equipamento', params),
        get: (id) => api.get(`/tipos-equipamento/${id}`),
        create: (data) => api.post('/tipos-equipamento', data),
        update: (id, data) => api.put(`/tipos-equipamento/${id}`, data),
        delete: (id) => api.delete(`/tipos-equipamento/${id}`)
    },

    // Ordens de Serviço
    workOrders: {
        list: (params) => api.get('/ordens-servico', params),
        get: (id) => api.get(`/ordens-servico/${id}`),
        create: (data) => api.post('/ordens-servico', data),
        update: (id, data) => api.put(`/ordens-servico/${id}`, data),
        delete: (id) => api.delete(`/ordens-servico/${id}`),
        start: (id, data) => api.put(`/ordens-servico/${id}/iniciar`, data),
        complete: (id, data) => api.put(`/ordens-servico/${id}/concluir`, data),
        getParts: (id) => api.get(`/ordens-servico/${id}/pecas`),
        getAlerts: (id) => api.get(`/ordens-servico/${id}/alertas`),
        getMechanicAlerts: () => api.get('/ordens-servico/alertas-mecanico'),
        print: (id) => api.download(`/ordens-servico/${id}/imprimir`, `OS_${id}.pdf`)
    },

    // Tipos de Manutenção
    maintenanceTypes: {
        list: (params) => api.get('/tipos-manutencao', params),
        get: (id) => api.get(`/tipos-manutencao/${id}`),
        create: (data) => api.post('/tipos-manutencao', data),
        update: (id, data) => api.put(`/tipos-manutencao/${id}`, data),
        delete: (id) => api.delete(`/tipos-manutencao/${id}`)
    },

    // Estoque
    inventory: {
        listParts: (params) => api.get('/estoque/pecas', params),
        getPart: (id) => api.get(`/estoque/pecas/${id}`),
        createPart: (data) => api.post('/estoque/pecas', data),
        updatePart: (id, data) => api.put(`/estoque/pecas/${id}`, data),
        deletePart: (id) => api.delete(`/estoque/pecas/${id}`),
        
        // Movimentações
        listMovements: (params) => api.get('/estoque/movimentacoes', params),
        createMovement: (data) => api.post('/estoque/movimentacao', data),
        
        // Inventário
        doInventory: (data) => api.post('/estoque/inventario', data),
        getInventoryReport: (params) => api.get('/estoque/relatorio-inventario', params),
        
        // Estoques locais
        listLocations: () => api.get('/estoque/locais'),
        createLocation: (data) => api.post('/estoque/locais', data)
    },

    // Grupos de Item
    itemGroups: {
        list: (params) => api.get('/grupos-item', params),
        get: (id) => api.get(`/grupos-item/${id}`),
        create: (data) => api.post('/grupos-item', data),
        update: (id, data) => api.put(`/grupos-item/${id}`, data),
        delete: (id) => api.delete(`/grupos-item/${id}`)
    },

    // Importação
    import: {
        importParts: (formData) => api.upload('/importacao/pecas', formData),
        getTemplate: () => api.get('/importacao/template-pecas'),
        getAvailableGroups: () => api.get('/importacao/grupos-disponiveis')
    },

    // Pneus
    tires: {
        list: (params) => api.get('/pneus', params),
        get: (id) => api.get(`/pneus/${id}`),
        create: (data) => api.post('/pneus', data),
        update: (id, data) => api.put(`/pneus/${id}`, data),
        delete: (id) => api.delete(`/pneus/${id}`),
        install: (id, data) => api.put(`/pneus/${id}/instalar`, data),
        remove: (id, data) => api.put(`/pneus/${id}/remover`, data),
        applyTreatment: (id, data) => api.put(`/pneus/${id}/tratativa`, data),
        returnFromRecap: (id, data) => api.put(`/pneus/${id}/retorno-recapagem`, data),
        updateTread: (id, data) => api.put(`/pneus/${id}/atualizar-sulco`, data),
        getPerformanceReport: (params) => api.get('/pneus/relatorio-performance', params),
        getAlerts: () => api.get('/pneus/alertas')
    },

    // Mecânicos
    mechanics: {
        list: (params) => api.get('/mecanicos', params),
        get: (id) => api.get(`/mecanicos/${id}`),
        create: (data) => api.post('/mecanicos', data),
        update: (id, data) => api.put(`/mecanicos/${id}`, data),
        delete: (id) => api.delete(`/mecanicos/${id}`)
    },

    // Análise de Óleo
    oilAnalysis: {
        list: (params) => api.get('/analise-oleo', params),
        get: (id) => api.get(`/analise-oleo/${id}`),
        create: (data) => api.post('/analise-oleo', data),
        update: (id, data) => api.put(`/analise-oleo/${id}`, data),
        delete: (id) => api.delete(`/analise-oleo/${id}`)
    }
};

// Exportar para uso global
window.API = API;
window.api = api;

