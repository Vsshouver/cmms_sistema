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
        if (!this.filteredData.length) {
            Toast.info('Nenhum dado para exportar');
            return;
        }
        const headers = ['Código', 'Nome', 'Grupo', 'Quantidade', 'Unidade', 'Preço Unitário', 'Valor Total', 'Local', 'Status'];
        const rows = this.filteredData.map(item => {
            const valorTotal = (item.quantidade_atual || 0) * (item.preco_unitario || 0);
            return [
                item.codigo,
                item.nome,
                item.grupo_nome || '',
                Utils.formatNumber(item.quantidade_atual || 0),
                item.unidade_medida || item.unidade || '',
                Utils.formatNumber(item.preco_unitario || 0, 2),
                Utils.formatNumber(valorTotal, 2),
                item.local_nome || '',
                this.formatItemStatus(this.getItemStatus(item))
            ];
        });
        const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        Utils.downloadFile(csv, `estoque_${Date.now()}.csv`, 'text/csv');
        Toast.success('Exportação concluída');
    }

    async showCreateModal() {
        try {
            const [groupsResp, locationsResp] = await Promise.all([
                API.itemGroups.getAll(),
                API.stockLocations.getAll()
            ]);
            const grupos = groupsResp.data || groupsResp || [];
            const locais = locationsResp.data || locationsResp || [];

            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            modal.innerHTML = `
                <h2>Nova Peça</h2>
                <form id="newItemForm">
                    <label>Código*</label>
                    <input type="text" name="codigo" required />

                    <label>Nome*</label>
                    <input type="text" name="nome" required />

                    <label>Grupo*</label>
                    <select name="grupo_item_id" required>
                        <option value="">Selecione...</option>
                        ${grupos.map(g => `<option value="${g.id}">${g.nome}</option>`).join('')}
                    </select>

                    <label>Descrição</label>
                    <input type="text" name="descricao" />

                    <label>Unidade*</label>
                    <input type="text" name="unidade" required />

                    <label>Quantidade Inicial</label>
                    <input type="number" name="quantidade" step="0.01" />

                    <label>Estoque Mínimo</label>
                    <input type="number" name="min_estoque" />

                    <label>Preço Unitário</label>
                    <input type="number" name="preco_unitario" step="0.01" />

                    <label>Local</label>
                    <select name="estoque_local_id">
                        <option value="">Selecione...</option>
                        ${locais.map(l => `<option value="${l.id}">${l.nome}</option>`).join('')}
                    </select>

                    <label>Fornecedor</label>
                    <input type="text" name="fornecedor" />

                    <label>Observações</label>
                    <textarea name="observacoes" rows="2"></textarea>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Salvar</button>
                        <button type="button" id="cancelNewItem" class="btn btn-secondary">Cancelar</button>
                    </div>
                </form>
            `;

            overlay.appendChild(modal);
            (document.getElementById('modals-container') || document.body).appendChild(overlay);

            if (!document.getElementById('inventory-modal-style')) {
                const style = document.createElement('style');
                style.id = 'inventory-modal-style';
                style.textContent = `
                    .custom-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;justify-content:center;align-items:center;background:rgba(0,0,0,0.5);z-index:10000;}
                    .custom-modal{background:#fff;padding:20px;width:450px;max-height:80vh;overflow-y:auto;border-radius:4px;}
                    .custom-modal form{display:flex;flex-direction:column;gap:10px;}
                `;
                document.head.appendChild(style);
            }

            modal.querySelector('#cancelNewItem').addEventListener('click', () => overlay.remove());

            modal.querySelector('#newItemForm').addEventListener('submit', async e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const payload = {
                    codigo: formData.get('codigo'),
                    nome: formData.get('nome'),
                    grupo_item_id: parseInt(formData.get('grupo_item_id')),
                    descricao: formData.get('descricao') || null,
                    unidade: formData.get('unidade'),
                    quantidade: parseFloat(formData.get('quantidade') || 0),
                    min_estoque: parseInt(formData.get('min_estoque') || 0),
                    preco_unitario: parseFloat(formData.get('preco_unitario') || 0),
                    estoque_local_id: formData.get('estoque_local_id') ? parseInt(formData.get('estoque_local_id')) : null,
                    fornecedor: formData.get('fornecedor') || null,
                    observacoes: formData.get('observacoes') || null
                };
                try {
                    await API.inventory.create(payload);
                    Toast.success('Item criado com sucesso');
                    overlay.remove();
                    await this.refresh();
                } catch (err) {
                    Toast.error(err.message || 'Erro ao criar item');
                }
            });
        } catch (error) {
            console.error('Erro ao exibir modal de criação:', error);
            Toast.error('Erro ao preparar modal');
        }
    }

    async viewDetails(id) {
        try {
            const data = await API.inventory.get(id);
            const item = data.peca || data;

            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            modal.innerHTML = `
                <h2>Detalhes da Peça</h2>
                <div class="item-details-modal">
                    <p><strong>Código:</strong> ${item.codigo}</p>
                    <p><strong>Nome:</strong> ${item.nome}</p>
                    <p><strong>Grupo:</strong> ${item.grupo_nome || item.grupo_item}</p>
                    <p><strong>Unidade:</strong> ${item.unidade}</p>
                    <p><strong>Quantidade:</strong> ${Utils.formatNumber(item.quantidade_atual || item.quantidade || 0)}</p>
                    <p><strong>Estoque Mínimo:</strong> ${Utils.formatNumber(item.estoque_minimo || item.min_estoque || 0)}</p>
                    <p><strong>Preço Unitário:</strong> R$ ${Utils.formatCurrency(item.preco_unitario || 0)}</p>
                    <p><strong>Local:</strong> ${item.local_nome || item.estoque_local}</p>
                    ${item.fornecedor ? `<p><strong>Fornecedor:</strong> ${item.fornecedor}</p>` : ''}
                    ${item.observacoes ? `<p><strong>Observações:</strong> ${item.observacoes}</p>` : ''}
                </div>
                <div class="form-actions"><button id="closeItemDetails" class="btn btn-secondary">Fechar</button></div>
            `;
            overlay.appendChild(modal);
            (document.getElementById('modals-container') || document.body).appendChild(overlay);
            modal.querySelector('#closeItemDetails').addEventListener('click', () => overlay.remove());

            if (!document.getElementById('inventory-modal-style')) {
                const style = document.createElement('style');
                style.id = 'inventory-modal-style';
                style.textContent = `
                    .custom-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;justify-content:center;align-items:center;background:rgba(0,0,0,0.5);z-index:10000;}
                    .custom-modal{background:#fff;padding:20px;width:450px;max-height:80vh;overflow-y:auto;border-radius:4px;}
                `;
                document.head.appendChild(style);
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes do item:', error);
            Toast.error('Erro ao carregar detalhes');
        }
    }

    async editItem(id) {
        try {
            const [itemResp, groupsResp, locationsResp] = await Promise.all([
                API.inventory.get(id),
                API.itemGroups.getAll(),
                API.stockLocations.getAll()
            ]);

            const item = itemResp.peca || itemResp;
            const grupos = groupsResp.data || groupsResp || [];
            const locais = locationsResp.data || locationsResp || [];

            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            modal.innerHTML = `
                <h2>Editar Item</h2>
                <form id="editItemForm">
                    <label>Código</label>
                    <input type="text" value="${item.codigo}" disabled />

                    <label>Nome*</label>
                    <input type="text" name="nome" value="${item.nome}" required />

                    <label>Grupo*</label>
                    <select name="grupo_item_id" required>
                        ${grupos.map(g => `<option value="${g.id}" ${g.id === item.grupo_item_id ? 'selected' : ''}>${g.nome}</option>`).join('')}
                    </select>

                    <label>Descrição</label>
                    <input type="text" name="descricao" value="${item.descricao || ''}" />

                    <label>Unidade*</label>
                    <input type="text" name="unidade" value="${item.unidade}" required />

                    <label>Quantidade</label>
                    <input type="number" name="quantidade" step="0.01" value="${item.quantidade_atual || item.quantidade || 0}" />

                    <label>Estoque Mínimo</label>
                    <input type="number" name="min_estoque" value="${item.estoque_minimo || item.min_estoque || 0}" />

                    <label>Preço Unitário</label>
                    <input type="number" name="preco_unitario" step="0.01" value="${item.preco_unitario || 0}" />

                    <label>Local</label>
                    <select name="estoque_local_id">
                        <option value="">Selecione...</option>
                        ${locais.map(l => `<option value="${l.id}" ${l.id === item.estoque_local_id ? 'selected' : ''}>${l.nome}</option>`).join('')}
                    </select>

                    <label>Fornecedor</label>
                    <input type="text" name="fornecedor" value="${item.fornecedor || ''}" />

                    <label>Observações</label>
                    <textarea name="observacoes" rows="2">${item.observacoes || ''}</textarea>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Salvar</button>
                        <button type="button" id="cancelEditItem" class="btn btn-secondary">Cancelar</button>
                    </div>
                </form>
            `;

            overlay.appendChild(modal);
            (document.getElementById('modals-container') || document.body).appendChild(overlay);

            if (!document.getElementById('inventory-modal-style')) {
                const style = document.createElement('style');
                style.id = 'inventory-modal-style';
                style.textContent = `
                    .custom-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;justify-content:center;align-items:center;background:rgba(0,0,0,0.5);z-index:10000;}
                    .custom-modal{background:#fff;padding:20px;width:450px;max-height:80vh;overflow-y:auto;border-radius:4px;}
                    .custom-modal form{display:flex;flex-direction:column;gap:10px;}
                `;
                document.head.appendChild(style);
            }

            modal.querySelector('#cancelEditItem').addEventListener('click', () => overlay.remove());

            modal.querySelector('#editItemForm').addEventListener('submit', async e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const payload = {
                    nome: formData.get('nome'),
                    grupo_item_id: parseInt(formData.get('grupo_item_id')),
                    descricao: formData.get('descricao') || null,
                    unidade: formData.get('unidade'),
                    quantidade: parseFloat(formData.get('quantidade') || 0),
                    min_estoque: parseInt(formData.get('min_estoque') || 0),
                    preco_unitario: parseFloat(formData.get('preco_unitario') || 0),
                    estoque_local_id: formData.get('estoque_local_id') ? parseInt(formData.get('estoque_local_id')) : null,
                    fornecedor: formData.get('fornecedor') || null,
                    observacoes: formData.get('observacoes') || null
                };
                try {
                    await API.inventory.update(id, payload);
                    Toast.success('Item atualizado com sucesso');
                    overlay.remove();
                    await this.refresh();
                } catch (err) {
                    Toast.error(err.message || 'Erro ao atualizar item');
                }
            });
        } catch (error) {
            console.error('Erro ao editar item:', error);
            Toast.error('Erro ao preparar edição');
        }
    }

    async showMovementModal(id) {
        try {
            const itemResp = await API.inventory.get(id);
            const item = itemResp.peca || itemResp;

            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            modal.innerHTML = `
                <h2>Movimentar Estoque</h2>
                <form id="movementForm">
                    <p><strong>${item.nome}</strong> (${item.codigo})</p>
                    <label>Tipo*</label>
                    <select name="tipo" required>
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                    </select>

                    <label>Quantidade*</label>
                    <input type="number" name="quantidade" step="0.01" required />

                    <label>Motivo</label>
                    <input type="text" name="motivo" />

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Salvar</button>
                        <button type="button" id="cancelMovement" class="btn btn-secondary">Cancelar</button>
                    </div>
                </form>
            `;

            overlay.appendChild(modal);
            (document.getElementById('modals-container') || document.body).appendChild(overlay);

            if (!document.getElementById('inventory-modal-style')) {
                const style = document.createElement('style');
                style.id = 'inventory-modal-style';
                style.textContent = `
                    .custom-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;justify-content:center;align-items:center;background:rgba(0,0,0,0.5);z-index:10000;}
                    .custom-modal{background:#fff;padding:20px;width:400px;max-height:80vh;overflow-y:auto;border-radius:4px;}
                    .custom-modal form{display:flex;flex-direction:column;gap:10px;}
                `;
                document.head.appendChild(style);
            }

            modal.querySelector('#cancelMovement').addEventListener('click', () => overlay.remove());

            modal.querySelector('#movementForm').addEventListener('submit', async e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const payload = {
                    tipo: formData.get('tipo'),
                    quantidade: parseFloat(formData.get('quantidade') || 0),
                    motivo: formData.get('motivo') || null
                };
                try {
                    await API.inventory.createMovement(id, payload);
                    Toast.success('Movimentação registrada');
                    overlay.remove();
                    await this.refresh();
                } catch (err) {
                    Toast.error(err.message || 'Erro na movimentação');
                }
            });
        } catch (error) {
            console.error('Erro ao movimentar item:', error);
            Toast.error('Erro ao preparar movimentação');
        }
    }
}

// Instância global para uso nos event handlers
const inventoryPage = new InventoryPage();

// Exportar para uso global
window.InventoryPage = InventoryPage;

