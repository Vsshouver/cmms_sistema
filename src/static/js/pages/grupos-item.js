class ItemGroupsPage {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.searchTerm = '';
    }

    async render(container) {
        try {
            container.innerHTML = this.getLoadingHTML();
            await this.loadData();
            container.innerHTML = this.getMainHTML();
            this.bindEvents();
        } catch (error) {
            console.error('Erro ao carregar grupos de item:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.itemGroups.getAll();
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
                <p>Carregando grupos de item...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao carregar grupos de item</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Tentar novamente</button>
            </div>
        `;
    }

    getMainHTML() {
        return `
            <div class="page-header">
                <div class="page-title">
                    <h1><i class="icon-package"></i> Grupos de Item</h1>
                    <p>Gerencie os grupos de classificação de itens</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-secondary" onclick="this.refreshData()">
                        <i class="icon-refresh"></i> Atualizar
                    </button>
                    <button class="btn btn-primary" onclick="this.openCreateModal()">
                        <i class="icon-plus"></i> Novo Grupo
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
                ${this.getCardsHTML()}
                ${this.getPaginationHTML()}
            </div>
        `;
    }

    getStatsHTML() {
        const total = this.data.length;
        const itemCounts = {};
        
        // Contar itens por grupo (simulado)
        this.data.forEach(group => {
            itemCounts[group.id] = Math.floor(Math.random() * 50) + 1;
        });

        const totalItems = Object.values(itemCounts).reduce((sum, count) => sum + count, 0);
        
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--primary-light);">
                        <i class="icon-folder" style="color: var(--primary);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${total}</div>
                        <div class="stat-label">Grupos</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--success-light);">
                        <i class="icon-package" style="color: var(--success);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${totalItems}</div>
                        <div class="stat-label">Total de Itens</div>
                    </div>
                </div>
            </div>
        `;
    }

    getCardsHTML() {
        if (this.filteredData.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <h3>Nenhum grupo de item encontrado</h3>
                    <p>Tente ajustar os filtros ou adicionar novos grupos</p>
                </div>
            `;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        return `
            <div class="item-groups-grid">
                ${pageData.map(item => this.getCardHTML(item)).join('')}
            </div>
        `;
    }

    getCardHTML(item) {
        const itemCount = Math.floor(Math.random() * 50) + 1; // Simulado
        const icons = {
            'FIL': '🔧',
            'OLE': '🛢️',
            'MOT': '⚙️',
            'HID': '💧',
            'PNE': '🛞',
            'ELE': '⚡',
            'FER': '🔨',
            'CON': '📦'
        };

        const colors = [
            'var(--primary)',
            'var(--success)',
            'var(--warning)',
            'var(--danger)',
            'var(--info)',
            'var(--purple)',
            'var(--orange)',
            'var(--teal)'
        ];

        const icon = icons[item.codigo] || '📁';
        const color = colors[Math.floor(Math.random() * colors.length)];

        return `
            <div class="item-group-card">
                <div class="card-header">
                    <div class="group-icon" style="background: ${color}20; color: ${color};">
                        ${icon}
                    </div>
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
                    <div class="group-code">${item.codigo || 'SEM CÓDIGO'}</div>
                    <h3>${item.nome || 'Sem nome'}</h3>
                    <p class="description">${item.descricao || 'Sem descrição'}</p>
                    <div class="item-count">
                        <span class="count-number">${itemCount}</span>
                        <span class="count-label">itens</span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-outline btn-sm" onclick="this.viewItems(${item.id})">
                        <i class="icon-eye"></i> Ver Itens
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
                    <option value="12" ${this.itemsPerPage === 12 ? 'selected' : ''}>12 por página</option>
                    <option value="24" ${this.itemsPerPage === 24 ? 'selected' : ''}>24 por página</option>
                    <option value="48" ${this.itemsPerPage === 48 ? 'selected' : ''}>48 por página</option>
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
        if (item && confirm(`Deseja realmente excluir o grupo "${item.nome}"?`)) {
            Utils.showNotification(`Excluindo: ${item.nome}`, 'info');
        }
    }

    viewItems(groupId) {
        const item = this.data.find(item => item.id === groupId);
        if (item) {
            Utils.showNotification(`Visualizando itens do grupo: ${item.nome}`, 'info');
        }
    }
}

window.ItemGroupsPage = ItemGroupsPage;

