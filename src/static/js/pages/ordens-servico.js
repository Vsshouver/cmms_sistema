// Página de Ordens de Serviço
class WorkOrdersPage {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentFilters = {};
        this.currentSort = { field: 'data_abertura', direction: 'desc' };
        this.currentPage = 1;
        this.itemsPerPage = 10;
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

            // Disponibilizar instância global para handlers inline
            window.workOrdersPage = this;

            // Aplicar filtros iniciais
            this.applyFilters();

        } catch (error) {
            console.error('Erro ao carregar ordens de serviço:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.workOrders.getAll();
            this.data = Array.isArray(response)
                ? response
                : (response.ordens_servico || response.data || []);
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
                <p>Carregando ordens de serviço...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Erro ao carregar ordens de serviço</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="navigation.navigateTo('ordens-servico')">
                    <i class="fas fa-refresh"></i>
                    Tentar novamente
                </button>
            </div>
        `;
    }

    getHTML() {
        return `
            <div class="work-orders-page">
                <!-- Header -->
                <div class="page-header">
                    <div class="page-title">
                        <i class="fas fa-clipboard-list"></i>
                        <div>
                            <h1>Ordens de Serviço</h1>
                            <p>Gerencie as ordens de serviço de manutenção</p>
                        </div>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-outline" id="refresh-data">
                            <i class="fas fa-sync-alt"></i>
                            Atualizar
                        </button>
                        <button class="btn btn-primary" id="create-work-order" ${!auth.hasPermission('pcm') ? 'style="display: none;"' : ''}>
                            <i class="fas fa-plus"></i>
                            Nova OS
                        </button>
                    </div>
                </div>

                <!-- Filtros -->
                <div class="filters-section">
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label class="filter-label">Status</label>
                            <select id="filter-status" class="filter-select">
                                <option value="">Todos</option>
                                <option value="aberta">Aberta</option>
                                <option value="em_execucao">Em Execução</option>
                                <option value="aguardando_pecas">Aguardando Peças</option>
                                <option value="concluida">Concluída</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Prioridade</label>
                            <select id="filter-prioridade" class="filter-select">
                                <option value="">Todas</option>
                                <option value="baixa">Baixa</option>
                                <option value="media">Média</option>
                                <option value="alta">Alta</option>
                                <option value="critica">Crítica</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Buscar</label>
                            <div class="search-input">
                                <i class="fas fa-search"></i>
                                <input type="text" id="search-input" placeholder="Número OS, equipamento, descrição...">
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
                    <div class="stat-card stat-card-warning">
                        <div class="stat-icon">
                            <i class="fas fa-folder-open"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-abertas">0</div>
                            <div class="stat-label">Abertas</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-info">
                        <div class="stat-icon">
                            <i class="fas fa-cog"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-execucao">0</div>
                            <div class="stat-label">Em Execução</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-danger">
                        <div class="stat-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-criticas">0</div>
                            <div class="stat-label">Críticas</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-success">
                        <div class="stat-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-concluidas">0</div>
                            <div class="stat-label">Concluídas (Mês)</div>
                        </div>
                    </div>
                </div>

                <!-- Tabela -->
                <div class="data-table-container">
                    <div class="data-table-header">
                        <div class="data-table-info">
                            <span id="table-info">Mostrando 0 de 0 registros</span>
                        </div>
                        <div class="data-table-controls">
                            <select id="items-per-page" class="form-select form-select-sm">
                                <option value="10">10 por página</option>
                                <option value="25">25 por página</option>
                                <option value="50">50 por página</option>
                                <option value="100">100 por página</option>
                            </select>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th data-sort="numero_os">
                                        Número OS
                                        <i class="fas fa-sort"></i>
                                    </th>
                                    <th data-sort="equipamento_nome">
                                        Equipamento
                                        <i class="fas fa-sort"></i>
                                    </th>
                                    <th data-sort="tipo_manutencao">
                                        Tipo
                                        <i class="fas fa-sort"></i>
                                    </th>
                                    <th data-sort="prioridade">
                                        Prioridade
                                        <i class="fas fa-sort"></i>
                                    </th>
                                    <th data-sort="status">
                                        Status
                                        <i class="fas fa-sort"></i>
                                    </th>
                                    <th data-sort="data_abertura">
                                        Data Abertura
                                        <i class="fas fa-sort"></i>
                                    </th>
                                    <th data-sort="mecanico_nome">
                                        Mecânico
                                        <i class="fas fa-sort"></i>
                                    </th>
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

        // Botão de nova OS
        const createBtn = container.querySelector('#create-work-order');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Filtros
        const statusFilter = container.querySelector('#filter-status');
        const prioridadeFilter = container.querySelector('#filter-prioridade');
        const searchInput = container.querySelector('#search-input');
        const clearFiltersBtn = container.querySelector('#clear-filters');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
        if (prioridadeFilter) {
            prioridadeFilter.addEventListener('change', () => this.applyFilters());
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

    applyFilters() {
        const statusFilter = document.querySelector('#filter-status')?.value || '';
        const prioridadeFilter = document.querySelector('#filter-prioridade')?.value || '';
        const searchTerm = document.querySelector('#search-input')?.value.toLowerCase() || '';

        this.currentFilters = {
            status: statusFilter,
            prioridade: prioridadeFilter,
            search: searchTerm
        };

        this.filteredData = this.data.filter(item => {
            // Filtro de status
            if (statusFilter && item.status !== statusFilter) {
                return false;
            }

            // Filtro de prioridade
            if (prioridadeFilter && item.prioridade !== prioridadeFilter) {
                return false;
            }

            // Filtro de busca
            if (searchTerm) {
                const searchFields = [
                    item.numero_os,
                    item.equipamento_nome,
                    item.descricao_problema,
                    item.mecanico_nome
                ].filter(field => field).join(' ').toLowerCase();

                if (!searchFields.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        this.currentPage = 1;
        this.updateTable();
        this.updateStats();
    }

    clearFilters() {
        document.querySelector('#filter-status').value = '';
        document.querySelector('#filter-prioridade').value = '';
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

            // Tratamento especial para datas
            if (field.includes('data_')) {
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
                <td colspan="8" class="text-center py-8">
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list text-gray-400 text-4xl mb-4"></i>
                        <p class="text-gray-600">Nenhuma ordem de serviço encontrada</p>
                    </div>
                </td>
            </tr>
        ` : pageData.map(item => this.getTableRowHTML(item)).join('');

        // Atualizar informações da tabela
        this.updateTableInfo();
        this.updatePagination();
    }

    getTableRowHTML(item) {
        return `
            <tr>
                <td>
                    <span class="font-mono font-semibold">${item.numero_os}</span>
                </td>
                <td>
                    <div class="equipment-info">
                        <span class="font-medium">${item.equipamento_nome || 'N/A'}</span>
                        <small class="text-gray-500 block">${item.equipamento_modelo || ''}</small>
                    </div>
                </td>
                <td>
                    <span class="badge badge-outline">${item.tipo_manutencao || item.tipo || 'N/A'}</span>
                </td>
                <td>
                    <span class="priority-badge priority-${item.prioridade}">
                        ${Utils.formatPriority(item.prioridade)}
                    </span>
                </td>
                <td>
                    ${auth.hasPermission('pcm') ? `
                        <select class="form-select form-select-sm" onchange="workOrdersPage.updateStatus(${item.id}, this.value)">
                            ${['aberta','em_execucao','aguardando_pecas','concluida','cancelada'].map(st => `
                                <option value="${st}" ${item.status === st ? 'selected' : ''}>${Utils.formatStatus(st)}</option>
                            `).join('')}
                        </select>
                    ` : `
                        <span class="status-badge status-${item.status}">
                            ${Utils.formatStatus(item.status)}
                        </span>
                    `}
                </td>
                <td>
                    <div class="date-info">
                        <span>${Utils.formatDate(item.data_abertura)}</span>
                        <small class="text-gray-500 block">${Utils.formatTime(item.data_abertura)}</small>
                    </div>
                </td>
                <td>
                    ${item.mecanico_nome ? `
                        <div class="mechanic-info">
                            <i class="fas fa-user-hard-hat text-blue-500"></i>
                            <span>${item.mecanico_nome}</span>
                        </div>
                    ` : '<span class="text-gray-400">Não atribuído</span>'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-icon-primary" onclick="workOrdersPage.viewDetails(${item.id})" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${auth.hasPermission('pcm') ? `
                            <button class="btn-icon btn-icon-secondary" onclick="workOrdersPage.editWorkOrder(${item.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        ${item.status === 'concluida' ? `
                            <button class="btn-icon btn-icon-success" onclick="workOrdersPage.printWorkOrder(${item.id})" title="Imprimir">
                                <i class="fas fa-print"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    updateTableInfo() {
        const tableInfo = document.querySelector('#table-info');
        if (tableInfo) {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
            const endIndex = Math.min(startIndex + this.itemsPerPage - 1, this.filteredData.length);
            
            tableInfo.textContent = this.filteredData.length === 0 
                ? 'Nenhum registro encontrado'
                : `Mostrando ${startIndex} a ${endIndex} de ${this.filteredData.length} registros`;
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
                    onclick="workOrdersPage.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Botões de página
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="workOrdersPage.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="workOrdersPage.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="workOrdersPage.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // Botão próximo
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="workOrdersPage.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    updateStats() {
        const stats = {
            abertas: this.data.filter(item => item.status === 'aberta').length,
            execucao: this.data.filter(item => item.status === 'em_execucao').length,
            criticas: this.data.filter(item => item.prioridade === 'critica' && item.status !== 'concluida').length,
            concluidas: this.data.filter(item => {
                if (item.status !== 'concluida') return false;
                const dataEncerramento = new Date(item.data_encerramento);
                const agora = new Date();
                const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
                return dataEncerramento >= inicioMes;
            }).length
        };

        document.querySelector('#stat-abertas').textContent = stats.abertas;
        document.querySelector('#stat-execucao').textContent = stats.execucao;
        document.querySelector('#stat-criticas').textContent = stats.criticas;
        document.querySelector('#stat-concluidas').textContent = stats.concluidas;
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
        // Carregar equipamentos, tipos de manutenção e mecânicos
        const equipResponse = await API.equipments.getAll();
        const maintenanceTypes = await API.maintenanceTypes.getAll();
        const mechanicsResponse = await API.mechanics.getAll();

        const equipments = equipResponse.equipamentos || equipResponse.data || [];
        const types = maintenanceTypes.tipos_manutencao || maintenanceTypes.data || [];
        const mechanics = mechanicsResponse.mecanicos || mechanicsResponse.data || [];

        // Criar overlay e modal
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <h2>Criar Ordem de Serviço</h2>
            <form id="newWorkOrderForm">
                <label>Equipamento*</label>
                <select name="equipamento_id" required>
                    <option value="">Selecione...</option>
                    ${equipments.map(e => `<option value="${e.id}">${e.nome || e.modelo || e.codigo_interno}</option>`).join('')}
                </select>

                <label>Tipo de Manutenção*</label>
                <select name="tipo" required>
                    <option value="">Selecione...</option>
                    ${types.map(t => `<option value="${t.id}">${t.nome}</option>`).join('')}
                </select>

                <label>Prioridade*</label>
                <select name="prioridade" required>
                    <option value="">Selecione...</option>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                </select>

                <label>Mecânico (opcional)</label>
                <select name="mecanico_id">
                    <option value="">Nenhum</option>
                    ${mechanics.map(m => `<option value="${m.id}">${m.nome_completo || m.nome}</option>`).join('')}
                </select>

                <label>Data Prevista</label>
                <input type="datetime-local" name="data_prevista" />

                <label>Descrição do Problema*</label>
                <textarea name="descricao_problema" rows="3" required></textarea>

                <label>Observações</label>
                <textarea name="observacoes" rows="2"></textarea>

                <div class="form-actions">
                    <button type="submit">Salvar</button>
                    <button type="button" id="cancelNewWorkOrder">Cancelar</button>
                </div>
            </form>
        `;
        overlay.appendChild(modal);
        (document.getElementById('modals-container') || document.body).appendChild(overlay);

        // Estilos (ou mova para CSS)
        if (!document.getElementById('workorder-modal-style')) {
            const style = document.createElement('style');
            style.id = 'workorder-modal-style';
            style.textContent = `
                .custom-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: rgba(0,0,0,0.5);
                    z-index: 10000;
                }
                .custom-modal {
                    background: #fff;
                    padding: 20px;
                    border-radius: 4px;
                    width: 450px;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                .custom-modal form {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .custom-modal .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
            `;
            document.head.appendChild(style);
        }

        // Cancelar: remover modal
        modal.querySelector('#cancelNewWorkOrder').addEventListener('click', () => {
            overlay.remove();
        });

        // Submissão: enviar à API
        modal.querySelector('#newWorkOrderForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const payload = {
                equipamento_id: parseInt(formData.get('equipamento_id')),
                tipo: formData.get('tipo'),
                prioridade: formData.get('prioridade'),
                mecanico_id: formData.get('mecanico_id') ? parseInt(formData.get('mecanico_id')) : null,
                data_prevista: formData.get('data_prevista') ? new Date(formData.get('data_prevista')).toISOString().slice(0,19).replace('T',' ') : null,
                descricao_problema: formData.get('descricao_problema'),
                observacoes: formData.get('observacoes') || null
            };
            try {
                await API.workOrders.create(payload);
                Toast.success('Ordem de serviço criada com sucesso!');
                overlay.remove();
                await this.refresh(); // Atualiza a listagem
            } catch (error) {
                Toast.error(error.message || 'Erro ao criar OS.');
                console.error(error);
            }
        });
    } catch (err) {
        console.error('Erro ao preparar modal de criação:', err);
        Toast.error(err.message || 'Erro ao preparar modal.');
    }
}

    async viewDetails(id) {
        try {
            const data = await API.workOrders.get(id);
            const os = data.ordem_servico || data;

            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            modal.innerHTML = `
                <h2>Detalhes da OS</h2>
                <div class="workorder-details">
                    <p><strong>Número:</strong> ${os.numero_os}</p>
                    <p><strong>Status:</strong> ${Utils.formatStatus(os.status)}</p>
                    <p><strong>Prioridade:</strong> ${Utils.formatPriority(os.prioridade)}</p>
                    <p><strong>Equipamento:</strong> ${os.equipamento?.nome || os.equipamento_nome || '-'}</p>
                    <p><strong>Mecânico:</strong> ${os.mecanico?.nome_completo || os.mecanico_nome || 'Não atribuído'}</p>
                    <p><strong>Data de Abertura:</strong> ${Utils.formatDate(os.data_abertura)} ${Utils.formatTime(os.data_abertura)}</p>
                    ${os.data_prevista ? `<p><strong>Data Prevista:</strong> ${Utils.formatDate(os.data_prevista)} ${Utils.formatTime(os.data_prevista)}</p>` : ''}
                    <p><strong>Descrição:</strong> ${os.descricao_problema || '-'}</p>
                    ${os.descricao_solucao ? `<p><strong>Solução:</strong> ${os.descricao_solucao}</p>` : ''}
                </div>
                <div class="form-actions"><button id="closeWorkOrderDetails">Fechar</button></div>
            `;

            overlay.appendChild(modal);
            (document.getElementById('modals-container') || document.body).appendChild(overlay);

            modal.querySelector('#closeWorkOrderDetails').addEventListener('click', () => overlay.remove());

            if (!document.getElementById('workorder-modal-style')) {
                const style = document.createElement('style');
                style.id = 'workorder-modal-style';
                style.textContent = `
                    .custom-modal-overlay {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background: rgba(0,0,0,0.5);
                        z-index: 10000;
                    }
                    .custom-modal {
                        background: #fff;
                        padding: 20px;
                        border-radius: 4px;
                        width: 450px;
                        max-height: 80vh;
                        overflow-y: auto;
                    }
                    .custom-modal .form-actions {
                        display: flex;
                        justify-content: flex-end;
                        margin-top: 10px;
                    }
                `;
                document.head.appendChild(style);
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes da OS:', error);
            Toast.error(error.message || 'Erro ao carregar detalhes');
        }
    }

    async printWorkOrder(id) {
        try {
            const blob = await API.workOrders.print(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `OS_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao gerar PDF da OS:', error);
            Toast.error(error.message || 'Erro ao gerar PDF');
        }
    }

    async updateStatus(id, status) {
        try {
            await API.workOrders.updateStatus(id, { status });
            Toast.success('Status atualizado com sucesso');
            await this.refresh();
        } catch (error) {
            console.error('Erro ao atualizar status da OS:', error);
            Toast.error(error.message || 'Erro ao atualizar status');
        }
    }

    async editWorkOrder(id) {
        try {
            // Carregar dados necessários em paralelo
            const [osResponse, equipResponse, maintenanceTypes, mechanicsResponse] = await Promise.all([
                API.workOrders.get(id),
                API.equipments.getAll(),
                API.maintenanceTypes.getAll(),
                API.mechanics.getAll()
            ]);

            const os = osResponse.data || osResponse;
            const equipments = equipResponse.equipamentos || equipResponse.data || [];
            const types = maintenanceTypes.tipos_manutencao || maintenanceTypes.data || [];
            const mechanics = mechanicsResponse.mecanicos || mechanicsResponse.data || [];

            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            modal.innerHTML = `
                <h2>Editar Ordem de Serviço</h2>
                <form id="editWorkOrderForm">
                    <label>Equipamento*</label>
                    <select name="equipamento_id" required>
                        <option value="">Selecione...</option>
                        ${equipments.map(e => `<option value="${e.id}" ${e.id === os.equipamento_id ? 'selected' : ''}>${e.nome || e.modelo || e.codigo_interno}</option>`).join('')}
                    </select>

                    <label>Tipo de Manutenção*</label>
                    <select name="tipo" required>
                        <option value="">Selecione...</option>
                        ${types.map(t => `<option value="${t.id}" ${t.id === (os.tipo_manutencao_id || os.tipo) ? 'selected' : ''}>${t.nome}</option>`).join('')}
                    </select>

                    <label>Prioridade*</label>
                    <select name="prioridade" required>
                        <option value="">Selecione...</option>
                        <option value="baixa" ${os.prioridade === 'baixa' ? 'selected' : ''}>Baixa</option>
                        <option value="media" ${os.prioridade === 'media' ? 'selected' : ''}>Média</option>
                        <option value="alta" ${os.prioridade === 'alta' ? 'selected' : ''}>Alta</option>
                        <option value="critica" ${os.prioridade === 'critica' ? 'selected' : ''}>Crítica</option>
                    </select>

                    <label>Mecânico (opcional)</label>
                    <select name="mecanico_id">
                        <option value="">Nenhum</option>
                        ${mechanics.map(m => `<option value="${m.id}" ${m.id === os.mecanico_id ? 'selected' : ''}>${m.nome_completo || m.nome}</option>`).join('')}
                    </select>

                    <label>Data Prevista</label>
                    <input type="datetime-local" name="data_prevista" value="${os.data_prevista ? new Date(os.data_prevista).toISOString().slice(0,16) : ''}" />

                    <label>Descrição do Problema*</label>
                    <textarea name="descricao_problema" rows="3" required>${os.descricao_problema || ''}</textarea>

                    <label>Observações</label>
                    <textarea name="observacoes" rows="2">${os.observacoes || ''}</textarea>

                    <div class="form-actions">
                        <button type="submit">Salvar</button>
                        <button type="button" id="cancelEditWorkOrder">Cancelar</button>
                    </div>
                </form>
            `;

            overlay.appendChild(modal);
            (document.getElementById('modals-container') || document.body).appendChild(overlay);

            modal.querySelector('#cancelEditWorkOrder').addEventListener('click', () => overlay.remove());

            modal.querySelector('#editWorkOrderForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const payload = {
                    equipamento_id: parseInt(formData.get('equipamento_id')),
                    tipo: formData.get('tipo'),
                    prioridade: formData.get('prioridade'),
                    mecanico_id: formData.get('mecanico_id') ? parseInt(formData.get('mecanico_id')) : null,
                    data_prevista: formData.get('data_prevista') ? new Date(formData.get('data_prevista')).toISOString().slice(0,19).replace('T',' ') : null,
                    descricao_problema: formData.get('descricao_problema'),
                    observacoes: formData.get('observacoes') || null
                };
                try {
                    await API.workOrders.update(id, payload);
                    Toast.success('Ordem de serviço atualizada com sucesso!');
                    overlay.remove();
                    await this.refresh();
                } catch (error) {
                    console.error(error);
                    Toast.error(error.message || 'Erro ao atualizar OS.');
                }
            });
        } catch (err) {
            console.error('Erro ao preparar modal de edição:', err);
            Toast.error(err.message || 'Erro ao preparar modal.');
        }
    }
}

// Exportar a classe para uso global
window.WorkOrdersPage = WorkOrdersPage;
