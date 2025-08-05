class EquipmentTypesPage {
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
            console.error('Erro ao carregar tipos de equipamento:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.equipmentTypes.getAll();
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
                <p>Carregando tipos de equipamento...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao carregar tipos de equipamento</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Tentar novamente</button>
            </div>
        `;
    }

    getMainHTML() {
        return `
            <div class="page-header">
                <div class="page-title">
                    <h1><i class="icon-truck"></i> Tipos de Equipamento</h1>
                    <p>Gerencie os tipos de equipamento do sistema</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-secondary" id="refresh-data">
                        <i class="icon-refresh"></i> Atualizar
                    </button>
                    <button class="btn btn-primary" id="create-type">
                        <i class="icon-plus"></i> Novo Tipo
                    </button>
                </div>
            </div>

            <div class="page-filters">
                <div class="filter-group">
                    <label>Buscar</label>
                    <div class="search-input">
                        <input type="text" 
                               placeholder="Nome, descrição..." 
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
                ${this.getCardsHTML()}
                ${this.getPaginationHTML()}
            </div>
        `;
    }

    getStatsHTML() {
        const total = this.data.length;
        const equipmentCounts = {};
        
        // Contar equipamentos por tipo (simulado)
        this.data.forEach(type => {
            equipmentCounts[type.id] = Math.floor(Math.random() * 20) + 1;
        });

        const totalEquipments = Object.values(equipmentCounts).reduce((sum, count) => sum + count, 0);
        
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--primary-light);">
                        <i class="icon-list" style="color: var(--primary);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${total}</div>
                        <div class="stat-label">Tipos Cadastrados</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--success-light);">
                        <i class="icon-truck" style="color: var(--success);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${totalEquipments}</div>
                        <div class="stat-label">Total de Equipamentos</div>
                    </div>
                </div>
            </div>
        `;
    }

    getCardsHTML() {
        if (this.filteredData.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🚛</div>
                    <h3>Nenhum tipo de equipamento encontrado</h3>
                    <p>Tente ajustar os filtros ou adicionar novos tipos</p>
                </div>
            `;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        return `
            <div class="equipment-types-grid">
                ${pageData.map(item => this.getCardHTML(item)).join('')}
            </div>
        `;
    }

    getCardHTML(item) {
        const equipmentCount = Math.floor(Math.random() * 20) + 1; // Simulado
        const icons = {
            'Escavadeira': '🚜',
            'Caminhão': '🚛',
            'Trator': '🚜',
            'Carregadeira': '🏗️',
            'Perfuratriz': '⚒️',
            'Britador': '🔨',
            'Compressor': '💨',
            'Gerador': '⚡'
        };

        const icon = icons[item.nome] || '🚧';

        return `
            <div class="equipment-type-card">
                <div class="card-header">
                    <div class="type-icon">${icon}</div>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-outline" onclick="this.editItem(${item.id})" title="Editar">
                            <i class="icon-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline btn-danger" onclick="this.deleteItem(${item.id})" title="Excluir">
                            <i class="icon-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <h3>${item.nome || 'Sem nome'}</h3>
                    <p class="description">${item.descricao || 'Sem descrição'}</p>
                    <div class="equipment-count">
                        <span class="count-number">${equipmentCount}</span>
                        <span class="count-label">equipamentos</span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-outline btn-sm" onclick="this.viewEquipments(${item.id})">
                        <i class="icon-eye"></i> Ver Equipamentos
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="this.viewItem(${item.id})">
                        <i class="icon-info"></i> Detalhes
                    </button>
                </div>
            </div>
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
                    <option value="8" ${this.itemsPerPage === 8 ? 'selected' : ''}>8 por página</option>
                    <option value="16" ${this.itemsPerPage === 16 ? 'selected' : ''}>16 por página</option>
                    <option value="24" ${this.itemsPerPage === 24 ? 'selected' : ''}>24 por página</option>
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
                ${this.getCardsHTML()}
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

    viewEquipments(typeId) {
        const item = this.data.find(item => item.id === typeId);
        if (item) {
            Utils.showNotification(`Visualizando equipamentos do tipo: ${item.nome}`, 'info');
        }
    }
}

window.EquipmentTypesPage = EquipmentTypesPage;

