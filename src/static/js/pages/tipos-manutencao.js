class MaintenanceTypesPage {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.searchTerm = '';
    }

    async render(container) {
        try {
            container.innerHTML = this.getLoadingHTML();
            await this.loadData();
            container.innerHTML = this.getMainHTML();
            this.bindEvents();
        } catch (error) {
            console.error('Erro ao carregar tipos de manutenção:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.maintenanceTypes.getAll();
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
                <p>Carregando tipos de manutenção...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao carregar tipos de manutenção</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Tentar novamente</button>
            </div>
        `;
    }

    getMainHTML() {
        return `
            <div class="page-header">
                <div class="page-title">
                    <h1><i class="icon-settings"></i> Tipos de Manutenção</h1>
                    <p>Gerencie os tipos de manutenção do sistema</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-secondary" onclick="this.refreshData()">
                        <i class="icon-refresh"></i> Atualizar
                    </button>
                    <button class="btn btn-primary" onclick="this.openCreateModal()">
                        <i class="icon-plus"></i> Novo Tipo
                    </button>
                </div>
            </div>

            <div class="page-filters">
                <div class="filter-group">
                    <label>Buscar</label>
                    <div class="search-input">
                        <input type="text" 
                               placeholder="Nome, código, descrição..." 
                               value="${this.searchTerm}"
                               onkeyup="this.handleSearch(event)">
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
        const active = this.data.filter(item => item.ativo !== false).length;
        
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--primary-light);">
                        <i class="icon-list" style="color: var(--primary);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${total}</div>
                        <div class="stat-label">Total</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--success-light);">
                        <i class="icon-check" style="color: var(--success);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${active}</div>
                        <div class="stat-label">Ativos</div>
                    </div>
                </div>
            </div>
        `;
    }

    getTableHTML() {
        if (this.filteredData.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h3>Nenhum tipo de manutenção encontrado</h3>
                    <p>Tente ajustar os filtros ou adicionar novos tipos</p>
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
                            <th>Código</th>
                            <th>Nome</th>
                            <th>Descrição</th>
                            <th>Cor</th>
                            <th>Status</th>
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
        const statusBadge = item.ativo !== false ? 
            '<span class="badge badge-success">Ativo</span>' : 
            '<span class="badge badge-secondary">Inativo</span>';

        const colorIndicator = item.cor_identificacao ? 
            `<div class="color-indicator" style="background-color: ${item.cor_identificacao};" title="${item.cor_identificacao}"></div>` : 
            '<span class="text-muted">-</span>';

        return `
            <tr>
                <td><strong>${item.codigo || '-'}</strong></td>
                <td>${item.nome || '-'}</td>
                <td class="text-truncate" title="${item.descricao || ''}">${item.descricao || '-'}</td>
                <td>${colorIndicator}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="this.viewItem(${item.id})" title="Visualizar">
                            <i class="icon-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="this.editItem(${item.id})" title="Editar">
                            <i class="icon-edit"></i>
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
        // Bind dos eventos será feito via onclick nos elementos HTML
    }

    handleSearch(event) {
        this.searchTerm = event.target.value.toLowerCase();
        this.applyFilters();
    }

    applyFilters() {
        this.filteredData = this.data.filter(item => {
            const searchMatch = !this.searchTerm || 
                (item.nome && item.nome.toLowerCase().includes(this.searchTerm)) ||
                (item.codigo && item.codigo.toLowerCase().includes(this.searchTerm)) ||
                (item.descricao && item.descricao.toLowerCase().includes(this.searchTerm));

            return searchMatch;
        });

        this.currentPage = 1;
        this.updateContent();
    }

    clearFilters() {
        this.searchTerm = '';
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
            Utils.showNotification(`Visualizando: ${item.nome}`, 'info');
        }
    }

    editItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            Utils.showNotification(`Editando: ${item.nome}`, 'info');
        }
    }

    deleteItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item && confirm(`Deseja realmente excluir o tipo "${item.nome}"?`)) {
            Utils.showNotification(`Excluindo: ${item.nome}`, 'info');
        }
    }
}

window.MaintenanceTypesPage = MaintenanceTypesPage;

