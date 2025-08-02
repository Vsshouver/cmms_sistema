class MechanicsPage {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.searchTerm = '';
        this.statusFilter = '';
        this.specialtyFilter = '';
        this.viewMode = 'grid'; // 'grid' ou 'table'
    }

    async render(container) {
        try {
            container.innerHTML = this.getLoadingHTML();
            await this.loadData();
            container.innerHTML = this.getMainHTML();
            this.bindEvents();
        } catch (error) {
            console.error('Erro ao carregar mecânicos:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.mechanics.getAll();
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
                <p>Carregando mecânicos...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao carregar mecânicos</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Tentar novamente</button>
            </div>
        `;
    }

    getMainHTML() {
        return `
            <div class="page-header">
                <div class="page-title">
                    <h1><i class="icon-users"></i> Mecânicos</h1>
                    <p>Gerencie a equipe de mecânicos</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-secondary" onclick="this.refreshData()">
                        <i class="icon-refresh"></i> Atualizar
                    </button>
                    <button class="btn btn-primary" onclick="this.openCreateModal()">
                        <i class="icon-plus"></i> Novo Mecânico
                    </button>
                </div>
            </div>

            <div class="page-filters">
                <div class="filter-group">
                    <label>Status</label>
                    <select onchange="this.handleStatusFilter(event)">
                        <option value="">Todos</option>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                        <option value="ferias">Férias</option>
                        <option value="afastado">Afastado</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Especialidade</label>
                    <select onchange="this.handleSpecialtyFilter(event)">
                        <option value="">Todas</option>
                        <option value="mecanica_pesada">Mecânica Pesada</option>
                        <option value="eletrica">Elétrica</option>
                        <option value="hidraulica">Hidráulica</option>
                        <option value="soldagem">Soldagem</option>
                        <option value="pneus">Pneus</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Buscar</label>
                    <div class="search-input">
                        <input type="text" 
                               placeholder="Nome, CPF, especialidade..." 
                               value="${this.searchTerm}"
                               onkeyup="this.handleSearch(event)">
                        <i class="icon-search"></i>
                    </div>
                </div>
                <button class="btn btn-outline" onclick="this.clearFilters()">
                    <i class="icon-x"></i> Limpar
                </button>
                <div class="view-toggle">
                    <button class="btn btn-sm ${this.viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}" 
                            onclick="this.setViewMode('grid')" title="Visualização em grade">
                        <i class="icon-grid"></i>
                    </button>
                    <button class="btn btn-sm ${this.viewMode === 'table' ? 'btn-primary' : 'btn-outline'}" 
                            onclick="this.setViewMode('table')" title="Visualização em tabela">
                        <i class="icon-list"></i>
                    </button>
                </div>
            </div>

            <div class="page-content">
                ${this.getStatsHTML()}
                ${this.viewMode === 'grid' ? this.getGridHTML() : this.getTableHTML()}
                ${this.getPaginationHTML()}
            </div>
        `;
    }

    getStatsHTML() {
        const total = this.data.length;
        const ativos = this.data.filter(item => item.status === 'ativo').length;
        const inativos = this.data.filter(item => item.status === 'inativo').length;
        const ferias = this.data.filter(item => item.status === 'ferias').length;
        
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--success-light);">
                        <i class="icon-user-check" style="color: var(--success);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${ativos}</div>
                        <div class="stat-label">Ativos</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--warning-light);">
                        <i class="icon-calendar" style="color: var(--warning);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${ferias}</div>
                        <div class="stat-label">Em Férias</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--danger-light);">
                        <i class="icon-user-x" style="color: var(--danger);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${inativos}</div>
                        <div class="stat-label">Inativos</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--primary-light);">
                        <i class="icon-users" style="color: var(--primary);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${total}</div>
                        <div class="stat-label">Total</div>
                    </div>
                </div>
            </div>
        `;
    }

    getGridHTML() {
        if (this.filteredData.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">👷</div>
                    <h3>Nenhum mecânico encontrado</h3>
                    <p>Tente ajustar os filtros ou adicionar novos mecânicos</p>
                </div>
            `;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        return `
            <div class="mechanics-grid">
                ${pageData.map(item => this.getCardHTML(item)).join('')}
            </div>
        `;
    }

    getCardHTML(item) {
        const statusBadges = {
            'ativo': '<span class="badge badge-success">Ativo</span>',
            'inativo': '<span class="badge badge-secondary">Inativo</span>',
            'ferias': '<span class="badge badge-warning">Férias</span>',
            'afastado': '<span class="badge badge-danger">Afastado</span>'
        };

        const experienceLabels = {
            'junior': 'Júnior',
            'pleno': 'Pleno',
            'senior': 'Sênior'
        };

        return `
            <div class="mechanic-card">
                <div class="card-header">
                    <div class="mechanic-avatar">
                        <i class="icon-user"></i>
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
                    <h3>${item.nome_completo || 'Sem nome'}</h3>
                    <p class="specialty">${item.especialidade || 'Sem especialidade'}</p>
                    <p class="experience">${experienceLabels[item.nivel_experiencia] || 'Não informado'}</p>
                    <div class="contact-info">
                        <div class="contact-item">
                            <i class="icon-phone"></i>
                            <span>${item.telefone || 'Não informado'}</span>
                        </div>
                        <div class="contact-item">
                            <i class="icon-mail"></i>
                            <span>${item.email || 'Não informado'}</span>
                        </div>
                    </div>
                    <div class="salary-info">
                        <span class="salary-label">Salário:</span>
                        <span class="salary-value">${Utils.formatCurrency(item.salario) || 'Não informado'}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="status-badge">
                        ${statusBadges[item.status] || statusBadges['ativo']}
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="this.viewItem(${item.id})">
                        <i class="icon-eye"></i> Detalhes
                    </button>
                </div>
            </div>
        `;
    }

    getTableHTML() {
        if (this.filteredData.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">👷</div>
                    <h3>Nenhum mecânico encontrado</h3>
                    <p>Tente ajustar os filtros ou adicionar novos mecânicos</p>
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
                            <th>Nome</th>
                            <th>CPF</th>
                            <th>Especialidade</th>
                            <th>Experiência</th>
                            <th>Telefone</th>
                            <th>Status</th>
                            <th>Salário</th>
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
            'ativo': '<span class="badge badge-success">Ativo</span>',
            'inativo': '<span class="badge badge-secondary">Inativo</span>',
            'ferias': '<span class="badge badge-warning">Férias</span>',
            'afastado': '<span class="badge badge-danger">Afastado</span>'
        };

        const experienceLabels = {
            'junior': 'Júnior',
            'pleno': 'Pleno',
            'senior': 'Sênior'
        };

        return `
            <tr>
                <td><strong>${item.nome_completo || '-'}</strong></td>
                <td>${item.cpf || '-'}</td>
                <td>${item.especialidade || '-'}</td>
                <td>${experienceLabels[item.nivel_experiencia] || '-'}</td>
                <td>${item.telefone || '-'}</td>
                <td>${statusBadges[item.status] || statusBadges['ativo']}</td>
                <td>${Utils.formatCurrency(item.salario) || '-'}</td>
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

    handleStatusFilter(event) {
        this.statusFilter = event.target.value;
        this.applyFilters();
    }

    handleSpecialtyFilter(event) {
        this.specialtyFilter = event.target.value;
        this.applyFilters();
    }

    setViewMode(mode) {
        this.viewMode = mode;
        this.updateContent();
    }

    applyFilters() {
        this.filteredData = this.data.filter(item => {
            const searchMatch = !this.searchTerm || 
                (item.nome_completo && item.nome_completo.toLowerCase().includes(this.searchTerm)) ||
                (item.cpf && item.cpf.toLowerCase().includes(this.searchTerm)) ||
                (item.especialidade && item.especialidade.toLowerCase().includes(this.searchTerm));

            const statusMatch = !this.statusFilter || item.status === this.statusFilter;
            const specialtyMatch = !this.specialtyFilter || item.especialidade === this.specialtyFilter;

            return searchMatch && statusMatch && specialtyMatch;
        });

        this.currentPage = 1;
        this.updateContent();
    }

    clearFilters() {
        this.searchTerm = '';
        this.statusFilter = '';
        this.specialtyFilter = '';
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
                ${this.viewMode === 'grid' ? this.getGridHTML() : this.getTableHTML()}
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
            Utils.showNotification(`Visualizando: ${item.nome_completo}`, 'info');
        }
    }

    editItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            Utils.showNotification(`Editando: ${item.nome_completo}`, 'info');
        }
    }

    deleteItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item && confirm(`Deseja realmente excluir o mecânico "${item.nome_completo}"?`)) {
            Utils.showNotification(`Excluindo: ${item.nome_completo}`, 'info');
        }
    }
}

window.MechanicsPage = MechanicsPage;

