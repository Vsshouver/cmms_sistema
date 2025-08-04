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
                        <button class="btn-icon btn-icon-primary" onclick="equipmentsPage.viewDetails(${item.id})" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${auth.hasPermission('admin') ? `
                            <button class="btn-icon btn-icon-secondary" onclick="equipmentsPage.editEquipment(${item.id})" title="Editar">
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
                        <button class="btn-icon btn-icon-primary" onclick="equipmentsPage.viewDetails(${item.id})" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${auth.hasPermission('admin') ? `
                            <button class="btn-icon btn-icon-secondary" onclick="equipmentsPage.editEquipment(${item.id})" title="Editar">
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

    async showCreateModal() {
        try {
            const typesResp = await API.equipmentTypes.getAll();
            const types = typesResp.data || typesResp || [];

            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            modal.innerHTML = `
                <h2>Novo Equipamento</h2>
                <form id="equipmentForm">
                    <label for="equipment-codigo_interno">Código Interno*</label>
                    <input type="text" id="equipment-codigo_interno" name="codigo_interno" required />

                    <label for="equipment-nome">Nome*</label>
                    <input type="text" id="equipment-nome" name="nome" required />

                    <label for="equipment-tipo">Tipo*</label>
                    <select id="equipment-tipo" name="tipo" required>
                        <option value="">Selecione...</option>
                        ${types.map(t => `<option value="${t.nome}">${t.nome}</option>`).join('')}
                    </select>

                    <label for="equipment-modelo">Modelo*</label>
                    <input type="text" id="equipment-modelo" name="modelo" required />

                    <label for="equipment-fabricante">Fabricante*</label>
                    <input type="text" id="equipment-fabricante" name="fabricante" required />

                    <label for="equipment-numero_serie">Número de Série*</label>
                    <input type="text" id="equipment-numero_serie" name="numero_serie" required />

                    <label for="equipment-status">Status*</label>
                    <select id="equipment-status" name="status" required>
                        <option value="ativo">Ativo</option>
                        <option value="manutencao">Em Manutenção</option>
                        <option value="inativo">Inativo</option>
                    </select>

                    <label for="equipment-localizacao">Localização*</label>
                    <input type="text" id="equipment-localizacao" name="localizacao" required />

                    <label for="equipment-horimetro_atual">Horímetro Atual</label>
                    <input type="number" id="equipment-horimetro_atual" name="horimetro_atual" step="0.01" />

                    <label for="equipment-data_aquisicao">Data de Aquisição*</label>
                    <input type="date" id="equipment-data_aquisicao" name="data_aquisicao" required />

                    <label for="equipment-valor_aquisicao">Valor de Aquisição</label>
                    <input type="number" id="equipment-valor_aquisicao" name="valor_aquisicao" step="0.01" />

                    <label for="equipment-observacoes">Observações</label>
                    <textarea id="equipment-observacoes" name="observacoes" rows="2"></textarea>

                    <div class="form-actions">
                        <button type="submit">Salvar</button>
                        <button type="button" id="cancelEquipment">Cancelar</button>
                    </div>
                </form>
            `;

            overlay.appendChild(modal);
            (document.getElementById('modals-container') || document.body).appendChild(overlay);

            if (!document.getElementById('equipments-modal-style')) {
                const style = document.createElement('style');
                style.id = 'equipments-modal-style';
                style.textContent = `
                    .custom-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;justify-content:center;align-items:center;background:rgba(0,0,0,0.5);z-index:10000;}
                    .custom-modal{background:#fff;padding:20px;width:450px;max-height:80vh;overflow-y:auto;border-radius:4px;}
                    .custom-modal form{display:flex;flex-direction:column;gap:10px;}
                    .custom-modal .form-actions{display:flex;justify-content:flex-end;gap:10px;}
                `;
                document.head.appendChild(style);
            }

            modal.querySelector('#cancelEquipment').addEventListener('click', () => overlay.remove());

            modal.querySelector('#equipmentForm').addEventListener('submit', async e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const payload = {
                    codigo_interno: formData.get('codigo_interno'),
                    nome: formData.get('nome'),
                    tipo: formData.get('tipo'),
                    modelo: formData.get('modelo'),
                    fabricante: formData.get('fabricante'),
                    numero_serie: formData.get('numero_serie'),
                    status: formData.get('status'),
                    localizacao: formData.get('localizacao'),
                    horimetro_atual: parseFloat(formData.get('horimetro_atual') || 0),
                    data_aquisicao: formData.get('data_aquisicao'),
                    valor_aquisicao: parseFloat(formData.get('valor_aquisicao') || 0),
                    observacoes: formData.get('observacoes') || null
                };
                try {
                    await API.equipments.create(payload);
                    Toast.success('Equipamento criado com sucesso');
                    overlay.remove();
                    await this.refresh();
                } catch (err) {
                    Toast.error(err.message || 'Erro ao criar equipamento');
                }
            });
        } catch (error) {
            console.error('Erro ao exibir modal de criação:', error);
            Toast.error('Erro ao preparar modal');
        }
    }

    async viewDetails(id) {
        try {
            const data = await API.equipments.get(id);
            const eq = data.equipamento || data;

            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            modal.innerHTML = `
                <h2>Detalhes do Equipamento</h2>
                <div class="equipment-details-modal">
                    <p><strong>Código:</strong> ${eq.codigo_interno}</p>
                    <p><strong>Nome:</strong> ${eq.nome}</p>
                    <p><strong>Tipo:</strong> ${eq.tipo || eq.tipo_equipamento}</p>
                    <p><strong>Modelo:</strong> ${eq.modelo}</p>
                    <p><strong>Fabricante:</strong> ${eq.fabricante}</p>
                    <p><strong>Número Série:</strong> ${eq.numero_serie}</p>
                    <p><strong>Status:</strong> ${Utils.formatStatus(eq.status)}</p>
                    <p><strong>Localização:</strong> ${eq.localizacao}</p>
                    <p><strong>Horímetro:</strong> ${Utils.formatNumber(eq.horimetro_atual || 0, 2)}</p>
                    <p><strong>Data Aquisição:</strong> ${Utils.formatDate(eq.data_aquisicao)}</p>
                    ${eq.valor_aquisicao ? `<p><strong>Valor Aquisição:</strong> R$ ${Utils.formatCurrency(eq.valor_aquisicao)}</p>` : ''}
                    ${eq.observacoes ? `<p><strong>Observações:</strong> ${eq.observacoes}</p>` : ''}
                </div>
                <div class="form-actions"><button id="closeDetails">Fechar</button></div>
            `;

            overlay.appendChild(modal);
            (document.getElementById('modals-container') || document.body).appendChild(overlay);

            modal.querySelector('#closeDetails').addEventListener('click', () => overlay.remove());

            if (!document.getElementById('equipments-modal-style')) {
                const style = document.createElement('style');
                style.id = 'equipments-modal-style';
                style.textContent = `
                    .custom-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;justify-content:center;align-items:center;background:rgba(0,0,0,0.5);z-index:10000;}
                    .custom-modal{background:#fff;padding:20px;width:450px;max-height:80vh;overflow-y:auto;border-radius:4px;}
                    .custom-modal .form-actions{display:flex;justify-content:flex-end;margin-top:10px;}
                `;
                document.head.appendChild(style);
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes do equipamento:', error);
            Toast.error('Erro ao carregar detalhes');
        }
    }

    async editEquipment(id) {
        try {
            const [equipResp, typesResp] = await Promise.all([
                API.equipments.get(id),
                API.equipmentTypes.getAll()
            ]);

            const eq = equipResp.equipamento || equipResp;
            const types = typesResp.data || typesResp || [];

            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            modal.innerHTML = `
                <h2>Editar Equipamento</h2>
                <form id="editEquipmentForm">
                    <label for="edit-equipment-nome">Nome*</label>
                    <input type="text" id="edit-equipment-nome" name="nome" value="${eq.nome || ''}" required />

                    <label for="edit-equipment-tipo">Tipo*</label>
                    <select id="edit-equipment-tipo" name="tipo" required>
                        ${types.map(t => `<option value="${t.nome}" ${t.nome === (eq.tipo || eq.tipo_equipamento) ? 'selected' : ''}>${t.nome}</option>`).join('')}
                    </select>

                    <label for="edit-equipment-modelo">Modelo*</label>
                    <input type="text" id="edit-equipment-modelo" name="modelo" value="${eq.modelo || ''}" required />

                    <label for="edit-equipment-fabricante">Fabricante*</label>
                    <input type="text" id="edit-equipment-fabricante" name="fabricante" value="${eq.fabricante || ''}" required />

                    <label for="edit-equipment-status">Status*</label>
                    <select id="edit-equipment-status" name="status" required>
                        <option value="ativo" ${eq.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                        <option value="manutencao" ${eq.status === 'manutencao' ? 'selected' : ''}>Em Manutenção</option>
                        <option value="inativo" ${eq.status === 'inativo' ? 'selected' : ''}>Inativo</option>
                    </select>

                    <label for="edit-equipment-localizacao">Localização*</label>
                    <input type="text" id="edit-equipment-localizacao" name="localizacao" value="${eq.localizacao || ''}" required />

                    <label for="edit-equipment-horimetro_atual">Horímetro Atual</label>
                    <input type="number" id="edit-equipment-horimetro_atual" name="horimetro_atual" step="0.01" value="${eq.horimetro_atual || 0}" />

                    <label for="edit-equipment-valor_aquisicao">Valor de Aquisição</label>
                    <input type="number" id="edit-equipment-valor_aquisicao" name="valor_aquisicao" step="0.01" value="${eq.valor_aquisicao || ''}" />

                    <label for="edit-equipment-observacoes">Observações</label>
                    <textarea id="edit-equipment-observacoes" name="observacoes" rows="2">${eq.observacoes || ''}</textarea>

                    <div class="form-actions">
                        <button type="submit">Salvar</button>
                        <button type="button" id="cancelEditEquipment">Cancelar</button>
                    </div>
                </form>
            `;

            overlay.appendChild(modal);
            (document.getElementById('modals-container') || document.body).appendChild(overlay);

            if (!document.getElementById('equipments-modal-style')) {
                const style = document.createElement('style');
                style.id = 'equipments-modal-style';
                style.textContent = `
                    .custom-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;justify-content:center;align-items:center;background:rgba(0,0,0,0.5);z-index:10000;}
                    .custom-modal{background:#fff;padding:20px;width:450px;max-height:80vh;overflow-y:auto;border-radius:4px;}
                    .custom-modal form{display:flex;flex-direction:column;gap:10px;}
                    .custom-modal .form-actions{display:flex;justify-content:flex-end;gap:10px;}
                `;
                document.head.appendChild(style);
            }

            modal.querySelector('#cancelEditEquipment').addEventListener('click', () => overlay.remove());

            modal.querySelector('#editEquipmentForm').addEventListener('submit', async e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const payload = {
                    nome: formData.get('nome'),
                    tipo: formData.get('tipo'),
                    modelo: formData.get('modelo'),
                    fabricante: formData.get('fabricante'),
                    status: formData.get('status'),
                    localizacao: formData.get('localizacao'),
                    horimetro_atual: parseFloat(formData.get('horimetro_atual') || 0),
                    valor_aquisicao: parseFloat(formData.get('valor_aquisicao') || 0),
                    observacoes: formData.get('observacoes') || null
                };
                try {
                    await API.equipments.update(id, payload);
                    Toast.success('Equipamento atualizado com sucesso');
                    overlay.remove();
                    await this.refresh();
                } catch (err) {
                    Toast.error(err.message || 'Erro ao atualizar equipamento');
                }
            });
        } catch (error) {
            console.error('Erro ao editar equipamento:', error);
            Toast.error('Erro ao preparar edição');
        }
    }

    async createWorkOrder(equipmentId) {
        try {
            const [equipResp, typesResp, mechResp] = await Promise.all([
                API.equipments.get(equipmentId),
                API.maintenanceTypes.getAll(),
                API.mechanics.getAll()
            ]);

            const equipment = equipResp.equipamento || equipResp;
            const types = typesResp.data || typesResp || [];
            const mechanics = mechResp.data || mechResp || [];

            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            modal.innerHTML = `
                <h2>Nova Ordem de Serviço</h2>
                <form id="osFromEquipment">
                    <label for="os-equipamento-nome">Equipamento</label>
                    <input type="text" id="os-equipamento-nome" value="${equipment.nome}" disabled />
                    <input type="hidden" id="os-equipamento-id" name="equipamento_id" value="${equipmentId}" />

                    <label for="os-tipo">Tipo de Manutenção*</label>
                    <select id="os-tipo" name="tipo" required>
                        <option value="">Selecione...</option>
                        ${types.map(t => `<option value="${t.id}">${t.nome}</option>`).join('')}
                    </select>

                    <label for="os-prioridade">Prioridade*</label>
                    <select id="os-prioridade" name="prioridade" required>
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                    </select>

                    <label for="os-mecanico_id">Mecânico (opcional)</label>
                    <select id="os-mecanico_id" name="mecanico_id">
                        <option value="">Nenhum</option>
                        ${mechanics.map(m => `<option value="${m.id}">${m.nome_completo || m.nome}</option>`).join('')}
                    </select>

                    <label for="os-data_prevista">Data Prevista</label>
                    <input type="datetime-local" id="os-data_prevista" name="data_prevista" />

                    <label for="os-descricao_problema">Descrição do Problema*</label>
                    <textarea id="os-descricao_problema" name="descricao_problema" rows="3" required></textarea>

                    <label for="os-observacoes">Observações</label>
                    <textarea id="os-observacoes" name="observacoes" rows="2"></textarea>

                    <div class="form-actions">
                        <button type="submit">Salvar</button>
                        <button type="button" id="cancelCreateOS">Cancelar</button>
                    </div>
                </form>
            `;

            overlay.appendChild(modal);
            (document.getElementById('modals-container') || document.body).appendChild(overlay);

            if (!document.getElementById('equipments-modal-style')) {
                const style = document.createElement('style');
                style.id = 'equipments-modal-style';
                style.textContent = `
                    .custom-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;justify-content:center;align-items:center;background:rgba(0,0,0,0.5);z-index:10000;}
                    .custom-modal{background:#fff;padding:20px;width:450px;max-height:80vh;overflow-y:auto;border-radius:4px;}
                    .custom-modal form{display:flex;flex-direction:column;gap:10px;}
                    .custom-modal .form-actions{display:flex;justify-content:flex-end;gap:10px;}
                `;
                document.head.appendChild(style);
            }

            modal.querySelector('#cancelCreateOS').addEventListener('click', () => overlay.remove());

            modal.querySelector('#osFromEquipment').addEventListener('submit', async e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const payload = {
                    equipamento_id: parseInt(formData.get('equipamento_id')), 
                    tipo: parseInt(formData.get('tipo')), 
                    prioridade: formData.get('prioridade'),
                    mecanico_id: formData.get('mecanico_id') ? parseInt(formData.get('mecanico_id')) : null,
                    data_prevista: formData.get('data_prevista') ? new Date(formData.get('data_prevista')).toISOString().slice(0,19).replace('T',' ') : null,
                    descricao_problema: formData.get('descricao_problema'),
                    observacoes: formData.get('observacoes') || null
                };
                try {
                    await API.workOrders.create(payload);
                    Toast.success('Ordem de serviço criada com sucesso');
                    overlay.remove();
                    await this.refresh();
                } catch (err) {
                    Toast.error(err.message || 'Erro ao criar ordem de serviço');
                }
            });
        } catch (error) {
            console.error('Erro ao criar OS para equipamento:', error);
            Toast.error('Erro ao preparar OS');
        }
    }
}

// Instância global para uso nos event handlers
const equipmentsPage = new EquipmentsPage();

// Exportar para uso global
window.EquipmentsPage = EquipmentsPage;

