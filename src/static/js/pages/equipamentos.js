// Página de Equipamentos
class EquipmentsPage {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentFilters = {};
        this.currentSort = { field: 'nome', direction: 'asc' };
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.viewMode = 'grid'; // grid ou table
    }

    async render(container) {
        try {
            // Mostrar loading
            container.innerHTML = this.getLoadingHTML();

            // Carregar dados
            await this.loadData();

            // Renderizar conteúdo
            container.innerHTML = this.getHTML();

            // Configurar eventos
            this.setupEvents(container);

            // Aplicar filtros iniciais
            this.applyFilters();

        } catch (error) {
            console.error('Erro ao carregar equipamentos:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.equipments.getAll();
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
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Carregando equipamentos...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Erro ao carregar equipamentos</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="navigation.navigateTo('equipamentos')">
                    <i class="fas fa-refresh"></i>
                    Tentar novamente
                </button>
            </div>
        `;
    }

    getHTML() {
        return `
            <div class="equipments-page">
                <!-- Header -->
                <div class="page-header">
                    <div class="page-title">
                        <i class="fas fa-truck"></i>
                        <div>
                            <h1>Equipamentos</h1>
                            <p>Gerencie os equipamentos da operação</p>
                        </div>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-outline" id="refresh-data">
                            <i class="fas fa-sync-alt"></i>
                            Atualizar
                        </button>
                        <button class="btn btn-primary" id="create-equipment" ${!auth.hasPermission('admin') ? 'style="display: none;"' : ''}>
                            <i class="fas fa-plus"></i>
                            Novo Equipamento
                        </button>
                    </div>
                </div>

                <!-- Filtros e controles -->
                <div class="filters-section">
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label class="filter-label">Tipo</label>
                            <select id="filter-tipo" class="filter-select">
                                <option value="">Todos os tipos</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Status</label>
                            <select id="filter-status" class="filter-select">
                                <option value="">Todos</option>
                                <option value="ativo">Ativo</option>
                                <option value="manutencao">Em Manutenção</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Buscar</label>
                            <div class="search-input">
                                <i class="fas fa-search"></i>
                                <input type="text" id="search-input" placeholder="Nome, modelo, número série...">
                            </div>
                        </div>
                        <div class="filter-actions">
                            <button class="btn btn-outline btn-sm" id="clear-filters">
                                <i class="fas fa-times"></i>
                                Limpar
                            </button>
                        </div>
                    </div>
                    
                    <div class="view-controls">
                        <div class="view-mode-toggle">
                            <button class="view-mode-btn active" data-mode="grid" title="Visualização em grade">
                                <i class="fas fa-th"></i>
                            </button>
                            <button class="view-mode-btn" data-mode="table" title="Visualização em tabela">
                                <i class="fas fa-list"></i>
                            </button>
                        </div>
                        <div class="items-per-page">
                            <select id="items-per-page" class="form-select form-select-sm">
                                <option value="12">12 por página</option>
                                <option value="24">24 por página</option>
                                <option value="48">48 por página</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Estatísticas rápidas -->
                <div class="quick-stats">
                    <div class="stat-card stat-card-success">
                        <div class="stat-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-ativos">0</div>
                            <div class="stat-label">Ativos</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-warning">
                        <div class="stat-icon">
                            <i class="fas fa-wrench"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-manutencao">0</div>
                            <div class="stat-label">Em Manutenção</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-danger">
                        <div class="stat-icon">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-inativos">0</div>
                            <div class="stat-label">Inativos</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-info">
                        <div class="stat-icon">
                            <i class="fas fa-cogs"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-total">0</div>
                            <div class="stat-label">Total</div>
                        </div>
                    </div>
                </div>

                <!-- Conteúdo principal -->
                <div class="equipments-content">
                    <div class="content-header">
                        <div class="content-info">
                            <span id="content-info">Mostrando 0 de 0 equipamentos</span>
                        </div>
                        <div class="sort-controls" id="sort-controls">
                            <label>Ordenar por:</label>
                            <select id="sort-select" class="form-select form-select-sm">
                                <option value="nome-asc">Nome (A-Z)</option>
                                <option value="nome-desc">Nome (Z-A)</option>
                                <option value="tipo-asc">Tipo (A-Z)</option>
                                <option value="status-asc">Status</option>
                                <option value="created_at-desc">Mais recentes</option>
                                <option value="created_at-asc">Mais antigos</option>
                            </select>
                        </div>
                    </div>

                    <!-- Grid view -->
                    <div id="grid-view" class="equipments-grid">
                        <!-- Cards serão inseridos aqui -->
                    </div>

                    <!-- Table view -->
                    <div id="table-view" class="table-responsive" style="display: none;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Equipamento</th>
                                    <th>Tipo</th>
                                    <th>Modelo</th>
                                    <th>Número Série</th>
                                    <th>Status</th>
                                    <th>Última Manutenção</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="table-body">
                                <!-- Linhas serão inseridas aqui -->
                            </tbody>
                        </table>
                    </div>

                    <!-- Paginação -->
                    <div class="pagination-container">
                        <div class="pagination" id="pagination">
                            <!-- Botões de paginação serão inseridos aqui -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEvents(container) {
        // Botão de refresh
        const refreshBtn = container.querySelector('#refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }

        // Botão de novo equipamento
        const createBtn = container.querySelector('#create-equipment');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Filtros
        const tipoFilter = container.querySelector('#filter-tipo');
        const statusFilter = container.querySelector('#filter-status');
        const searchInput = container.querySelector('#search-input');
        const clearFiltersBtn = container.querySelector('#clear-filters');

        if (tipoFilter) {
            tipoFilter.addEventListener('change', () => this.applyFilters());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => this.applyFilters(), 300));
        }
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Controles de visualização
        const viewModeButtons = container.querySelectorAll('.view-mode-btn');
        viewModeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.setViewMode(mode);
            });
        });

        // Items per page
        const itemsPerPageSelect = container.querySelector('#items-per-page');
        if (itemsPerPageSelect) {
            itemsPerPageSelect.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.updateContent();
            });
        }

        // Ordenação
        const sortSelect = container.querySelector('#sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const [field, direction] = e.target.value.split('-');
                this.currentSort = { field, direction };
                this.sortData();
                this.updateContent();
            });
        }
    }

    async loadEquipmentTypes() {
        try {
            const types = await API.equipmentTypes.getAll();
            const tipoFilter = document.querySelector('#filter-tipo');
            
            if (tipoFilter) {
                // Limpar opções existentes (exceto "Todos os tipos")
                tipoFilter.innerHTML = '<option value="">Todos os tipos</option>';
                
                // Adicionar tipos
                types.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type.id;
                    option.textContent = type.nome;
                    tipoFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar tipos de equipamento:', error);
        }
    }

    applyFilters() {
        const tipoFilter = document.querySelector('#filter-tipo')?.value || '';
        const statusFilter = document.querySelector('#filter-status')?.value || '';
        const searchTerm = document.querySelector('#search-input')?.value.toLowerCase() || '';

        this.currentFilters = {
            tipo: tipoFilter,
            status: statusFilter,
            search: searchTerm
        };

        this.filteredData = this.data.filter(item => {
            // Filtro de tipo
            if (tipoFilter && item.tipo_equipamento_id != tipoFilter) {
                return false;
            }

            // Filtro de status
            if (statusFilter && item.status !== statusFilter) {
                return false;
            }

            // Filtro de busca
            if (searchTerm) {
                const searchFields = [
                    item.nome,
                    item.modelo,
                    item.numero_serie,
                    item.tipo_nome
                ].filter(field => field).join(' ').toLowerCase();

                if (!searchFields.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        this.currentPage = 1;
        this.sortData();
        this.updateContent();
        this.updateStats();
    }

    clearFilters() {
        document.querySelector('#filter-tipo').value = '';
        document.querySelector('#filter-status').value = '';
        document.querySelector('#search-input').value = '';
        
        this.currentFilters = {};
        this.filteredData = [...this.data];
        this.currentPage = 1;
        this.updateContent();
        this.updateStats();
    }

    sortData() {
        this.filteredData.sort((a, b) => {
            const field = this.currentSort.field;
            const direction = this.currentSort.direction;
            
            let aValue = a[field];
            let bValue = b[field];

            // Tratamento especial para datas
            if (field.includes('_at')) {
                aValue = new Date(aValue || 0);
                bValue = new Date(bValue || 0);
            }

            // Tratamento para valores nulos
            if (aValue === null || aValue === undefined) aValue = '';
            if (bValue === null || bValue === undefined) bValue = '';

            if (direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    setViewMode(mode) {
        this.viewMode = mode;
        
        // Atualizar botões
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Mostrar/ocultar views
        const gridView = document.getElementById('grid-view');
        const tableView = document.getElementById('table-view');
        
        if (mode === 'grid') {
            gridView.style.display = 'grid';
            tableView.style.display = 'none';
            this.itemsPerPage = parseInt(document.querySelector('#items-per-page').value) || 12;
        } else {
            gridView.style.display = 'none';
            tableView.style.display = 'block';
            this.itemsPerPage = parseInt(document.querySelector('#items-per-page').value) || 12;
        }

        this.updateContent();
    }

    updateContent() {
        if (this.viewMode === 'grid') {
            this.updateGridView();
        } else {
            this.updateTableView();
        }

        this.updateContentInfo();
        this.updatePagination();
    }

    updateGridView() {
        const gridView = document.getElementById('grid-view');
        if (!gridView) return;

        // Calcular paginação
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        // Renderizar cards
        gridView.innerHTML = pageData.length === 0 ? `
            <div class="empty-state-grid">
                <div class="empty-state">
                    <i class="fas fa-truck text-gray-400 text-6xl mb-4"></i>
                    <h3 class="text-gray-600 text-xl mb-2">Nenhum equipamento encontrado</h3>
                    <p class="text-gray-500">Tente ajustar os filtros ou adicionar novos equipamentos</p>
                </div>
            </div>
        ` : pageData.map(item => this.getEquipmentCardHTML(item)).join('');
    }

    updateTableView() {
        const tbody = document.querySelector('#table-body');
        if (!tbody) return;

        // Calcular paginação
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        // Renderizar linhas
        tbody.innerHTML = pageData.length === 0 ? `
            <tr>
                <td colspan="7" class="text-center py-8">
                    <div class="empty-state">
                        <i class="fas fa-truck text-gray-400 text-4xl mb-4"></i>
                        <p class="text-gray-600">Nenhum equipamento encontrado</p>
                    </div>
                </td>
            </tr>
        ` : pageData.map(item => this.getTableRowHTML(item)).join('');
    }

    getEquipmentCardHTML(item) {
        return `
            <div class="equipment-card">
                <div class="equipment-card-header">
                    <div class="equipment-icon">
                        <i class="${this.getEquipmentIcon(item.tipo_nome)}"></i>
                    </div>
                    <div class="equipment-status">
                        <span class="status-badge status-${item.status}">
                            ${Utils.formatStatus(item.status)}
                        </span>
                    </div>
                </div>
                
                <div class="equipment-card-body">
                    <h3 class="equipment-name">${item.nome}</h3>
                    <p class="equipment-type">${item.tipo_nome || 'Tipo não definido'}</p>
                    
                    <div class="equipment-details">
                        <div class="detail-item">
                            <span class="detail-label">Modelo:</span>
                            <span class="detail-value">${item.modelo || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Série:</span>
                            <span class="detail-value">${item.numero_serie || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Localização:</span>
                            <span class="detail-value">${item.localizacao || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="equipment-card-footer">
                    <div class="equipment-stats">
                        <div class="stat-item">
                            <i class="fas fa-wrench"></i>
                            <span>${item.total_os || 0} OS</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-clock"></i>
                            <span>${item.ultima_manutencao ? Utils.formatDate(item.ultima_manutencao) : 'Nunca'}</span>
                        </div>
                    </div>
                    
                    <div class="equipment-actions">
                        <button class="btn-icon btn-icon-primary" onclick="equipmentsPage.showViewModal(${JSON.stringify(item).replace(/"/g, '&quot;')})" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${auth.hasPermission('admin') ? `
                            <button class="btn-icon btn-icon-secondary" onclick="equipmentsPage.showEditModal(${JSON.stringify(item).replace(/"/g, '&quot;')})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        <button class="btn-icon btn-icon-success" onclick="equipmentsPage.createWorkOrder(${item.id})" title="Nova OS">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getTableRowHTML(item) {
        return `
            <tr>
                <td>
                    <div class="equipment-info">
                        <div class="equipment-icon-small">
                            <i class="${this.getEquipmentIcon(item.tipo_nome)}"></i>
                        </div>
                        <div>
                            <span class="font-medium">${item.nome}</span>
                            <small class="text-gray-500 block">${item.localizacao || 'Localização não definida'}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge badge-outline">${item.tipo_nome || 'N/A'}</span>
                </td>
                <td>${item.modelo || 'N/A'}</td>
                <td>
                    <span class="font-mono text-sm">${item.numero_serie || 'N/A'}</span>
                </td>
                <td>
                    <span class="status-badge status-${item.status}">
                        ${Utils.formatStatus(item.status)}
                    </span>
                </td>
                <td>
                    ${item.ultima_manutencao ? Utils.formatDate(item.ultima_manutencao) : 'Nunca'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-icon-primary" onclick="equipmentsPage.showViewModal(${JSON.stringify(item).replace(/"/g, '&quot;')})" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${auth.hasPermission('admin') ? `
                            <button class="btn-icon btn-icon-secondary" onclick="equipmentsPage.showEditModal(${JSON.stringify(item).replace(/"/g, '&quot;')})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        <button class="btn-icon btn-icon-success" onclick="equipmentsPage.createWorkOrder(${item.id})" title="Nova OS">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getEquipmentIcon(tipo) {
        const icons = {
            'Caminhão': 'fas fa-truck',
            'Escavadeira': 'fas fa-hammer',
            'Trator': 'fas fa-tractor',
            'Carregadeira': 'fas fa-truck-loading',
            'Britador': 'fas fa-cogs',
            'Peneira': 'fas fa-filter',
            'Esteira': 'fas fa-conveyor-belt',
            'Bomba': 'fas fa-pump',
            'Compressor': 'fas fa-compress-arrows-alt',
            'Gerador': 'fas fa-bolt'
        };
        
        return icons[tipo] || 'fas fa-cog';
    }

    updateContentInfo() {
        const contentInfo = document.querySelector('#content-info');
        if (contentInfo) {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
            const endIndex = Math.min(startIndex + this.itemsPerPage - 1, this.filteredData.length);
            
            contentInfo.textContent = this.filteredData.length === 0 
                ? 'Nenhum equipamento encontrado'
                : `Mostrando ${startIndex} a ${endIndex} de ${this.filteredData.length} equipamentos`;
        }
    }

    updatePagination() {
        const paginationContainer = document.querySelector('#pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Botão anterior
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="equipmentsPage.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Botões de página
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="equipmentsPage.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="equipmentsPage.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="equipmentsPage.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // Botão próximo
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="equipmentsPage.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    updateStats() {
        const stats = {
            ativos: this.data.filter(item => item.status === 'ativo').length,
            manutencao: this.data.filter(item => item.status === 'manutencao').length,
            inativos: this.data.filter(item => item.status === 'inativo').length,
            total: this.data.length
        };

        document.querySelector('#stat-ativos').textContent = stats.ativos;
        document.querySelector('#stat-manutencao').textContent = stats.manutencao;
        document.querySelector('#stat-inativos').textContent = stats.inativos;
        document.querySelector('#stat-total').textContent = stats.total;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateContent();
        }
    }

    async refresh() {
        try {
            const refreshBtn = document.querySelector('#refresh-data');
            if (refreshBtn) {
                const icon = refreshBtn.querySelector('i');
                icon.classList.add('fa-spin');
                refreshBtn.disabled = true;
            }

            await this.loadData();
            await this.loadEquipmentTypes();
            this.applyFilters();
            Toast.success('Dados atualizados');

        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            Toast.error('Erro ao atualizar dados');
        } finally {
            const refreshBtn = document.querySelector('#refresh-data');
            if (refreshBtn) {
                const icon = refreshBtn.querySelector('i');
                icon.classList.remove('fa-spin');
                refreshBtn.disabled = false;
            }
        }
    }

    showCreateModal() {
        const modalContent = `
            <form id="equipment-form" class="form-grid">
                <div class="form-group">
                    <label class="form-label">Nome do Equipamento *</label>
                    <input type="text" name="nome" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Tipo de Equipamento *</label>
                    <select name="tipo_equipamento_id" class="form-select" required>
                        <option value="">Selecione um tipo</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Modelo</label>
                    <input type="text" name="modelo" class="form-input">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Número de Série</label>
                    <input type="text" name="numero_serie" class="form-input">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Status *</label>
                    <select name="status" class="form-select" required>
                        <option value="ativo">Ativo</option>
                        <option value="manutencao">Em Manutenção</option>
                        <option value="inativo">Inativo</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Localização</label>
                    <input type="text" name="localizacao" class="form-input">
                </div>
                
                <div class="form-group" style="grid-column: 1 / -1;">
                    <label class="form-label">Descrição</label>
                    <textarea name="descricao" class="form-textarea" rows="3"></textarea>
                </div>
            </form>
        `;

        const modal = Modal.show({
            title: 'Novo Equipamento',
            content: modalContent,
            size: 'lg'
        });

        // Carregar tipos de equipamento
        this.loadEquipmentTypesForModal(modal);

        // Adicionar botões no footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        footer.innerHTML = `
            <button type="button" class="btn btn-secondary" data-action="cancel">Cancelar</button>
            <button type="button" class="btn btn-primary" data-action="save">Salvar</button>
        `;
        modal.querySelector('.modal-body').appendChild(footer);

        // Event listeners
        modal.addEventListener('click', async (e) => {
            if (e.target.dataset.action === 'cancel') {
                Modal.close(modal);
            } else if (e.target.dataset.action === 'save') {
                await this.saveEquipment(modal);
            }
        });
    }

    showEditModal(equipment) {
        const modalContent = `
            <form id="equipment-form" class="form-grid">
                <div class="form-group">
                    <label class="form-label">Nome do Equipamento *</label>
                    <input type="text" name="nome" class="form-input" value="${equipment.nome || ''}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Tipo de Equipamento *</label>
                    <select name="tipo_equipamento_id" class="form-select" required>
                        <option value="">Selecione um tipo</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Modelo</label>
                    <input type="text" name="modelo" class="form-input" value="${equipment.modelo || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Número de Série</label>
                    <input type="text" name="numero_serie" class="form-input" value="${equipment.numero_serie || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Status *</label>
                    <select name="status" class="form-select" required>
                        <option value="ativo" ${equipment.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                        <option value="manutencao" ${equipment.status === 'manutencao' ? 'selected' : ''}>Em Manutenção</option>
                        <option value="inativo" ${equipment.status === 'inativo' ? 'selected' : ''}>Inativo</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Localização</label>
                    <input type="text" name="localizacao" class="form-input" value="${equipment.localizacao || ''}">
                </div>
                
                <div class="form-group" style="grid-column: 1 / -1;">
                    <label class="form-label">Descrição</label>
                    <textarea name="descricao" class="form-textarea" rows="3">${equipment.descricao || ''}</textarea>
                </div>
            </form>
        `;

        const modal = Modal.show({
            title: 'Editar Equipamento',
            content: modalContent,
            size: 'lg'
        });

        // Carregar tipos de equipamento
        this.loadEquipmentTypesForModal(modal, equipment.tipo_equipamento_id);

        // Adicionar botões no footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        footer.innerHTML = `
            <button type="button" class="btn btn-secondary" data-action="cancel">Cancelar</button>
            <button type="button" class="btn btn-primary" data-action="save">Salvar</button>
        `;
        modal.querySelector('.modal-body').appendChild(footer);

        // Event listeners
        modal.addEventListener('click', async (e) => {
            if (e.target.dataset.action === 'cancel') {
                Modal.close(modal);
            } else if (e.target.dataset.action === 'save') {
                await this.updateEquipment(modal, equipment.id);
            }
        });
    }

    async loadEquipmentTypesForModal(modal, selectedId = null) {
        try {
            const types = await API.equipmentTypes.getAll();
            const select = modal.querySelector('select[name="tipo_equipamento_id"]');
            
            if (select) {
                // Limpar opções existentes (exceto a primeira)
                select.innerHTML = '<option value="">Selecione um tipo</option>';
                
                // Adicionar tipos
                types.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type.id;
                    option.textContent = type.nome;
                    if (selectedId && type.id == selectedId) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar tipos de equipamento:', error);
            Toast.error('Erro ao carregar tipos de equipamento');
        }
    }

    async saveEquipment(modal) {
        try {
            const form = modal.querySelector('#equipment-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Validação básica
            if (!data.nome || !data.tipo_equipamento_id || !data.status) {
                Toast.error('Preencha todos os campos obrigatórios');
                return;
            }

            Loading.show('Salvando equipamento...');

            await API.equipments.create(data);
            
            Loading.hide();
            Modal.close(modal);
            Toast.success('Equipamento criado com sucesso!');
            
            // Recarregar dados
            await this.refresh();

        } catch (error) {
            Loading.hide();
            console.error('Erro ao salvar equipamento:', error);
            Toast.error('Erro ao salvar equipamento: ' + (error.message || 'Erro desconhecido'));
        }
    }

    async updateEquipment(modal, equipmentId) {
        try {
            const form = modal.querySelector('#equipment-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Validação básica
            if (!data.nome || !data.tipo_equipamento_id || !data.status) {
                Toast.error('Preencha todos os campos obrigatórios');
                return;
            }

            Loading.show('Atualizando equipamento...');

            await API.equipments.update(equipmentId, data);
            
            Loading.hide();
            Modal.close(modal);
            Toast.success('Equipamento atualizado com sucesso!');
            
            // Recarregar dados
            await this.refresh();

        } catch (error) {
            Loading.hide();
            console.error('Erro ao atualizar equipamento:', error);
            Toast.error('Erro ao atualizar equipamento: ' + (error.message || 'Erro desconhecido'));
        }
    }

    async deleteEquipment(equipmentId, equipmentName) {
        try {
            const confirmed = await Modal.confirm(
                `Tem certeza que deseja excluir o equipamento "${equipmentName}"?`,
                'Confirmar Exclusão'
            );

            if (!confirmed) return;

            Loading.show('Excluindo equipamento...');

            await API.equipments.delete(equipmentId);
            
            Loading.hide();
            Toast.success('Equipamento excluído com sucesso!');
            
            // Recarregar dados
            await this.refresh();

        } catch (error) {
            Loading.hide();
            console.error('Erro ao excluir equipamento:', error);
            Toast.error('Erro ao excluir equipamento: ' + (error.message || 'Erro desconhecido'));
        }
    }

    showViewModal(equipment) {
        const modalContent = `
            <div class="equipment-details">
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Nome:</label>
                        <span>${equipment.nome || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Tipo:</label>
                        <span>${equipment.tipo_nome || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Modelo:</label>
                        <span>${equipment.modelo || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Número de Série:</label>
                        <span>${equipment.numero_serie || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="badge badge-${this.getStatusBadgeClass(equipment.status)}">${this.getStatusLabel(equipment.status)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Localização:</label>
                        <span>${equipment.localizacao || '-'}</span>
                    </div>
                    <div class="detail-item full-width">
                        <label>Descrição:</label>
                        <span>${equipment.descricao || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Criado em:</label>
                        <span>${equipment.created_at ? Utils.formatDate(equipment.created_at) : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Atualizado em:</label>
                        <span>${equipment.updated_at ? Utils.formatDate(equipment.updated_at) : '-'}</span>
                    </div>
                </div>
            </div>
        `;

        const modal = Modal.show({
            title: `Detalhes do Equipamento: ${equipment.nome}`,
            content: modalContent,
            size: 'lg'
        });

        // Adicionar botões no footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        footer.innerHTML = `
            <button type="button" class="btn btn-secondary" data-action="close">Fechar</button>
            ${auth.hasPermission('admin') ? `
                <button type="button" class="btn btn-warning" data-action="edit">Editar</button>
                <button type="button" class="btn btn-danger" data-action="delete">Excluir</button>
            ` : ''}
        `;
        modal.querySelector('.modal-body').appendChild(footer);

        // Event listeners
        modal.addEventListener('click', async (e) => {
            if (e.target.dataset.action === 'close') {
                Modal.close(modal);
            } else if (e.target.dataset.action === 'edit') {
                Modal.close(modal);
                this.showEditModal(equipment);
            } else if (e.target.dataset.action === 'delete') {
                Modal.close(modal);
                await this.deleteEquipment(equipment.id, equipment.nome);
            }
        });
    }

    viewDetails(id) {
        // TODO: Implementar visualização de detalhes
        Toast.info('Visualização de detalhes em desenvolvimento');
    }

    editEquipment(id) {
        // TODO: Implementar edição de equipamento
        Toast.info('Edição de equipamento em desenvolvimento');
    }

    createWorkOrder(equipmentId) {
        // TODO: Implementar criação de OS para equipamento
        Toast.info('Criação de OS em desenvolvimento');
    }
}

// Instância global para uso nos event handlers
const equipmentsPage = new EquipmentsPage();

// Exportar para uso global
window.EquipmentsPage = EquipmentsPage;

