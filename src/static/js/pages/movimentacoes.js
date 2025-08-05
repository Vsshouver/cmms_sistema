class MovementsPage {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 15;
        this.searchTerm = '';
        this.typeFilter = '';
        this.dateFilter = '';
    }

    async render(container) {
        try {
            container.innerHTML = this.getLoadingHTML();
            await this.loadData();
            container.innerHTML = this.getMainHTML();
            this.bindEvents();
        } catch (error) {
            console.error('Erro ao carregar movimentações:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.movements.getAll();
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
                <p>Carregando movimentações...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao carregar movimentações</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Tentar novamente</button>
            </div>
        `;
    }

    getMainHTML() {
        return `
            <div class="page-header">
                <div class="page-title">
                    <h1><i class="icon-arrow-right-left"></i> Movimentações de Estoque</h1>
                    <p>Acompanhe todas as movimentações de entrada e saída</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-secondary" id="refresh-data">
                        <i class="icon-refresh"></i> Atualizar
                    </button>
                    <button class="btn btn-primary" id="create-movement">
                        <i class="icon-plus"></i> Nova Movimentação
                    </button>
                </div>
            </div>

            <div class="page-filters">
                <div class="filter-group">
                    <label>Tipo</label>
                    <select onchange="this.handleTypeFilter(event)">
                        <option value="">Todos</option>
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                        <option value="transferencia">Transferência</option>
                        <option value="ajuste">Ajuste</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Período</label>
                    <select onchange="this.handleDateFilter(event)">
                        <option value="">Todos</option>
                        <option value="hoje">Hoje</option>
                        <option value="semana">Esta semana</option>
                        <option value="mes">Este mês</option>
                        <option value="trimestre">Este trimestre</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Buscar</label>
                    <div class="search-input">
                        <input type="text" 
                               placeholder="Item, documento, responsável..." 
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
        const entradas = this.data.filter(item => item.tipo === 'entrada').length;
        const saidas = this.data.filter(item => item.tipo === 'saida').length;
        const transferencias = this.data.filter(item => item.tipo === 'transferencia').length;
        
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--success-light);">
                        <i class="icon-arrow-down" style="color: var(--success);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${entradas}</div>
                        <div class="stat-label">Entradas</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--danger-light);">
                        <i class="icon-arrow-up" style="color: var(--danger);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${saidas}</div>
                        <div class="stat-label">Saídas</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--warning-light);">
                        <i class="icon-arrow-right-left" style="color: var(--warning);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${transferencias}</div>
                        <div class="stat-label">Transferências</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--primary-light);">
                        <i class="icon-list" style="color: var(--primary);"></i>
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
                    <div class="empty-icon">📦</div>
                    <h3>Nenhuma movimentação encontrada</h3>
                    <p>Tente ajustar os filtros ou registrar novas movimentações</p>
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
                            <th>Data/Hora</th>
                            <th>Tipo</th>
                            <th>Item</th>
                            <th>Quantidade</th>
                            <th>Documento</th>
                            <th>Responsável</th>
                            <th>Observações</th>
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
        const typeBadges = {
            'entrada': '<span class="badge badge-success"><i class="icon-arrow-down"></i> Entrada</span>',
            'saida': '<span class="badge badge-danger"><i class="icon-arrow-up"></i> Saída</span>',
            'transferencia': '<span class="badge badge-warning"><i class="icon-arrow-right-left"></i> Transferência</span>',
            'ajuste': '<span class="badge badge-info"><i class="icon-edit"></i> Ajuste</span>'
        };

        const quantityClass = item.tipo === 'entrada' ? 'text-success' : 'text-danger';
        const quantitySign = item.tipo === 'entrada' ? '+' : '-';

        return `
            <tr>
                <td>
                    <div class="datetime-info">
                        <div class="date">${Utils.formatDate(item.data_movimentacao) || '-'}</div>
                        <div class="time">${Utils.formatTime(item.data_movimentacao) || '-'}</div>
                    </div>
                </td>
                <td>${typeBadges[item.tipo] || typeBadges['entrada']}</td>
                <td>
                    <div class="item-info">
                        <strong>${item.item_nome || item.peca_nome || '-'}</strong>
                        <small>${item.item_codigo || item.peca_codigo || '-'}</small>
                    </div>
                </td>
                <td>
                    <span class="${quantityClass}">
                        <strong>${quantitySign}${Utils.formatNumber(item.quantidade) || 0}</strong>
                        <small>${item.unidade || 'un'}</small>
                    </span>
                </td>
                <td>${item.numero_documento || '-'}</td>
                <td>${item.responsavel || '-'}</td>
                <td class="text-truncate" title="${item.observacoes || ''}">${item.observacoes || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="this.viewItem(${item.id})" title="Visualizar">
                            <i class="icon-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="this.printDocument(${item.id})" title="Imprimir">
                            <i class="icon-printer"></i>
                        </button>
                        ${item.tipo !== 'ajuste' ? `
                            <button class="btn btn-sm btn-outline btn-danger" onclick="this.reverseMovement(${item.id})" title="Estornar">
                                <i class="icon-undo"></i>
                            </button>
                        ` : ''}
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
                    <option value="15" ${this.itemsPerPage === 15 ? 'selected' : ''}>15 por página</option>
                    <option value="30" ${this.itemsPerPage === 30 ? 'selected' : ''}>30 por página</option>
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

    handleTypeFilter(event) {
        this.typeFilter = event.target.value;
        this.applyFilters();
    }

    handleDateFilter(event) {
        this.dateFilter = event.target.value;
        this.applyFilters();
    }

    applyFilters() {
        this.filteredData = this.data.filter(item => {
            const searchMatch = !this.searchTerm || 
                (item.item_nome && item.item_nome.toLowerCase().includes(this.searchTerm)) ||
                (item.peca_nome && item.peca_nome.toLowerCase().includes(this.searchTerm)) ||
                (item.numero_documento && item.numero_documento.toLowerCase().includes(this.searchTerm)) ||
                (item.responsavel && item.responsavel.toLowerCase().includes(this.searchTerm));

            const typeMatch = !this.typeFilter || item.tipo === this.typeFilter;

            // Filtro de data (implementação simplificada)
            let dateMatch = true;
            if (this.dateFilter && item.data_movimentacao) {
                const itemDate = new Date(item.data_movimentacao);
                const now = new Date();
                
                switch (this.dateFilter) {
                    case 'hoje':
                        dateMatch = itemDate.toDateString() === now.toDateString();
                        break;
                    case 'semana':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        dateMatch = itemDate >= weekAgo;
                        break;
                    case 'mes':
                        dateMatch = itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                        break;
                    case 'trimestre':
                        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                        dateMatch = itemDate >= quarterStart;
                        break;
                }
            }

            return searchMatch && typeMatch && dateMatch;
        });

        this.currentPage = 1;
        this.updateContent();
    }

    clearFilters() {
        this.searchTerm = '';
        this.typeFilter = '';
        this.dateFilter = '';
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

    openEntryModal() {
        Utils.showNotification('Modal de entrada em desenvolvimento', 'info');
    }

    openExitModal() {
        Utils.showNotification('Modal de saída em desenvolvimento', 'info');
    }

    viewItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            Utils.showNotification(`Visualizando movimentação: ${item.numero_documento || id}`, 'info');
        }
    }

    printDocument(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            Utils.showNotification(`Imprimindo documento: ${item.numero_documento || id}`, 'info');
        }
    }

    reverseMovement(id) {
        const item = this.data.find(item => item.id === id);
        if (item && confirm(`Deseja estornar a movimentação "${item.numero_documento || id}"?`)) {
            Utils.showNotification(`Estornando movimentação: ${item.numero_documento || id}`, 'warning');
        }
    }
}

window.MovementsPage = MovementsPage;

