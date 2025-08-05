class OilAnalysisPage {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.searchTerm = '';
        this.statusFilter = '';
        this.equipmentFilter = '';
    }

    async render(container) {
        try {
            container.innerHTML = this.getLoadingHTML();
            await this.loadData();
            container.innerHTML = this.getMainHTML();
            this.bindEvents();
        } catch (error) {
            console.error('Erro ao carregar análises de óleo:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.oilAnalysis.getAll();
            this.data = Array.isArray(response) ? response : (response.data || []);
            this.filteredData = [...this.data];
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.data = [];
            this.filteredData = [];
            throw error;
        }
    }

    getLoadingHTML() {
        return `
            <div class="page-loading">
                <div class="loading-spinner"></div>
                <p>Carregando análises de óleo...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao carregar análises de óleo</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Tentar novamente</button>
            </div>
        `;
    }

    getMainHTML() {
        return `
            <div class="page-header">
                <div class="page-title">
                    <h1><i class="icon-droplet"></i> Análise de Óleo</h1>
                    <p>Gerencie as análises de óleo dos equipamentos</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-secondary" id="refresh-data">
                        <i class="icon-refresh"></i> Atualizar
                    </button>
                    <button class="btn btn-primary" id="create-analysis">
                        <i class="icon-plus"></i> Nova Análise
                    </button>
                </div>
            </div>

            <div class="page-filters">
                <div class="filter-group">
                    <label>Status</label>
                    <select id="status-filter">
                        <option value="">Todos</option>
                        <option value="pendente">Pendente</option>
                        <option value="em_analise">Em Análise</option>
                        <option value="concluida">Concluída</option>
                        <option value="reprovada">Reprovada</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Equipamento</label>
                    <select id="equipment-filter">
                        <option value="">Todos os equipamentos</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Buscar</label>
                    <div class="search-input">
                        <input type="text" 
                               id="search-input"
                               placeholder="Número da amostra, equipamento..." 
                               value="${this.searchTerm}">
                        <i class="icon-search"></i>
                    </div>
                </div>
                <button class="btn btn-outline" onclick="this.clearFilters()">
                    <i class="icon-x"></i> Limpar
                </button>
            </div>

            <div class="page-content">
                ${this.getStatsHTML()}
                ${this.getTableHTML()}
                ${this.getPaginationHTML()}
            </div>
        `;
    }

    getStatsHTML() {
        const total = this.data.length;
        const pendentes = this.data.filter(item => item.status === 'pendente').length;
        const concluidas = this.data.filter(item => item.status === 'concluida').length;
        const reprovadas = this.data.filter(item => item.status === 'reprovada').length;
        
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--warning-light);">
                        <i class="icon-clock" style="color: var(--warning);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${pendentes}</div>
                        <div class="stat-label">Pendentes</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--success-light);">
                        <i class="icon-check" style="color: var(--success);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${concluidas}</div>
                        <div class="stat-label">Concluídas</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--danger-light);">
                        <i class="icon-x" style="color: var(--danger);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${reprovadas}</div>
                        <div class="stat-label">Reprovadas</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--primary-light);">
                        <i class="icon-droplet" style="color: var(--primary);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${total}</div>
                        <div class="stat-label">Total</div>
                    </div>
                </div>
            </div>
        `;
    }

    getTableHTML() {
        if (this.filteredData.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🛢️</div>
                    <h3>Nenhuma análise de óleo encontrada</h3>
                    <p>Tente ajustar os filtros ou adicionar novas análises</p>
                </div>
            `;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        return `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Amostra</th>
                            <th>Equipamento</th>
                            <th>Data Coleta</th>
                            <th>Horímetro</th>
                            <th>Status</th>
                            <th>Resultado</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageData.map(item => this.getTableRowHTML(item)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getTableRowHTML(item) {
        const statusBadges = {
            'pendente': '<span class="badge badge-warning">Pendente</span>',
            'em_analise': '<span class="badge badge-info">Em Análise</span>',
            'concluida': '<span class="badge badge-success">Concluída</span>',
            'reprovada': '<span class="badge badge-danger">Reprovada</span>'
        };

        const resultadoBadges = {
            'aprovado': '<span class="badge badge-success">Aprovado</span>',
            'atencao': '<span class="badge badge-warning">Atenção</span>',
            'critico': '<span class="badge badge-danger">Crítico</span>',
            'reprovado': '<span class="badge badge-danger">Reprovado</span>'
        };

        return `
            <tr>
                <td><strong>${item.numero_amostra || '-'}</strong></td>
                <td>${item.equipamento_nome || item.equipamento_codigo || '-'}</td>
                <td>${Utils.formatDate(item.data_coleta) || '-'}</td>
                <td>${Utils.formatNumber(item.horimetro_coleta) || '-'} h</td>
                <td>${statusBadges[item.status] || statusBadges['pendente']}</td>
                <td>${item.resultado ? resultadoBadges[item.resultado] || '-' : '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="this.viewItem(${item.id})" title="Visualizar">
                            <i class="icon-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="this.editItem(${item.id})" title="Editar">
                            <i class="icon-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="this.downloadReport(${item.id})" title="Baixar Relatório">
                            <i class="icon-download"></i>
                        </button>
                        <button class="btn btn-sm btn-outline btn-danger" onclick="this.deleteItem(${item.id})" title="Excluir">
                            <i class="icon-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getPaginationHTML() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        
        if (totalPages <= 1) return '';

        return `
            <div class="pagination-container">
                <div class="pagination-info">
                    Mostrando ${((this.currentPage - 1) * this.itemsPerPage) + 1} a ${Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length)} de ${this.filteredData.length} registros
                </div>
                <div class="pagination">
                    <button class="btn btn-sm btn-outline" 
                            onclick="this.goToPage(${this.currentPage - 1})"
                            ${this.currentPage === 1 ? 'disabled' : ''}>
                        <i class="icon-chevron-left"></i>
                    </button>
                    
                    ${Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                        const page = i + 1;
                        const isActive = page === this.currentPage;
                        return `
                            <button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}"
                                    onclick="this.goToPage(${page})">
                                ${page}
                            </button>
                        `;
                    }).join('')}
                    
                    <button class="btn btn-sm btn-outline" 
                            onclick="this.goToPage(${this.currentPage + 1})"
                            ${this.currentPage === totalPages ? 'disabled' : ''}>
                        <i class="icon-chevron-right"></i>
                    </button>
                </div>
                <select class="form-select" onchange="this.changeItemsPerPage(event)">
                    <option value="10" ${this.itemsPerPage === 10 ? 'selected' : ''}>10 por página</option>
                    <option value="25" ${this.itemsPerPage === 25 ? 'selected' : ''}>25 por página</option>
                    <option value="50" ${this.itemsPerPage === 50 ? 'selected' : ''}>50 por página</option>
                </select>
            </div>
        `;
    }

    bindEvents() {
        // Botão de refresh
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Botão de criar
        const createBtn = document.getElementById('create-analysis');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openCreateModal());
        }

        // Filtros
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.handleStatusFilter(e));
        }

        const equipmentFilter = document.getElementById('equipment-filter');
        if (equipmentFilter) {
            equipmentFilter.addEventListener('change', (e) => this.handleEquipmentFilter(e));
        }

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => this.handleSearch(e));
        }
    }

    handleSearch(event) {
        this.searchTerm = event.target.value.toLowerCase();
        this.applyFilters();
    }

    handleStatusFilter(event) {
        this.statusFilter = event.target.value;
        this.applyFilters();
    }

    handleEquipmentFilter(event) {
        this.equipmentFilter = event.target.value;
        this.applyFilters();
    }

    applyFilters() {
        this.filteredData = this.data.filter(item => {
            const searchMatch = !this.searchTerm || 
                (item.numero_amostra && item.numero_amostra.toLowerCase().includes(this.searchTerm)) ||
                (item.equipamento_nome && item.equipamento_nome.toLowerCase().includes(this.searchTerm)) ||
                (item.equipamento_codigo && item.equipamento_codigo.toLowerCase().includes(this.searchTerm));

            const statusMatch = !this.statusFilter || item.status === this.statusFilter;
            const equipmentMatch = !this.equipmentFilter || item.equipamento_id == this.equipmentFilter;

            return searchMatch && statusMatch && equipmentMatch;
        });

        this.currentPage = 1;
        this.updateContent();
    }

    clearFilters() {
        this.searchTerm = '';
        this.statusFilter = '';
        this.equipmentFilter = '';
        this.filteredData = [...this.data];
        this.currentPage = 1;
        this.updateContent();
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateContent();
        }
    }

    changeItemsPerPage(event) {
        this.itemsPerPage = parseInt(event.target.value);
        this.currentPage = 1;
        this.updateContent();
    }

    updateContent() {
        const container = document.querySelector('.page-content');
        if (container) {
            container.innerHTML = `
                ${this.getStatsHTML()}
                ${this.getTableHTML()}
                ${this.getPaginationHTML()}
            `;
        }
    }

    async refreshData() {
        try {
            await this.loadData();
            this.applyFilters();
            Utils.showNotification('Dados atualizados com sucesso!', 'success');
        } catch (error) {
            Utils.showNotification('Erro ao atualizar dados', 'error');
        }
    }

    openCreateModal() {
        Utils.showNotification('Modal de criação em desenvolvimento', 'info');
    }

    viewItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            Utils.showNotification(`Visualizando análise: ${item.numero_amostra}`, 'info');
        }
    }

    editItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            Utils.showNotification(`Editando análise: ${item.numero_amostra}`, 'info');
        }
    }

    downloadReport(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            Utils.showNotification(`Baixando relatório: ${item.numero_amostra}`, 'info');
        }
    }

    deleteItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item && confirm(`Deseja realmente excluir a análise "${item.numero_amostra}"?`)) {
            Utils.showNotification(`Excluindo análise: ${item.numero_amostra}`, 'info');
        }
    }
}

window.OilAnalysisPage = OilAnalysisPage;

