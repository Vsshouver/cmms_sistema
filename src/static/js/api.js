// Configuração da API
const API_BASE_URL = window.location.origin + '/api';

// Cliente HTTP para comunicação com a API
class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getHeaders(contentType = 'application/json') {
        const headers = {
            'Content-Type': contentType
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: options.method || 'GET',
            headers: this.getHeaders(options.contentType),
            body: options.body
        };

        try {
            const response = await fetch(url, config);

            // Desloga se o token estiver inválido ou expirado
            if (response.status === 401) {
                this.setToken(null);
                if (typeof auth !== 'undefined' && typeof auth.logout === 'function') {
                    // Evita chamada ao servidor durante logout forçado
                    await auth.logout(true);
                } else if (typeof app !== 'undefined' && typeof app.showLogin === 'function') {
                    app.showLogin();
                }
                return;
            }

            // Download de blob (arquivos)
            if (options.responseType === 'blob') {
                return response.blob();
            }

            const contentType = response.headers.get('content-type') || '';

            // Traduz status HTTP em mensagens amigáveis
            const buildMessage = (status, message) => {
                if (status === 404 && !message) return 'Recurso não encontrado';
                if ((status === 400 || status === 422) && !message) return 'Dados inválidos';
                if (status >= 500 && !message) return 'Erro interno do servidor';
                return message || `HTTP ${status}`;
            };

            // Trata respostas JSON
            if (contentType.includes('application/json')) {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(buildMessage(response.status, data.error || data.message));
                }
                return data;
            }

            // Trata respostas de texto
            const text = await response.text();
            if (!response.ok) {
                throw new Error(buildMessage(response.status, text));
            }
            return text;

        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            if (typeof Toast !== 'undefined') {
                Toast.error(error.message || 'Erro de conexão');
            }
            throw error;
        }
    }

    get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    upload(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            contentType: null
        });
    }

    download(endpoint, filename) {
        return this.request(endpoint, {
            method: 'GET',
            responseType: 'blob'
        });
    }
}

const api = new ApiClient();

// Definição de todos os serviços disponíveis via API
const API = {
    auth: {
        login: (credentials) => api.post('/auth/login', credentials),
        logout: () => api.post('/auth/logout'),
        me: () => api.get('/auth/me')
    },

    dashboard: {
        getStats: () => api.get('/dashboard'),
        getCharts: () => api.get('/dashboard/charts')
    },

    users: {
        getAll: (params) => api.get('/usuarios', params),
        get: (id) => api.get(`/usuarios/${id}`),
        create: (data) => api.post('/usuarios', data),
        update: (id, data) => api.put(`/usuarios/${id}`, data),
        delete: (id) => api.delete(`/usuarios/${id}`)
    },

    equipments: {
        getAll: (params) => api.get('/equipamentos', params),
        get: (id) => api.get(`/equipamentos/${id}`),
        create: (data) => api.post('/equipamentos', data),
        update: (id, data) => api.put(`/equipamentos/${id}`, data),
        delete: (id) => api.delete(`/equipamentos/${id}`)
    },

    equipmentTypes: {
        getAll: (params) => api.get('/tipos-equipamento', params),
        get: (id) => api.get(`/tipos-equipamento/${id}`),
        create: (data) => api.post('/tipos-equipamento', data),
        update: (id, data) => api.put(`/tipos-equipamento/${id}`, data),
        delete: (id) => api.delete(`/tipos-equipamento/${id}`)
    },

    workOrders: {
        getAll: (params) => api.get('/ordens-servico', params),
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

    maintenanceTypes: {
        getAll: (params) => api.get('/tipos-manutencao', params),
        get: (id) => api.get(`/tipos-manutencao/${id}`),
        create: (data) => api.post('/tipos-manutencao', data),
        update: (id, data) => api.put(`/tipos-manutencao/${id}`, data),
        delete: (id) => api.delete(`/tipos-manutencao/${id}`)
    },

    inventory: {
        getAll: (params) => api.get('/estoque/pecas', params),
        get: (id) => api.get(`/estoque/pecas/${id}`),
        create: (data) => api.post('/estoque/pecas', data),
        update: (id, data) => api.put(`/estoque/pecas/${id}`, data),
        delete: (id) => api.delete(`/estoque/pecas/${id}`),

        getMovements: (params) => api.get('/estoque/movimentacoes', params),
        createMovement: (id, data) => api.post(`/estoque/pecas/${id}/movimentacao`, data),

        doInventory: (data) => api.post('/estoque/inventario', data),
        getInventoryReport: (params) => api.get('/estoque/relatorio-inventario', params),

        listLocations: () => api.get('/estoque/locais'),
        createLocation: (data) => api.post('/estoque/locais', data)
    },

    itemGroups: {
        getAll: (params) => api.get('/grupos-item', params),
        get: (id) => api.get(`/grupos-item/${id}`),
        create: (data) => api.post('/grupos-item', data),
        update: (id, data) => api.put(`/grupos-item/${id}`, data),
        delete: (id) => api.delete(`/grupos-item/${id}`)
    },

    stockLocations: {
        getAll: () => api.get('/estoque/locais'),
        create: (data) => api.post('/estoque/locais', data)
    },

    import: {
        importParts: (formData) => api.upload('/importacao/pecas', formData),
        getTemplate: () => api.get('/importacao/template-pecas'),
        getAvailableGroups: () => api.get('/importacao/grupos-disponiveis')
    },

    tires: {
        getAll: (params) => api.get('/pneus', params),
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

    mechanics: {
        getAll: (params) => api.get('/mecanicos', params),
        get: (id) => api.get(`/mecanicos/${id}`),
        create: (data) => api.post('/mecanicos', data),
        update: (id, data) => api.put(`/mecanicos/${id}`, data),
        delete: (id) => api.delete(`/mecanicos/${id}`)
    },

    preventivePlans: {
        getAll: (params) => api.get('/planos-preventiva', params),
        get: (id) => api.get(`/planos-preventiva/${id}`),
        create: (data) => api.post('/planos-preventiva', data),
        update: (id, data) => api.put(`/planos-preventiva/${id}`, data),
        delete: (id) => api.delete(`/planos-preventiva/${id}`),
        execute: (id, data) => api.post(`/planos-preventiva/${id}/executar`, data),
        generatePendingOS: () => api.post('/planos-preventiva/gerar-os-pendentes')
    },

    backlog: {
        getAll: (params) => api.get('/backlog', params),
        get: (id) => api.get(`/backlog/${id}`),
        create: (data) => api.post('/backlog', data),
        update: (id, data) => api.put(`/backlog/${id}`, data),
        delete: (id) => api.delete(`/backlog/${id}`),
        getStats: () => api.get('/backlog/stats'),
        recalcPriority: () => api.post('/backlog/priorizar'),
        start: (id) => api.post(`/backlog/${id}/iniciar`),
        complete: (id, data) => api.post(`/backlog/${id}/concluir`, data)
    },

    oilAnalysis: {
        getAll: (params) => api.get('/analise-oleo', params),
        get: (id) => api.get(`/analise-oleo/${id}`),
        create: (data) => api.post('/analise-oleo', data),
        update: (id, data) => api.put(`/analise-oleo/${id}`, data),
        delete: (id) => api.delete(`/analise-oleo/${id}`)
    },

    movements: {
        getAll: (params) => api.get('/movimentacoes', params),
        get: (id) => api.get(`/movimentacoes/${id}`),
        create: (data) => api.post('/movimentacoes', data),
        reverse: (id) => api.put(`/movimentacoes/${id}/estornar`)
    }
};

// Exportar para uso global
window.API = API;
window.api = api;
