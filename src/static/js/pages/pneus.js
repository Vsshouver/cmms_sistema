// Página de Pneus
class TiresPage {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentFilters = {};
        this.currentSort = { field: 'numero_fogo', direction: 'asc' };
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
            console.error('Erro ao carregar pneus:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.tires.getAll();
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
                <p>Carregando pneus...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Erro ao carregar pneus</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="navigation.navigateTo('pneus')">
                    <i class="fas fa-refresh"></i>
                    Tentar novamente
                </button>
            </div>
        `;
    }

    getHTML() {
        return `
            <div class="tires-page">
                <!-- Header -->
                <div class="page-header">
                    <div class="page-title">
                        <i class="fas fa-circle"></i>
                        <div>
                            <h1>Gestão de Pneus</h1>
                            <p>Controle completo de pneus com tratativas e medição de sulcos</p>
                        </div>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-outline" id="refresh-data">
                            <i class="fas fa-sync-alt"></i>
                            Atualizar
                        </button>
                        <button class="btn btn-outline" id="performance-report" ${!auth.hasPermission('supervisor') ? 'style="display: none;"' : ''}>
                            <i class="fas fa-chart-line"></i>
                            Relatório
                        </button>
                        <button class="btn btn-primary" id="create-tire" ${!auth.hasPermission('almoxarife') ? 'style="display: none;"' : ''}>
                            <i class="fas fa-plus"></i>
                            Novo Pneu
                        </button>
                    </div>
                </div>

                <!-- Filtros e controles -->
                <div class="filters-section">
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label class="filter-label">Status</label>
                            <select id="filter-status" class="filter-select">
                                <option value="">Todos</option>
                                <option value="em_uso">Em Uso</option>
                                <option value="estoque">Estoque</option>
                                <option value="manutencao">Manutenção</option>
                                <option value="recapagem">Recapagem</option>
                                <option value="descarte">Descarte</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Marca</label>
                            <select id="filter-marca" class="filter-select">
                                <option value="">Todas as marcas</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Medida</label>
                            <select id="filter-medida" class="filter-select">
                                <option value="">Todas as medidas</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Buscar</label>
                            <div class="search-input">
                                <i class="fas fa-search"></i>
                                <input type="text" id="search-input" placeholder="Número de fogo, DOT...">
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
                            <i class="fas fa-cog"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-em-uso">0</div>
                            <div class="stat-label">Em Uso</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-info">
                        <div class="stat-icon">
                            <i class="fas fa-box"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-estoque">0</div>
                            <div class="stat-label">Estoque</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-warning">
                        <div class="stat-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-sulco-baixo">0</div>
                            <div class="stat-label">Sulco Baixo</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-danger">
                        <div class="stat-icon">
                            <i class="fas fa-recycle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-recapagem">0</div>
                            <div class="stat-label">Recapagem</div>
                        </div>
                    </div>
                </div>

                <!-- Conteúdo principal -->
                <div class="tires-content">
                    <div class="content-header">
                        <div class="content-info">
                            <span id="content-info">Mostrando 0 de 0 pneus</span>
                        </div>
                        <div class="sort-controls" id="sort-controls">
                            <label>Ordenar por:</label>
                            <select id="sort-select" class="form-select form-select-sm">
                                <option value="numero_fogo-asc">Número de Fogo (A-Z)</option>
                                <option value="marca-asc">Marca (A-Z)</option>
                                <option value="medida-asc">Medida</option>
                                <option value="status-asc">Status</option>
                                <option value="sulco_atual-desc">Maior Sulco</option>
                                <option value="sulco_atual-asc">Menor Sulco</option>
                                <option value="created_at-desc">Mais recentes</option>
                            </select>
                        </div>
                    </div>

                    <!-- Grid view -->
                    <div id="grid-view" class="tires-grid">
                        <!-- Cards serão inseridos aqui -->
                    </div>

                    <!-- Table view -->
                    <div id="table-view" class="table-responsive" style="display: none;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Número de Fogo</th>
                                    <th>Marca/Modelo</th>
                                    <th>Medida</th>
                                    <th>DOT</th>
                                    <th>Status</th>
                                    <th>Sulco Atual</th>
                                    <th>Posição</th>
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

        // Botão de relatório
        const reportBtn = container.querySelector('#performance-report');
        if (reportBtn) {
            reportBtn.addEventListener('click', () => this.showPerformanceReport());
        }

        // Botão de novo pneu
        const createBtn = container.querySelector('#create-tire');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Filtros
        const statusFilter = container.querySelector('#filter-status');
        const marcaFilter = container.querySelector('#filter-marca');
        const medidaFilter = container.querySelector('#filter-medida');
        const searchInput = container.querySelector('#search-input');
        const clearFiltersBtn = container.querySelector('#clear-filters');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
        if (marcaFilter) {
            marcaFilter.addEventListener('change', () => this.applyFilters());
        }
        if (medidaFilter) {
            medidaFilter.addEventListener('change', () => this.applyFilters());
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

    async loadFilterOptions() {
        try {
            // Extrair marcas únicas
            const marcas = [...new Set(this.data.map(item => item.marca).filter(Boolean))].sort();
            const marcaFilter = document.querySelector('#filter-marca');
            
            if (marcaFilter) {
                marcaFilter.innerHTML = '<option value="">Todas as marcas</option>';
                marcas.forEach(marca => {
                    const option = document.createElement('option');
                    option.value = marca;
                    option.textContent = marca;
                    marcaFilter.appendChild(option);
                });
            }

            // Extrair medidas únicas
            const medidas = [...new Set(this.data.map(item => item.medida).filter(Boolean))].sort();
            const medidaFilter = document.querySelector('#filter-medida');
            
            if (medidaFilter) {
                medidaFilter.innerHTML = '<option value="">Todas as medidas</option>';
                medidas.forEach(medida => {
                    const option = document.createElement('option');
                    option.value = medida;
                    option.textContent = medida;
                    medidaFilter.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Erro ao carregar opções dos filtros:', error);
        }
    }

    applyFilters() {
        const statusFilter = document.querySelector('#filter-status')?.value || '';
        const marcaFilter = document.querySelector('#filter-marca')?.value || '';
        const medidaFilter = document.querySelector('#filter-medida')?.value || '';
        const searchTerm = document.querySelector('#search-input')?.value.toLowerCase() || '';

        this.currentFilters = {
            status: statusFilter,
            marca: marcaFilter,
            medida: medidaFilter,
            search: searchTerm
        };

        this.filteredData = this.data.filter(item => {
            // Filtro de status
            if (statusFilter && item.status !== statusFilter) {
                return false;
            }

            // Filtro de marca
            if (marcaFilter && item.marca !== marcaFilter) {
                return false;
            }

            // Filtro de medida
            if (medidaFilter && item.medida !== medidaFilter) {
                return false;
            }

            // Filtro de busca
            if (searchTerm) {
                const searchFields = [
                    item.numero_fogo,
                    item.dot,
                    item.marca,
                    item.modelo
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
        document.querySelector('#filter-status').value = '';
        document.querySelector('#filter-marca').value = '';
        document.querySelector('#filter-medida').value = '';
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

            // Tratamento especial para números
            if (field === 'sulco_atual') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            }

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
        } else {
            gridView.style.display = 'none';
            tableView.style.display = 'block';
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
                    <i class="fas fa-circle text-gray-400 text-6xl mb-4"></i>
                    <h3 class="text-gray-600 text-xl mb-2">Nenhum pneu encontrado</h3>
                    <p class="text-gray-500">Tente ajustar os filtros ou adicionar novos pneus</p>
                </div>
            </div>
        ` : pageData.map(item => this.getTireCardHTML(item)).join('');
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
                <td colspan="8" class="text-center py-8">
                    <div class="empty-state">
                        <i class="fas fa-circle text-gray-400 text-4xl mb-4"></i>
                        <p class="text-gray-600">Nenhum pneu encontrado</p>
                    </div>
                </td>
            </tr>
        ` : pageData.map(item => this.getTableRowHTML(item)).join('');
    }

    getTireCardHTML(item) {
        const sulcoStatus = this.getSulcoStatus(item.sulco_atual);
        
        return `
            <div class="tire-card">
                <div class="tire-card-header">
                    <div class="tire-number">
                        <span class="tire-number-label">Nº Fogo</span>
                        <span class="tire-number-value">${item.numero_fogo}</span>
                    </div>
                    <div class="tire-status">
                        <span class="status-badge status-${item.status}">
                            ${Utils.formatStatus(item.status)}
                        </span>
                    </div>
                </div>
                
                <div class="tire-card-body">
                    <div class="tire-brand">
                        <h3>${item.marca} ${item.modelo || ''}</h3>
                        <p class="tire-size">${item.medida}</p>
                    </div>
                    
                    <div class="tire-details">
                        <div class="detail-row">
                            <span class="detail-label">DOT:</span>
                            <span class="detail-value">${item.dot || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Sulco:</span>
                            <span class="detail-value sulco-${sulcoStatus}">
                                ${item.sulco_atual || 0}mm
                            </span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Posição:</span>
                            <span class="detail-value">${item.posicao_atual || 'Não instalado'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="tire-card-footer">
                    <div class="tire-actions">
                        <button class="btn-icon btn-icon-primary" onclick="tiresPage.viewDetails(${item.id})" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${auth.hasPermission('almoxarife') ? `
                            <button class="btn-icon btn-icon-secondary" onclick="tiresPage.editTire(${item.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${item.status === 'estoque' ? `
                                <button class="btn-icon btn-icon-success" onclick="tiresPage.installTire(${item.id})" title="Instalar">
                                    <i class="fas fa-cog"></i>
                                </button>
                            ` : ''}
                            ${item.status === 'em_uso' ? `
                                <button class="btn-icon btn-icon-warning" onclick="tiresPage.updateTread(${item.id})" title="Atualizar Sulco">
                                    <i class="fas fa-ruler"></i>
                                </button>
                            ` : ''}
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getTableRowHTML(item) {
        const sulcoStatus = this.getSulcoStatus(item.sulco_atual);
        
        return `
            <tr>
                <td>
                    <span class="font-mono font-semibold text-lg">${item.numero_fogo}</span>
                </td>
                <td>
                    <div class="tire-info">
                        <span class="font-medium">${item.marca}</span>
                        ${item.modelo ? `<small class="text-gray-500 block">${item.modelo}</small>` : ''}
                    </div>
                </td>
                <td>
                    <span class="badge badge-outline">${item.medida}</span>
                </td>
                <td>
                    <span class="font-mono text-sm">${item.dot || 'N/A'}</span>
                </td>
                <td>
                    <span class="status-badge status-${item.status}">
                        ${Utils.formatStatus(item.status)}
                    </span>
                </td>
                <td>
                    <span class="sulco-value sulco-${sulcoStatus}">
                        ${item.sulco_atual || 0}mm
                    </span>
                </td>
                <td>
                    ${item.posicao_atual ? `
                        <div class="position-info">
                            <i class="fas fa-map-marker-alt text-blue-500"></i>
                            <span>${item.posicao_atual}</span>
                        </div>
                    ` : '<span class="text-gray-400">Não instalado</span>'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-icon-primary" onclick="tiresPage.viewDetails(${item.id})" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${auth.hasPermission('almoxarife') ? `
                            <button class="btn-icon btn-icon-secondary" onclick="tiresPage.editTire(${item.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${item.status === 'estoque' ? `
                                <button class="btn-icon btn-icon-success" onclick="tiresPage.installTire(${item.id})" title="Instalar">
                                    <i class="fas fa-cog"></i>
                                </button>
                            ` : ''}
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    getSulcoStatus(sulco) {
        const sulcoValue = parseFloat(sulco) || 0;
        
        if (sulcoValue <= 1.6) return 'critico';
        if (sulcoValue <= 3.0) return 'baixo';
        if (sulcoValue <= 5.0) return 'medio';
        return 'bom';
    }

    updateContentInfo() {
        const contentInfo = document.querySelector('#content-info');
        if (contentInfo) {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
            const endIndex = Math.min(startIndex + this.itemsPerPage - 1, this.filteredData.length);
            
            contentInfo.textContent = this.filteredData.length === 0 
                ? 'Nenhum pneu encontrado'
                : `Mostrando ${startIndex} a ${endIndex} de ${this.filteredData.length} pneus`;
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
                    onclick="tiresPage.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Botões de página
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="tiresPage.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="tiresPage.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="tiresPage.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // Botão próximo
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="tiresPage.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    updateStats() {
        const stats = {
            emUso: this.data.filter(item => item.status === 'em_uso').length,
            estoque: this.data.filter(item => item.status === 'estoque').length,
            sulcoBaixo: this.data.filter(item => {
                const sulco = parseFloat(item.sulco_atual) || 0;
                return sulco <= 3.0 && item.status === 'em_uso';
            }).length,
            recapagem: this.data.filter(item => item.status === 'recapagem').length
        };

        document.querySelector('#stat-em-uso').textContent = stats.emUso;
        document.querySelector('#stat-estoque').textContent = stats.estoque;
        document.querySelector('#stat-sulco-baixo').textContent = stats.sulcoBaixo;
        document.querySelector('#stat-recapagem').textContent = stats.recapagem;
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
            await this.loadFilterOptions();
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

    async showPerformanceReport() {
        try {
            const response = await API.tires.getPerformanceReport();
            const report = response.relatorio || response;

            const stats = report.estatisticas_gerais || {};
            const marcas = report.performance_por_marca || {};
            const top = report.top_pneus_km || [];

            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            const modal = document.createElement('div');
            modal.className = 'custom-modal';

            const marcasRows = Object.keys(marcas).map(m => {
                const d = marcas[m];
                return `<tr><td>${m}</td><td>${d.total}</td><td>${Utils.formatNumber(d.km_medio || 0,2)}</td><td>${Utils.formatCurrency(d.valor_medio || 0)}</td><td>${Utils.formatNumber(d.taxa_descarte || 0,2)}%</td><td>${Utils.formatNumber(d.taxa_recapagem || 0,2)}%</td></tr>`;
            }).join('');

            const topRows = top.map(p => `<tr><td>${p.numero_serie}</td><td>${p.numero_fogo || ''}</td><td>${p.marca || ''}</td><td>${p.modelo || ''}</td><td>${Utils.formatNumber(p.km_rodados || 0,2)}</td><td>${p.equipamento || ''}</td></tr>`).join('');

            modal.innerHTML = `
                <h2>Relatório de Performance de Pneus</h2>
                <div class="report-section">
                    <h3>Estatísticas Gerais</h3>
                    <ul>
                        <li>Total de pneus: ${stats.total_pneus || 0}</li>
                        <li>Em uso: ${stats.pneus_em_uso || 0}</li>
                        <li>Estoque: ${stats.pneus_estoque || 0}</li>
                        <li>Descarte: ${stats.pneus_descarte || 0}</li>
                        <li>Recapagem: ${stats.pneus_recapagem || 0}</li>
                    </ul>
                </div>
                <div class="report-section">
                    <h3>Performance por Marca</h3>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead><tr><th>Marca</th><th>Total</th><th>KM Médio</th><th>Valor Médio</th><th>Descartes</th><th>Recapagens</th></tr></thead>
                            <tbody>${marcasRows || '<tr><td colspan="6" class="text-center">Sem dados</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>
                <div class="report-section">
                    <h3>Top 5 Pneus por KM</h3>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead><tr><th>Série</th><th>Fogo</th><th>Marca</th><th>Modelo</th><th>KM Rodados</th><th>Equipamento</th></tr></thead>
                            <tbody>${topRows || '<tr><td colspan="6" class="text-center">Sem dados</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>
                <div class="form-actions"><button id="closeReport" class="btn btn-secondary">Fechar</button></div>
            `;

            overlay.appendChild(modal);
            (document.getElementById('modals-container') || document.body).appendChild(overlay);

            modal.querySelector('#closeReport').addEventListener('click', () => overlay.remove());

            if (!document.getElementById('tires-report-style')) {
                const style = document.createElement('style');
                style.id = 'tires-report-style';
                style.textContent = `
                    .custom-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;justify-content:center;align-items:center;background:rgba(0,0,0,0.5);z-index:10000;}
                    .custom-modal{background:#fff;padding:20px;width:600px;max-height:80vh;overflow-y:auto;border-radius:4px;}
                    .report-section{margin-bottom:20px;}
                    .report-section h3{margin-bottom:10px;}
                `;
                document.head.appendChild(style);
            }
        } catch (error) {
            console.error('Erro ao gerar relatório de performance:', error);
            Toast.error('Erro ao gerar relatório');
        }
    }

    showCreateModal() {
    // Cria e exibe o modal para cadastrar um novo pneu
    const modalsContainer = document.getElementById('modals-container') || document.body;
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.innerHTML = `
        <h2>Cadastrar Pneu</h2>
        <form id="newTireForm">
            <label for="tire-numero_serie">Número de Série*</label>
            <input type="text" id="tire-numero_serie" name="numero_serie" required />

            <label for="tire-numero_fogo">Número de Fogo</label>
            <input type="text" id="tire-numero_fogo" name="numero_fogo" />

            <label for="tire-marca">Marca*</label>
            <input type="text" id="tire-marca" name="marca" required />

            <label for="tire-modelo">Modelo*</label>
            <input type="text" id="tire-modelo" name="modelo" required />

            <label for="tire-medida">Medida* (ex.: 385/65R22.5)</label>
            <input type="text" id="tire-medida" name="medida" required />

            <label for="tire-tipo">Tipo*</label>
            <select id="tire-tipo" name="tipo" required>
                <option value="novo">Novo</option>
                <option value="recapado">Recapado</option>
            </select>

            <label for="tire-data_compra">Data de Compra*</label>
            <input type="date" id="tire-data_compra" name="data_compra" required />

            <label for="tire-valor_compra">Valor de Compra</label>
            <input type="number" id="tire-valor_compra" name="valor_compra" step="0.01" />

            <label for="tire-pressao_recomendada">Pressão Recomendada (PSI)</label>
            <input type="number" id="tire-pressao_recomendada" name="pressao_recomendada" step="0.01" />

            <label for="tire-vida_util_estimada">Vida Útil Estimada (km)</label>
            <input type="number" id="tire-vida_util_estimada" name="vida_util_estimada" step="0.01" />

            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Salvar</button>
                <button type="button" id="cancelNewTire" class="btn btn-secondary">Cancelar</button>
            </div>
        </form>
    `;
    overlay.appendChild(modal);
    modalsContainer.appendChild(overlay);

    // Insere estilos para o modal uma única vez
    if (!document.getElementById('tires-modal-style')) {
        const style = document.createElement('style');
        style.id = 'tires-modal-style';
        style.textContent = `
            .custom-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10000;
            }
            .custom-modal {
                background: #fff;
                padding: 20px;
                max-height: 80vh;
                overflow-y: auto;
                border-radius: 4px;
                width: 400px;
            }
            .custom-modal h2 {
                margin-top: 0;
            }
            .custom-modal form {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .custom-modal button {
                padding: 6px 12px;
            }
        `;
        document.head.appendChild(style);
    }

    // Botão cancelar fecha o modal
    overlay.querySelector('#cancelNewTire').addEventListener('click', () => {
        overlay.remove();
    });

    // Submissão do formulário
    overlay.querySelector('#newTireForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const payload = {
            numero_serie: formData.get('numero_serie'),
            numero_fogo: formData.get('numero_fogo') || null,
            marca: formData.get('marca'),
            modelo: formData.get('modelo'),
            medida: formData.get('medida'),
            tipo: formData.get('tipo'),
            data_compra: formData.get('data_compra'),
            valor_compra: parseFloat(formData.get('valor_compra') || 0),
            pressao_recomendada: parseFloat(formData.get('pressao_recomendada') || 0),
            vida_util_estimada: parseFloat(formData.get('vida_util_estimada') || 0)
        };
        try {
            await API.tires.create(payload);
            Toast.success('Pneu cadastrado com sucesso!');
            overlay.remove();
            await this.refresh(); // Recarrega a listagem
        } catch (error) {
            Toast.error(error.message || 'Erro ao criar pneu.');
            console.error(error);
        }
    });
}

}

// Instância global para uso nos event handlers
const tiresPage = new TiresPage();

// Exportar para uso global
window.TiresPage = TiresPage;

