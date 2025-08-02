// Página de Estoque
class InventoryPage {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentFilters = {};
        this.currentSort = { field: 'nome', direction: 'asc' };
        this.currentPage = 1;
        this.itemsPerPage = 15;
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
            console.error('Erro ao carregar estoque:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.inventory.getAll();
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
                <p>Carregando estoque...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Erro ao carregar estoque</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="navigation.navigateTo('estoque')">
                    <i class="fas fa-refresh"></i>
                    Tentar novamente
                </button>
            </div>
        `;
    }

    getHTML() {
        return `
            <div class="inventory-page">
                <!-- Header -->
                <div class="page-header">
                    <div class="page-title">
                        <i class="fas fa-box"></i>
                        <div>
                            <h1>Estoque de Peças</h1>
                            <p>Gerencie o estoque de peças e materiais</p>
                        </div>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-outline" id="refresh-data">
                            <i class="fas fa-sync-alt"></i>
                            Atualizar
                        </button>
                        <button class="btn btn-outline" id="export-data" ${!auth.hasPermission('almoxarife') ? 'style="display: none;"' : ''}>
                            <i class="fas fa-download"></i>
                            Exportar
                        </button>
                        <button class="btn btn-primary" id="create-item" ${!auth.hasPermission('almoxarife') ? 'style="display: none;"' : ''}>
                            <i class="fas fa-plus"></i>
                            Nova Peça
                        </button>
                    </div>
                </div>

                <!-- Filtros -->
                <div class="filters-section">
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label class="filter-label">Grupo</label>
                            <select id="filter-grupo" class="filter-select">
                                <option value="">Todos os grupos</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Status</label>
                            <select id="filter-status" class="filter-select">
                                <option value="">Todos</option>
                                <option value="disponivel">Disponível</option>
                                <option value="baixo_estoque">Baixo Estoque</option>
                                <option value="sem_estoque">Sem Estoque</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Local</label>
                            <select id="filter-local" class="filter-select">
                                <option value="">Todos os locais</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Buscar</label>
                            <div class="search-input">
                                <i class="fas fa-search"></i>
                                <input type="text" id="search-input" placeholder="Código, nome, descrição...">
                            </div>
                        </div>
                        <div class="filter-actions">
                            <button class="btn btn-outline btn-sm" id="clear-filters">
                                <i class="fas fa-times"></i>
                                Limpar
                            </button>
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
                            <div class="stat-value" id="stat-disponiveis">0</div>
                            <div class="stat-label">Disponíveis</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-warning">
                        <div class="stat-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-baixo-estoque">0</div>
                            <div class="stat-label">Baixo Estoque</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-danger">
                        <div class="stat-icon">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-sem-estoque">0</div>
                            <div class="stat-label">Sem Estoque</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-info">
                        <div class="stat-icon">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-valor-total">R$ 0</div>
                            <div class="stat-label">Valor Total</div>
                        </div>
                    </div>
                </div>

                <!-- Tabela -->
                <div class="data-table-container">
                    <div class="data-table-header">
                        <div class="data-table-info">
                            <span id="table-info">Mostrando 0 de 0 itens</span>
                        </div>
                        <div class="data-table-controls">
                            <select id="items-per-page" class="form-select form-select-sm">
                                <option value="15">15 por página</option>
                                <option value="30">30 por página</option>
                                <option value="50">50 por página</option>
                                <option value="100">100 por página</option>
                            </select>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th data-sort="codigo">
                                        Código
                                        <i class="fas fa-sort"></i>
                                    </th>
                                    <th data-sort="nome">
                                        Nome/Descrição
                                        <i class="fas fa-sort"></i>
                                    </th>
                                    <th data-sort="grupo_nome">
                                        Grupo
                                        <i class="fas fa-sort"></i>
                                    </th>
                                    <th data-sort="quantidade_atual">
                                        Estoque
                                        <i class="fas fa-sort"></i>
                                    </th>
                                    <th data-sort="unidade_medida">
                                        Unidade
                                        <i class="fas fa-sort"></i>
                                    </th>
                                    <th data-sort="preco_unitario">
                                        Preço Unit.
                                        <i class="fas fa-sort"></i>
                                    </th>
                                    <th data-sort="valor_total">
                                        Valor Total
                                        <i class="fas fa-sort"></i>
                                    </th>
                                    <th data-sort="local_nome">
                                        Local
                                        <i class="fas fa-sort"></i>
                                    </th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="table-body">
                                <!-- Dados serão inseridos aqui -->
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

        // Botão de exportar
        const exportBtn = container.querySelector('#export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Botão de nova peça
        const createBtn = container.querySelector('#create-item');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Filtros
        const grupoFilter = container.querySelector('#filter-grupo');
        const statusFilter = container.querySelector('#filter-status');
        const localFilter = container.querySelector('#filter-local');
        const searchInput = container.querySelector('#search-input');
        const clearFiltersBtn = container.querySelector('#clear-filters');

        if (grupoFilter) {
            grupoFilter.addEventListener('change', () => this.applyFilters());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
        if (localFilter) {
            localFilter.addEventListener('change', () => this.applyFilters());
        }
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => this.applyFilters(), 300));
        }
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Ordenação
        const sortHeaders = container.querySelectorAll('th[data-sort]');
        sortHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.sort;
                this.toggleSort(field);
            });
        });

        // Items per page
        const itemsPerPageSelect = container.querySelector('#items-per-page');
        if (itemsPerPageSelect) {
            itemsPerPageSelect.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.updateTable();
            });
        }
    }

    async loadFiltersData() {
        try {
            // Carregar grupos de item
            const grupos = await API.itemGroups.getAll();
            const grupoFilter = document.querySelector('#filter-grupo');
            
            if (grupoFilter) {
                grupoFilter.innerHTML = '<option value="">Todos os grupos</option>';
                grupos.forEach(grupo => {
                    const option = document.createElement('option');
                    option.value = grupo.id;
                    option.textContent = grupo.nome;
                    grupoFilter.appendChild(option);
                });
            }

            // Carregar locais de estoque
            const locais = await API.stockLocations.getAll();
            const localFilter = document.querySelector('#filter-local');
            
            if (localFilter) {
                localFilter.innerHTML = '<option value="">Todos os locais</option>';
                locais.forEach(local => {
                    const option = document.createElement('option');
                    option.value = local.id;
                    option.textContent = local.nome;
                    localFilter.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Erro ao carregar dados dos filtros:', error);
        }
    }

    applyFilters() {
        const grupoFilter = document.querySelector('#filter-grupo')?.value || '';
        const statusFilter = document.querySelector('#filter-status')?.value || '';
        const localFilter = document.querySelector('#filter-local')?.value || '';
        const searchTerm = document.querySelector('#search-input')?.value.toLowerCase() || '';

        this.currentFilters = {
            grupo: grupoFilter,
            status: statusFilter,
            local: localFilter,
            search: searchTerm
        };

        this.filteredData = this.data.filter(item => {
            // Filtro de grupo
            if (grupoFilter && item.grupo_item_id != grupoFilter) {
                return false;
            }

            // Filtro de status
            if (statusFilter) {
                const itemStatus = this.getItemStatus(item);
                if (itemStatus !== statusFilter) {
                    return false;
                }
            }

            // Filtro de local
            if (localFilter && item.estoque_local_id != localFilter) {
                return false;
            }

            // Filtro de busca
            if (searchTerm) {
                const searchFields = [
                    item.codigo,
                    item.nome,
                    item.descricao,
                    item.grupo_nome
                ].filter(field => field).join(' ').toLowerCase();

                if (!searchFields.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        this.currentPage = 1;
        this.sortData();
        this.updateTable();
        this.updateStats();
    }

    clearFilters() {
        document.querySelector('#filter-grupo').value = '';
        document.querySelector('#filter-status').value = '';
        document.querySelector('#filter-local').value = '';
        document.querySelector('#search-input').value = '';
        
        this.currentFilters = {};
        this.filteredData = [...this.data];
        this.currentPage = 1;
        this.updateTable();
        this.updateStats();
    }

    toggleSort(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }

        this.sortData();
        this.updateTable();
        this.updateSortIcons();
    }

    sortData() {
        this.filteredData.sort((a, b) => {
            const field = this.currentSort.field;
            const direction = this.currentSort.direction;
            
            let aValue = a[field];
            let bValue = b[field];

            // Tratamento especial para números
            if (field === 'quantidade_atual' || field === 'preco_unitario' || field === 'valor_total') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
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

    updateSortIcons() {
        // Remover todas as classes de ordenação
        document.querySelectorAll('th[data-sort] i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });

        // Adicionar classe para o campo atual
        const currentHeader = document.querySelector(`th[data-sort="${this.currentSort.field}"] i`);
        if (currentHeader) {
            currentHeader.className = `fas fa-sort-${this.currentSort.direction === 'asc' ? 'up' : 'down'}`;
        }
    }

    updateTable() {
        const tbody = document.querySelector('#table-body');
        if (!tbody) return;

        // Calcular paginação
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        // Renderizar linhas
        tbody.innerHTML = pageData.length === 0 ? `
            <tr>
                <td colspan="10" class="text-center py-8">
                    <div class="empty-state">
                        <i class="fas fa-box text-gray-400 text-4xl mb-4"></i>
                        <p class="text-gray-600">Nenhum item encontrado no estoque</p>
                    </div>
                </td>
            </tr>
        ` : pageData.map(item => this.getTableRowHTML(item)).join('');

        // Atualizar informações da tabela
        this.updateTableInfo();
        this.updatePagination();
    }

    getTableRowHTML(item) {
        const status = this.getItemStatus(item);
        const valorTotal = (item.quantidade_atual || 0) * (item.preco_unitario || 0);
        
        return `
            <tr>
                <td>
                    <span class="font-mono font-semibold">${item.codigo}</span>
                </td>
                <td>
                    <div class="item-info">
                        <span class="font-medium">${item.nome}</span>
                        ${item.descricao ? `<small class="text-gray-500 block">${item.descricao}</small>` : ''}
                    </div>
                </td>
                <td>
                    <span class="badge badge-outline">${item.grupo_nome || 'Sem grupo'}</span>
                </td>
                <td>
                    <div class="stock-info">
                        <span class="stock-quantity ${status === 'sem_estoque' ? 'text-red-600' : status === 'baixo_estoque' ? 'text-yellow-600' : 'text-green-600'}">
                            ${Utils.formatNumber(item.quantidade_atual || 0)}
                        </span>
                        ${item.estoque_minimo ? `
                            <small class="text-gray-500 block">Mín: ${Utils.formatNumber(item.estoque_minimo)}</small>
                        ` : ''}
                    </div>
                </td>
                <td>
                    <span class="badge badge-light">${item.unidade_medida || 'UN'}</span>
                </td>
                <td>
                    <span class="font-mono">R$ ${Utils.formatCurrency(item.preco_unitario || 0)}</span>
                </td>
                <td>
                    <span class="font-mono font-semibold">R$ ${Utils.formatCurrency(valorTotal)}</span>
                </td>
                <td>
                    <div class="location-info">
                        <i class="fas fa-map-marker-alt text-blue-500"></i>
                        <span>${item.local_nome || 'Não definido'}</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${status}">
                        ${this.formatItemStatus(status)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-icon-primary" onclick="inventoryPage.viewDetails(${item.id})" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${auth.hasPermission('almoxarife') ? `
                            <button class="btn-icon btn-icon-secondary" onclick="inventoryPage.editItem(${item.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-icon-warning" onclick="inventoryPage.showMovementModal(${item.id})" title="Movimentar">
                                <i class="fas fa-exchange-alt"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    getItemStatus(item) {
        const quantidade = item.quantidade_atual || 0;
        const minimo = item.estoque_minimo || 0;

        if (quantidade === 0) {
            return 'sem_estoque';
        } else if (minimo > 0 && quantidade <= minimo) {
            return 'baixo_estoque';
        } else {
            return 'disponivel';
        }
    }

    formatItemStatus(status) {
        const statusMap = {
            'disponivel': 'Disponível',
            'baixo_estoque': 'Baixo Estoque',
            'sem_estoque': 'Sem Estoque'
        };
        
        return statusMap[status] || status;
    }

    updateTableInfo() {
        const tableInfo = document.querySelector('#table-info');
        if (tableInfo) {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
            const endIndex = Math.min(startIndex + this.itemsPerPage - 1, this.filteredData.length);
            
            tableInfo.textContent = this.filteredData.length === 0 
                ? 'Nenhum item encontrado'
                : `Mostrando ${startIndex} a ${endIndex} de ${this.filteredData.length} itens`;
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
                    onclick="inventoryPage.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Botões de página
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="inventoryPage.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="inventoryPage.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="inventoryPage.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // Botão próximo
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="inventoryPage.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    updateStats() {
        const stats = {
            disponiveis: this.data.filter(item => this.getItemStatus(item) === 'disponivel').length,
            baixoEstoque: this.data.filter(item => this.getItemStatus(item) === 'baixo_estoque').length,
            semEstoque: this.data.filter(item => this.getItemStatus(item) === 'sem_estoque').length,
            valorTotal: this.data.reduce((total, item) => {
                return total + ((item.quantidade_atual || 0) * (item.preco_unitario || 0));
            }, 0)
        };

        document.querySelector('#stat-disponiveis').textContent = stats.disponiveis;
        document.querySelector('#stat-baixo-estoque').textContent = stats.baixoEstoque;
        document.querySelector('#stat-sem-estoque').textContent = stats.semEstoque;
        document.querySelector('#stat-valor-total').textContent = `R$ ${Utils.formatCurrency(stats.valorTotal)}`;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateTable();
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
            await this.loadFiltersData();
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

    exportData() {
        // TODO: Implementar exportação de dados
        Toast.info('Exportação em desenvolvimento');
    }

    showCreateModal() {
        // TODO: Implementar modal de criação de item
        Toast.info('Modal de criação em desenvolvimento');
    }

    viewDetails(id) {
        // TODO: Implementar visualização de detalhes
        Toast.info('Visualização de detalhes em desenvolvimento');
    }

    editItem(id) {
        // TODO: Implementar edição de item
        Toast.info('Edição de item em desenvolvimento');
    }

    showMovementModal(id) {
        // TODO: Implementar modal de movimentação
        Toast.info('Modal de movimentação em desenvolvimento');
    }
}

// Instância global para uso nos event handlers
const inventoryPage = new InventoryPage();

// Exportar para uso global
window.InventoryPage = InventoryPage;

