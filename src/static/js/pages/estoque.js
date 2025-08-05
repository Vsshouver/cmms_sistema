// Página de Estoque com AG-Grid
class InventoryPage {
    constructor() {
        this.gridApi = null;
        this.gridColumnApi = null;
        this.data = [];
        this.itemGroups = [];
    }

    async render(container) {
        try {
            // Mostrar loading
            container.innerHTML = this.getLoadingHTML();

            // Carregar dados
            await this.loadData();
            await this.loadItemGroups();

            // Renderizar conteúdo
            container.innerHTML = this.getHTML();

            // Configurar AG-Grid
            this.setupGrid(container);

            // Configurar eventos
            this.setupEvents(container);

        } catch (error) {
            console.error('Erro ao carregar estoque:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.inventory.getAll();
            this.data = Array.isArray(response) ? response : (response.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.data = [];
            throw error;
        }
    }

    async loadItemGroups() {
        try {
            const response = await API.itemGroups.getAll();
            this.itemGroups = Array.isArray(response) ? response : (response.data || []);
        } catch (error) {
            console.error('Erro ao carregar grupos de item:', error);
            this.itemGroups = [];
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
                            <h1>Estoque</h1>
                            <p>Gerencie o estoque de peças e materiais</p>
                        </div>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-outline" id="refresh-data">
                            <i class="fas fa-sync-alt"></i>
                            Atualizar
                        </button>
                        <button class="btn btn-outline" id="export-data">
                            <i class="fas fa-download"></i>
                            Exportar
                        </button>
                        <button class="btn btn-outline" id="movement-history">
                            <i class="fas fa-history"></i>
                            Movimentações
                        </button>
                        <button class="btn btn-primary" id="create-item" ${!auth.hasPermission('admin') ? 'style="display: none;"' : ''}>
                            <i class="fas fa-plus"></i>
                            Nova Peça
                        </button>
                    </div>
                </div>

                <!-- Estatísticas rápidas -->
                <div class="quick-stats">
                    <div class="stat-card stat-card-info">
                        <div class="stat-icon">
                            <i class="fas fa-boxes"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-total">0</div>
                            <div class="stat-label">Total de Itens</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-success">
                        <div class="stat-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-disponivel">0</div>
                            <div class="stat-label">Disponível</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-warning">
                        <div class="stat-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-baixo">0</div>
                            <div class="stat-label">Estoque Baixo</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-danger">
                        <div class="stat-icon">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-zerado">0</div>
                            <div class="stat-label">Zerado</div>
                        </div>
                    </div>
                </div>

                <!-- Grid Container -->
                <div class="grid-container">
                    <div id="inventory-grid" class="ag-theme-alpine" style="height: 600px; width: 100%;"></div>
                </div>
            </div>
        `;
    }

    setupGrid(container) {
        const gridContainer = container.querySelector('#inventory-grid');
        
        const columnDefs = [
            {
                headerName: 'Peça',
                field: 'nome',
                minWidth: 200,
                cellRenderer: (params) => {
                    return `
                        <div class="item-cell">
                            <div class="item-name">${params.value || ''}</div>
                            <div class="item-code">${params.data.codigo || ''}</div>
                        </div>
                    `;
                }
            },
            {
                headerName: 'Grupo',
                field: 'grupo_nome',
                minWidth: 150,
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: this.itemGroups.map(group => group.nome)
                }
            },
            {
                headerName: 'Unidade',
                field: 'unidade',
                minWidth: 100,
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: ['UN', 'KG', 'L', 'M', 'M²', 'M³', 'PC', 'CX', 'GL']
                }
            },
            {
                headerName: 'Quantidade',
                field: 'quantidade',
                minWidth: 120,
                type: 'numericColumn',
                cellRenderer: (params) => {
                    const quantidade = params.value || 0;
                    const minimo = params.data.quantidade_minima || 0;
                    
                    let className = 'quantity-normal';
                    if (quantidade === 0) {
                        className = 'quantity-zero';
                    } else if (quantidade <= minimo) {
                        className = 'quantity-low';
                    }
                    
                    return `<span class="${className}">${quantidade}</span>`;
                },
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: 'Mínimo',
                field: 'quantidade_minima',
                minWidth: 100,
                type: 'numericColumn',
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: 'Máximo',
                field: 'quantidade_maxima',
                minWidth: 100,
                type: 'numericColumn',
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: 'Valor Unit.',
                field: 'valor_unitario',
                minWidth: 120,
                type: 'numericColumn',
                cellRenderer: AGGridConfig.formatters.currency,
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: 'Valor Total',
                field: 'valor_total',
                minWidth: 120,
                type: 'numericColumn',
                cellRenderer: AGGridConfig.formatters.currency,
                valueGetter: (params) => {
                    const quantidade = params.data.quantidade || 0;
                    const valorUnitario = params.data.valor_unitario || 0;
                    return quantidade * valorUnitario;
                },
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: 'Localização',
                field: 'localizacao',
                minWidth: 150
            },
            {
                headerName: 'Status',
                field: 'status',
                minWidth: 100,
                cellRenderer: (params) => {
                    const quantidade = params.data.quantidade || 0;
                    const minimo = params.data.quantidade_minima || 0;
                    
                    if (quantidade === 0) {
                        return '<span class="status-badge status-danger">Zerado</span>';
                    } else if (quantidade <= minimo) {
                        return '<span class="status-badge status-warning">Baixo</span>';
                    } else {
                        return '<span class="status-badge status-success">Disponível</span>';
                    }
                },
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: ['Disponível', 'Baixo', 'Zerado'],
                    valueFormatter: (params) => params.value
                }
            },
            {
                headerName: 'Última Movimentação',
                field: 'ultima_movimentacao',
                minWidth: 150,
                cellRenderer: AGGridConfig.formatters.date,
                filter: 'agDateColumnFilter'
            },
            {
                headerName: 'Ações',
                field: 'actions',
                minWidth: 180,
                maxWidth: 180,
                sortable: false,
                filter: false,
                resizable: false,
                pinned: 'right',
                cellRenderer: (params) => {
                    const canEdit = auth.hasPermission('admin') || auth.hasPermission('edit');
                    const canDelete = auth.hasPermission('admin');
                    const canMove = auth.hasPermission('almoxarife') || auth.hasPermission('admin');
                    
                    let html = '<div class="ag-actions">';
                    
                    html += `<button class="btn-action btn-view" onclick="inventoryPage.viewItem(${params.data.id})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>`;
                    
                    if (canMove) {
                        html += `<button class="btn-action btn-move" onclick="inventoryPage.showMovementModal(${params.data.id})" title="Movimentar">
                            <i class="fas fa-exchange-alt"></i>
                        </button>`;
                    }
                    
                    if (canEdit) {
                        html += `<button class="btn-action btn-edit" onclick="inventoryPage.editItem(${params.data.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>`;
                    }
                    
                    if (canDelete) {
                        html += `<button class="btn-action btn-delete" onclick="inventoryPage.deleteItem(${params.data.id})" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>`;
                    }
                    
                    html += '</div>';
                    return html;
                }
            }
        ];

        const gridOptions = {
            ...AGGridConfig.getDefaultOptions(),
            columnDefs: columnDefs,
            rowData: this.data,
            onGridReady: (params) => {
                this.gridApi = params.api;
                this.gridColumnApi = params.columnApi;
                this.updateStats();
                
                // Auto-size columns
                params.api.sizeColumnsToFit();
            },
            onSelectionChanged: () => {
                this.updateSelectionInfo();
            },
            onFilterChanged: () => {
                this.updateStats();
            },
            // Configurações específicas
            rowSelection: 'multiple',
            suppressRowClickSelection: true,
            enableRangeSelection: true,
            enableCharts: true,
            sideBar: {
                toolPanels: [
                    {
                        id: 'columns',
                        labelDefault: 'Colunas',
                        labelKey: 'columns',
                        iconKey: 'columns',
                        toolPanel: 'agColumnsToolPanel'
                    },
                    {
                        id: 'filters',
                        labelDefault: 'Filtros',
                        labelKey: 'filters',
                        iconKey: 'filter',
                        toolPanel: 'agFiltersToolPanel'
                    }
                ],
                defaultToolPanel: 'columns'
            }
        };

        this.grid = AGGridConfig.createGrid(gridContainer, gridOptions);
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

        // Botão de movimentações
        const movementBtn = container.querySelector('#movement-history');
        if (movementBtn) {
            movementBtn.addEventListener('click', () => navigation.navigateTo('movimentacoes'));
        }

        // Botão de nova peça
        const createBtn = container.querySelector('#create-item');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }
    }

    async refresh() {
        try {
            await this.loadData();
            if (this.gridApi) {
                this.gridApi.setRowData(this.data);
                this.updateStats();
            }
            Utils.showToast('Dados atualizados com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            Utils.showToast('Erro ao atualizar dados', 'error');
        }
    }

    exportData() {
        if (this.gridApi) {
            this.gridApi.exportDataAsCsv({
                fileName: `estoque_${new Date().toISOString().split('T')[0]}.csv`,
                columnSeparator: ';'
            });
        }
    }

    updateStats() {
        let stats = {
            total: this.data.length,
            disponivel: 0,
            baixo: 0,
            zerado: 0
        };

        this.data.forEach(item => {
            const quantidade = item.quantidade || 0;
            const minimo = item.quantidade_minima || 0;
            
            if (quantidade === 0) {
                stats.zerado++;
            } else if (quantidade <= minimo) {
                stats.baixo++;
            } else {
                stats.disponivel++;
            }
        });

        // Se há filtros aplicados, usar dados filtrados
        if (this.gridApi) {
            const filteredData = [];
            this.gridApi.forEachNodeAfterFilter(node => {
                filteredData.push(node.data);
            });
            
            if (filteredData.length !== this.data.length) {
                stats = {
                    total: filteredData.length,
                    disponivel: 0,
                    baixo: 0,
                    zerado: 0
                };

                filteredData.forEach(item => {
                    const quantidade = item.quantidade || 0;
                    const minimo = item.quantidade_minima || 0;
                    
                    if (quantidade === 0) {
                        stats.zerado++;
                    } else if (quantidade <= minimo) {
                        stats.baixo++;
                    } else {
                        stats.disponivel++;
                    }
                });
            }
        }

        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-disponivel').textContent = stats.disponivel;
        document.getElementById('stat-baixo').textContent = stats.baixo;
        document.getElementById('stat-zerado').textContent = stats.zerado;
    }

    updateSelectionInfo() {
        if (this.gridApi) {
            const selectedRows = this.gridApi.getSelectedRows();
            console.log('Itens selecionados:', selectedRows.length);
        }
    }

    // Métodos de ação
    viewItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            this.showViewModal(item);
        }
    }

    editItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            this.showEditModal(item);
        }
    }

    async deleteItem(id) {
        const item = this.data.find(item => item.id === id);
        if (!item) return;

        const confirmed = await Utils.showConfirm(
            'Confirmar Exclusão',
            `Tem certeza que deseja excluir a peça "${item.nome}"?`,
            'Excluir',
            'Cancelar'
        );

        if (confirmed) {
            try {
                await API.inventory.delete(id);
                await this.refresh();
                Utils.showToast('Peça excluída com sucesso', 'success');
            } catch (error) {
                console.error('Erro ao excluir peça:', error);
                Utils.showToast('Erro ao excluir peça', 'error');
            }
        }
    }

    showCreateModal() {
        const modal = new InventoryItemModal();
        modal.show({
            title: 'Nova Peça',
            item: null,
            itemGroups: this.itemGroups,
            onSave: async (data) => {
                try {
                    await API.inventory.create(data);
                    await this.refresh();
                    Utils.showToast('Peça criada com sucesso', 'success');
                    modal.hide();
                } catch (error) {
                    console.error('Erro ao criar peça:', error);
                    Utils.showToast('Erro ao criar peça', 'error');
                }
            }
        });
    }

    showEditModal(item) {
        const modal = new InventoryItemModal();
        modal.show({
            title: 'Editar Peça',
            item: item,
            itemGroups: this.itemGroups,
            onSave: async (data) => {
                try {
                    await API.inventory.update(item.id, data);
                    await this.refresh();
                    Utils.showToast('Peça atualizada com sucesso', 'success');
                    modal.hide();
                } catch (error) {
                    console.error('Erro ao atualizar peça:', error);
                    Utils.showToast('Erro ao atualizar peça', 'error');
                }
            }
        });
    }

    showViewModal(item) {
        const modal = new InventoryItemViewModal();
        modal.show(item);
    }

    showMovementModal(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            const modal = new InventoryMovementModal();
            modal.show({
                item: item,
                onSave: async (data) => {
                    try {
                        await API.inventory.movement(id, data);
                        await this.refresh();
                        Utils.showToast('Movimentação registrada com sucesso', 'success');
                        modal.hide();
                    } catch (error) {
                        console.error('Erro ao registrar movimentação:', error);
                        Utils.showToast('Erro ao registrar movimentação', 'error');
                    }
                }
            });
        }
    }
}

// Expose the page class globally
window.InventoryPage = InventoryPage;

// Modal de Item de Estoque
class InventoryItemModal {
    show(options) {
        this.options = options;
        this.render();
    }

    render() {
        const { title, item, itemGroups } = this.options;
        const isEdit = !!item;

        const modalHTML = `
            <div class="modal-overlay" id="inventory-item-modal">
                <div class="modal-container modal-lg">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="inventory-item-form" class="form-grid">
                            <div class="form-group">
                                <label for="nome">Nome *</label>
                                <input type="text" id="nome" name="nome" class="form-input" required 
                                       value="${item?.nome || ''}" placeholder="Nome da peça">
                            </div>
                            
                            <div class="form-group">
                                <label for="codigo">Código</label>
                                <input type="text" id="codigo" name="codigo" class="form-input" 
                                       value="${item?.codigo || ''}" placeholder="Código da peça">
                            </div>
                            
                            <div class="form-group">
                                <label for="grupo_item_id">Grupo *</label>
                                <select id="grupo_item_id" name="grupo_item_id" class="form-select" required>
                                    <option value="">Selecione o grupo</option>
                                    ${itemGroups.map(group => 
                                        `<option value="${group.id}" ${item?.grupo_item_id == group.id ? 'selected' : ''}>
                                            ${group.nome}
                                        </option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="unidade">Unidade *</label>
                                <select id="unidade" name="unidade" class="form-select" required>
                                    <option value="">Selecione a unidade</option>
                                    <option value="UN" ${item?.unidade === 'UN' ? 'selected' : ''}>Unidade (UN)</option>
                                    <option value="KG" ${item?.unidade === 'KG' ? 'selected' : ''}>Quilograma (KG)</option>
                                    <option value="L" ${item?.unidade === 'L' ? 'selected' : ''}>Litro (L)</option>
                                    <option value="M" ${item?.unidade === 'M' ? 'selected' : ''}>Metro (M)</option>
                                    <option value="M²" ${item?.unidade === 'M²' ? 'selected' : ''}>Metro Quadrado (M²)</option>
                                    <option value="M³" ${item?.unidade === 'M³' ? 'selected' : ''}>Metro Cúbico (M³)</option>
                                    <option value="PC" ${item?.unidade === 'PC' ? 'selected' : ''}>Peça (PC)</option>
                                    <option value="CX" ${item?.unidade === 'CX' ? 'selected' : ''}>Caixa (CX)</option>
                                    <option value="GL" ${item?.unidade === 'GL' ? 'selected' : ''}>Galão (GL)</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="quantidade">Quantidade Atual</label>
                                <input type="number" id="quantidade" name="quantidade" class="form-input" 
                                       value="${item?.quantidade || 0}" min="0" step="0.01">
                            </div>
                            
                            <div class="form-group">
                                <label for="quantidade_minima">Quantidade Mínima</label>
                                <input type="number" id="quantidade_minima" name="quantidade_minima" class="form-input" 
                                       value="${item?.quantidade_minima || 0}" min="0" step="0.01">
                            </div>
                            
                            <div class="form-group">
                                <label for="quantidade_maxima">Quantidade Máxima</label>
                                <input type="number" id="quantidade_maxima" name="quantidade_maxima" class="form-input" 
                                       value="${item?.quantidade_maxima || 0}" min="0" step="0.01">
                            </div>
                            
                            <div class="form-group">
                                <label for="valor_unitario">Valor Unitário (R$)</label>
                                <input type="number" id="valor_unitario" name="valor_unitario" class="form-input" 
                                       value="${item?.valor_unitario || 0}" min="0" step="0.01">
                            </div>
                            
                            <div class="form-group">
                                <label for="localizacao">Localização</label>
                                <input type="text" id="localizacao" name="localizacao" class="form-input" 
                                       value="${item?.localizacao || ''}" placeholder="Ex: Prateleira A1">
                            </div>
                            
                            <div class="form-group form-group-full">
                                <label for="descricao">Descrição</label>
                                <textarea id="descricao" name="descricao" class="form-textarea" rows="3" 
                                          placeholder="Descrição da peça">${item?.descricao || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                            Cancelar
                        </button>
                        <button type="submit" form="inventory-item-form" class="btn btn-primary">
                            <i class="fas fa-save"></i>
                            ${isEdit ? 'Atualizar' : 'Criar'} Peça
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modals-container').innerHTML = modalHTML;
        
        // Configurar eventos
        const form = document.getElementById('inventory-item-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(form);
        });
    }

    handleSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validações
        if (!data.nome.trim()) {
            Utils.showToast('Nome é obrigatório', 'error');
            return;
        }
        
        if (!data.grupo_item_id) {
            Utils.showToast('Grupo é obrigatório', 'error');
            return;
        }
        
        if (!data.unidade) {
            Utils.showToast('Unidade é obrigatória', 'error');
            return;
        }

        this.options.onSave(data);
    }

    hide() {
        const modal = document.getElementById('inventory-item-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Modal de Visualização
class InventoryItemViewModal {
    show(item) {
        this.render(item);
    }

    render(item) {
        const modalHTML = `
            <div class="modal-overlay" id="inventory-item-view-modal">
                <div class="modal-container modal-lg">
                    <div class="modal-header">
                        <h3>Detalhes da Peça</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="item-details">
                            <div class="detail-section">
                                <h4>Informações Básicas</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Nome:</label>
                                        <span>${item.nome || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Código:</label>
                                        <span>${item.codigo || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Grupo:</label>
                                        <span>${item.grupo_nome || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Unidade:</label>
                                        <span>${item.unidade || '-'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Estoque</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Quantidade Atual:</label>
                                        <span class="quantity-value">${item.quantidade || 0}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Quantidade Mínima:</label>
                                        <span>${item.quantidade_minima || 0}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Quantidade Máxima:</label>
                                        <span>${item.quantidade_maxima || 0}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Status:</label>
                                        <span>${this.getStatusBadge(item)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Valores</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Valor Unitário:</label>
                                        <span>${AGGridConfig.formatters.currency({value: item.valor_unitario})}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Valor Total:</label>
                                        <span>${AGGridConfig.formatters.currency({value: (item.quantidade || 0) * (item.valor_unitario || 0)})}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Localização:</label>
                                        <span>${item.localizacao || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Última Movimentação:</label>
                                        <span>${item.ultima_movimentacao ? AGGridConfig.formatters.date({value: item.ultima_movimentacao}) : '-'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            ${item.descricao ? `
                            <div class="detail-section">
                                <h4>Descrição</h4>
                                <div class="detail-grid">
                                    <div class="detail-item detail-item-full">
                                        <span>${item.descricao}</span>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                            Fechar
                        </button>
                        ${auth.hasPermission('admin') || auth.hasPermission('edit') ? 
                            `<button type="button" class="btn btn-primary" onclick="inventoryPage.editItem(${item.id}); this.closest('.modal-overlay').remove();">
                                <i class="fas fa-edit"></i>
                                Editar
                            </button>` : ''
                        }
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modals-container').innerHTML = modalHTML;
    }

    getStatusBadge(item) {
        const quantidade = item.quantidade || 0;
        const minimo = item.quantidade_minima || 0;
        
        if (quantidade === 0) {
            return '<span class="status-badge status-danger">Zerado</span>';
        } else if (quantidade <= minimo) {
            return '<span class="status-badge status-warning">Baixo</span>';
        } else {
            return '<span class="status-badge status-success">Disponível</span>';
        }
    }
}

// Modal de Movimentação
class InventoryMovementModal {
    show(options) {
        this.options = options;
        this.render();
    }

    render() {
        const { item } = this.options;

        const modalHTML = `
            <div class="modal-overlay" id="inventory-movement-modal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>Movimentar Estoque</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="item-info">
                            <h4>${item.nome}</h4>
                            <p>Quantidade atual: <strong>${item.quantidade || 0} ${item.unidade}</strong></p>
                        </div>
                        
                        <form id="inventory-movement-form">
                            <div class="form-group">
                                <label for="tipo_movimentacao">Tipo de Movimentação *</label>
                                <select id="tipo_movimentacao" name="tipo_movimentacao" class="form-select" required>
                                    <option value="">Selecione o tipo</option>
                                    <option value="entrada">Entrada</option>
                                    <option value="saida">Saída</option>
                                    <option value="ajuste">Ajuste</option>
                                    <option value="transferencia">Transferência</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="quantidade">Quantidade *</label>
                                <input type="number" id="quantidade" name="quantidade" class="form-input" 
                                       step="0.01" min="0.01" required placeholder="Quantidade a movimentar">
                            </div>
                            
                            <div class="form-group">
                                <label for="motivo">Motivo *</label>
                                <select id="motivo" name="motivo" class="form-select" required>
                                    <option value="">Selecione o motivo</option>
                                    <option value="compra">Compra</option>
                                    <option value="devolucao">Devolução</option>
                                    <option value="uso_manutencao">Uso em Manutenção</option>
                                    <option value="perda">Perda</option>
                                    <option value="avaria">Avaria</option>
                                    <option value="inventario">Inventário</option>
                                    <option value="transferencia">Transferência</option>
                                    <option value="outros">Outros</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="observacoes">Observações</label>
                                <textarea id="observacoes" name="observacoes" class="form-textarea" rows="3" 
                                          placeholder="Observações sobre a movimentação"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                            Cancelar
                        </button>
                        <button type="submit" form="inventory-movement-form" class="btn btn-primary">
                            <i class="fas fa-exchange-alt"></i>
                            Registrar Movimentação
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modals-container').innerHTML = modalHTML;
        
        // Configurar eventos
        const form = document.getElementById('inventory-movement-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(form);
        });
    }

    handleSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validações
        if (!data.tipo_movimentacao) {
            Utils.showToast('Tipo de movimentação é obrigatório', 'error');
            return;
        }
        
        if (!data.quantidade || parseFloat(data.quantidade) <= 0) {
            Utils.showToast('Quantidade deve ser maior que zero', 'error');
            return;
        }
        
        if (!data.motivo) {
            Utils.showToast('Motivo é obrigatório', 'error');
            return;
        }

        this.options.onSave(data);
    }

    hide() {
        const modal = document.getElementById('inventory-movement-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Instância global
let inventoryPage = null;

// Registrar página
window.pages = window.pages || {};
window.pages.estoque = {
    render: async (container) => {
        inventoryPage = new InventoryPage();
        await inventoryPage.render(container);
    }
};

